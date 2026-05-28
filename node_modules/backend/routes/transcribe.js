/**
 * transcribe.js
 * Backend route: POST /api/transcribe
 *
 * Leverages the Speechmatics Batch API (batch.yaml spec) to:
 *  1. POST /jobs  — submit audio + JobConfig (multipart/form-data)
 *  2. GET  /jobs/{jobid} — poll for status (done | rejected | deleted | expired)
 *  3. GET  /jobs/{jobid}/transcript?format=json-v2 — fetch full RecognitionResult[]
 *
 * Analysis:
 *  - Disfluency/filler words: tagged by Speechmatics when
 *    transcript_filtering_config.remove_disfluencies = false (default).
 *    Tagged words appear with alternatives[0].tags containing "disfluency".
 *  - Pauses: computed from gaps between consecutive word end_time → next start_time
 *    Any gap > PAUSE_THRESHOLD_SECS is counted as a significant pause.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');

// ── Config ────────────────────────────────────────────────────────────────────
const SM_API_KEY = 'SsPKAI7G2Lv4AwxYWIT6qiWgCeSnzVbK';
const SM_BASE_URL = 'https://asr.api.speechmatics.com/v2';  // Batch API per batch.yaml basePath
const PAUSE_THRESHOLD_SECS = 1.5;  // Gap > 1.5s between words = significant pause
const POLL_INTERVAL_MS = 3000;     // Poll status every 3 seconds
const MAX_POLLS = 60;              // Max 3 minutes of polling

// multer — memory storage (no disk writes)
const upload = multer({ storage: multer.memoryStorage() });

// ── Helper: sleep ─────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ── POST /api/transcribe ──────────────────────────────────────────────────────
router.post('/', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided.' });
  }

  console.log(`[SM] Received audio: ${req.file.size} bytes, mimetype: ${req.file.mimetype}`);

  try {
    // ── Step 1: Submit job via POST /jobs ─────────────────────────────────────
    // JobConfig per batch.yaml §JobConfig schema:
    //   - type: "transcription"
    //   - transcription_config:
    //       language, operating_point, diarization
    //       transcript_filtering_config.remove_disfluencies = false
    //         → keeps disfluencies in transcript AND tags them
    const jobConfig = {
      type: 'transcription',
      transcription_config: {
        language: 'en',
        operating_point: 'enhanced',   // More accurate; slower
        diarization: 'none',
        transcript_filtering_config: {
          remove_disfluencies: false,   // Keep um/uh, tag them as disfluency
        },
      },
    };

    const submitForm = new FormData();
    const ext = req.file.mimetype === 'audio/wav' ? 'wav' : 'webm';
    submitForm.append('data_file', req.file.buffer, {
      filename: `recording.${ext}`,
      contentType: req.file.mimetype || 'audio/webm',
    });
    submitForm.append('config', JSON.stringify(jobConfig));

    const submitRes = await fetch(`${SM_BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SM_API_KEY}`,
        ...submitForm.getHeaders(),
      },
      body: submitForm,
    });

    const submitData = await submitRes.json();

    if (!submitRes.ok) {
      console.error('[SM] Job submission failed:', submitData);
      return res.status(502).json({
        error: 'Speechmatics job submission failed.',
        details: submitData,
      });
    }

    const jobId = submitData.id;
    console.log(`[SM] Job submitted: ${jobId}`);

    // ── Step 2: Poll GET /jobs/{jobid} for completion ─────────────────────────
    // Status enum per batch.yaml §JobDetails: running | done | rejected | deleted | expired
    let status = 'running';
    let polls = 0;

    while (polls < MAX_POLLS) {
      await sleep(POLL_INTERVAL_MS);
      polls++;

      const pollRes = await fetch(`${SM_BASE_URL}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${SM_API_KEY}` },
      });
      const pollData = await pollRes.json();
      status = pollData.job?.status;

      console.log(`[SM] Poll #${polls}: job ${jobId} status = ${status}`);

      if (status === 'done') break;

      if (status === 'rejected' || status === 'deleted' || status === 'expired') {
        return res.status(502).json({
          error: `Speechmatics job ended with status: ${status}`,
          details: pollData,
        });
      }
    }

    if (status !== 'done') {
      return res.status(504).json({ error: 'Speechmatics job timed out.' });
    }

    // ── Step 3: Fetch transcript GET /jobs/{jobid}/transcript?format=json-v2 ──
    // Response schema per batch.yaml §RetrieveTranscriptResponse:
    //   results: RecognitionResult[]
    //     each: { type, start_time, end_time, alternatives: [{ content, tags? }] }
    //   type values: "word" | "punctuation" | "entity"
    //   disfluency tag: alternatives[0].tags includes "disfluency"
    const transcriptRes = await fetch(
      `${SM_BASE_URL}/jobs/${jobId}/transcript?format=json-v2`,
      { headers: { Authorization: `Bearer ${SM_API_KEY}` } }
    );
    const transcriptData = await transcriptRes.json();

    if (!transcriptRes.ok) {
      console.error('[SM] Transcript fetch failed:', transcriptData);
      return res.status(502).json({ error: 'Failed to fetch transcript.', details: transcriptData });
    }

    const results = transcriptData.results || [];
    console.log(`[SM] Transcript fetched. Total result items: ${results.length}`);

    // ── Analysis ──────────────────────────────────────────────────────────────

    // 1. Build readable transcript text (words + punctuation, skip entity duplicates)
    const transcriptText = results
      .filter(r => r.type === 'word' || r.type === 'punctuation' || r.type === 'disfluency')
      .map(r => {
        const content = r.alternatives?.[0]?.content || '';
        // Punctuation attaches to adjacent word without a space
        return r.type === 'punctuation' ? content : ` ${content}`;
      })
      .join('')
      .trim();

    // 2. Identify disfluency/filler words
    //    Speechmatics marks them with alternatives[0].tags containing "disfluency"
    //    OR result type is "disfluency"
    const fillerInstances = [];
    results.forEach(r => {
      const tags = r.alternatives?.[0]?.tags || [];
      const isDisfluency =
        r.type === 'disfluency' ||
        (Array.isArray(tags) && tags.includes('disfluency'));

      if (isDisfluency) {
        fillerInstances.push({
          word: r.alternatives?.[0]?.content || '',
          time: r.start_time,
        });
      }
    });

    // 3. Detect significant pauses between consecutive word-type results
    //    Only compare actual spoken words (type: word or disfluency), skip punctuation
    const spokenResults = results.filter(
      r => r.type === 'word' || r.type === 'disfluency'
    );

    const pauseInstances = [];
    for (let i = 0; i < spokenResults.length - 1; i++) {
      const curr = spokenResults[i];
      const next = spokenResults[i + 1];
      if (curr.end_time != null && next.start_time != null) {
        const gap = next.start_time - curr.end_time;
        if (gap >= PAUSE_THRESHOLD_SECS) {
          pauseInstances.push({
            duration: gap.toFixed(2),
            after: curr.alternatives?.[0]?.content || '',
            time: curr.end_time,
          });
        }
      }
    }

    // 4. Total audio duration
    const lastResult = spokenResults[spokenResults.length - 1];
    const duration = lastResult ? Math.round(lastResult.end_time) : 0;

    const response = {
      transcript: transcriptText || 'No speech detected.',
      fillersCount: fillerInstances.length,
      fillerInstances,
      pausesCount: pauseInstances.length,
      pauseInstances,
      duration,
    };

    console.log(`[SM] Analysis: ${fillerInstances.length} fillers, ${pauseInstances.length} pauses, ${duration}s`);
    return res.json(response);

  } catch (err) {
    console.error('[SM] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error during transcription.', details: err.message });
  }
});

module.exports = router;
