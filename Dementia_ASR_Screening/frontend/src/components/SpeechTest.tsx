/**
 * SpeechTest.tsx
 *
 * Records audio using raw PCM samples from standard Web Audio API and
 * encodes them inline into a standard 16-bit PCM WAV format.
 *
 * This WAV format is natively and flawlessly supported by Speechmatics Batch API,
 * resolving the "Job rejected due to invalid audio" error seen with WebM files.
 *
 * Flow:
 *  1. getUserMedia captures raw audio stream
 *  2. AudioContext + ScriptProcessorNode records raw Float32 mono samples
 *  3. On stop:
 *     - Merge collected Float32 chunks
 *     - Encode into standard 16-bit PCM WAV (44 bytes header + raw data)
 *     - Submit WAV blob (mimetype: audio/wav) to backend proxy at POST /api/transcribe
 *  4. Backend polls Speechmatics Batch API and returns the full analysis
 *  5. DB record saved, navigate to report
 */

import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, Square, AlertCircle, Loader, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';

// ── Theme Data ─────────────────────────────────────────────────────────────────
const themeImages: Record<string, string> = {
  'nature':           'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=800',
  'daily-life':       'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
  'abstract':         'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=800',
  'family-memories':  'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800',
  'hobbies-leisure':  'https://images.unsplash.com/photo-1447078806655-409295609816?auto=format&fit=crop&q=80&w=800',
  'travel-adventure': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800',
};

const themePrompts: Record<string, string> = {
  'nature':           'Look at this peaceful nature scene. Describe what you see — the colors, the landscape, the mood.',
  'daily-life':       'Describe this busy restaurant or cafe scene in detail. What is happening? Tell us what you notice.',
  'abstract':         'Describe what you see in this abstract painting. What does it remind you of? What feelings does it evoke?',
  'family-memories':  'Look at this warm family dinner. Talk about your favorite family traditions, sweet holiday memories, or childhood moments.',
  'hobbies-leisure':  'Look at this cozy crafting workbench. Talk about your favorite pastime, gardening, or a leisure activity you enjoy.',
  'travel-adventure': 'Look at this breathtaking scenic outdoor trail. Describe a memorable journey or an adventure you would love to take.',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const ANALYSIS_STEPS = [
  'Preparing high-fidelity WAV...',
  'Submitting to Speechmatics...',
  'Processing audio (this may take ~30s)...',
  'Detecting fillers & pauses...',
  'Saving results...',
];

// ── WAV Encoding Utilities ──────────────────────────────────────────────────────
function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // File length
  view.setUint32(4, 36 + samples.length * 2, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // Format chunk identifier
  writeString(view, 12, 'fmt ');
  // Format chunk length
  view.setUint32(16, 16, true);
  // Sample format (1 = raw PCM)
  view.setUint16(20, 1, true);
  // Channel count (1 = mono)
  view.setUint16(22, 1, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate (sampleRate * blockAlign)
  view.setUint32(28, sampleRate * 2, true);
  // Block align (channelCount * bytes per sample)
  view.setUint16(32, 2, true);
  // Bits per sample (16 bit)
  view.setUint16(34, 16, true);
  // Data chunk identifier
  writeString(view, 36, 'data');
  // Data chunk length
  view.setUint32(40, samples.length * 2, true);

  // Write PCM audio samples
  floatTo16BitPCM(view, 44, samples);

  return new Blob([view], { type: 'audio/wav' });
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
const SpeechTest: React.FC = () => {
  const { theme } = useParams<{ theme: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isRecording, setIsRecording]   = useState(false);
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [stepIndex, setStepIndex]       = useState(0);
  const [error, setError]               = useState('');
  const [recordingTime, setRecordingTime] = useState(0);

  // References for Web Audio API recording
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef    = useRef<ScriptProcessorNode | null>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const audioChunksRef  = useRef<Float32Array[]>([]);
  const startTimeRef     = useRef<number>(0);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start Recording ──────────────────────────────────────────────────────────
  const startRecording = async () => {
    setError('');
    audioChunksRef.current = [];
    setRecordingTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // Create a ScriptProcessorNode with bufferSize = 4096, 1 input channel, 1 output channel
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Save copy of samples chunk
        audioChunksRef.current.push(new Float32Array(inputData));
      };

      setIsRecording(true);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

    } catch (err) {
      console.error('[Mic]', err);
      setError('Microphone access denied. Please allow microphone permissions and try again.');
    }
  };

  // ── Stop & Analyse ───────────────────────────────────────────────────────────
  const stopAndAnalyse = () => {
    if (!processorRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsRecording(false);
    setIsAnalyzing(true);
    setStepIndex(0);

    // Stop and disconnect nodes to release audio hardware
    processorRef.current.disconnect();
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    // Step 0 — Compile audio PCM into WAV Blob
    setStepIndex(0);

    const chunks = audioChunksRef.current;
    if (chunks.length === 0) {
      setError('No audio chunks captured. Please speak for at least 5 seconds.');
      setIsAnalyzing(false);
      return;
    }

    // Calculate total buffer size
    let totalLength = 0;
    for (const chunk of chunks) {
      totalLength += chunk.length;
    }

    const mergedSamples = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      mergedSamples.set(chunk, offset);
      offset += chunk.length;
    }

    // Capture standard sample rate from context
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const wavBlob = encodeWAV(mergedSamples, sampleRate);
    console.log(`[Audio WAV] size: ${wavBlob.size} bytes, sampleRate: ${sampleRate}`);

    // Require at least 5 seconds of audio (~10 chunks minimum or ~220,000 bytes for 16-bit 44.1kHz mono WAV)
    const minWavSize = sampleRate * 2 * 5; // 5 seconds in bytes
    if (wavBlob.size < minWavSize) {
      setError('Recording is too short. Please speak for at least 5 seconds.');
      setIsAnalyzing(false);
      return;
    }

    // Run late async tasks
    setTimeout(async () => {
      try {
        // Step 1 — Send to backend proxy
        setStepIndex(1);
        const formData = new FormData();
        formData.append('audio', wavBlob, 'recording.wav');

        setStepIndex(2);
        const analysisRes = await axios.post(
          `${BACKEND_URL}/api/transcribe`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 180000, // 3 min
          }
        );

        const {
          transcript,
          fillersCount,
          fillerInstances,
          pausesCount,
          pauseInstances,
          duration,
        } = analysisRes.data;

        // Step 3 — Saving
        setStepIndex(3);
        console.log(`[Analysis] fillers: ${fillersCount}, pauses: ${pausesCount}, duration: ${duration}s`);

        // Step 4 — Save to SQLite
        setStepIndex(4);
        
        // Compute composite score for database storage
        const fCount = fillersCount || 0;
        const pCount = pausesCount || 0;
        const fillerDeduction = Math.min(fCount * 8, 40);
        const pauseDeduction = Math.min(pCount * 12, 60);
        const speechScore = Math.max(100 - fillerDeduction - pauseDeduction, 0);

        let clinicalScore = 0;
        const age = user?.age || 0;
        if (age >= 75) clinicalScore += 35;
        else if (age >= 65) clinicalScore += 25;
        else if (age >= 50) clinicalScore += 10;

        const phqTotal = (user?.phq1 || 0) + (user?.phq2 || 0);
        if (phqTotal >= 3) clinicalScore += 25;

        const edu = user?.educationLevel || 'College/University Degree';
        if (edu === 'High School or Less') clinicalScore += 25;
        else if (edu === 'College/University Degree') clinicalScore += 10;

        const bmi = user?.bmi || 22.0;
        if (bmi < 18.5) clinicalScore += 15;
        else if (bmi < 25) clinicalScore += 5;

        const speechRisk = 100 - speechScore;
        const compositeScore = Math.round((clinicalScore * 0.6) + (speechRisk * 0.4));

        const sessionRes = await axios.post(`${BACKEND_URL}/api/sessions`, {
          userId: user?.id,
          theme: theme || 'nature',
          transcript: transcript || 'No speech detected.',
          fillersCount,
          estimatedPauses: pausesCount,
          duration,
          fillerInstances: fillerInstances || [],
          pauseInstances: pauseInstances || [],
          compositeScore
        });

        // Navigate to report
        navigate('/report', {
          state: {
            transcript: transcript || 'No speech detected.',
            fillersCount,
            fillerInstances,
            estimatedPauses: pausesCount,
            pauseInstances,
            duration,
            theme,
            id: sessionRes.data.id,
          },
        });

      } catch (err: any) {
        console.error('[Analysis error]', err);
        const msg =
          err.response?.data?.error ||
          err.message ||
          'Unknown error. Please try again.';
        setError(`Analysis failed: ${msg}`);
        setIsAnalyzing(false);
        setStepIndex(0);
      }
    }, 100);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const imageUrl = themeImages[theme ?? 'nature'] ?? themeImages['nature'];
  const prompt   = themePrompts[theme ?? 'nature'] ?? themePrompts['nature'];

  return (
    <div className="container animate-in" style={{ alignItems: 'center' }}>

      {/* Back Button */}
      {!isAnalyzing && (
        <button
          onClick={() => navigate('/theme')}
          className="btn btn-secondary"
          style={{ alignSelf: 'flex-start', marginBottom: '1.5rem' }}
        >
          <ArrowLeft size={18} /> Back
        </button>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2>Speech Analysis Test</h2>
        <p style={{ maxWidth: '620px', margin: '0 auto' }}>{prompt}</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          padding: '1rem 1.5rem',
          background: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--accent-danger)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          width: '100%',
          maxWidth: '800px',
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span style={{ lineHeight: 1.5 }}>{error}</span>
        </div>
      )}

      {/* Theme Image */}
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '800px',
        padding: '0.75rem', marginBottom: '2rem',
      }}>
        <img
          src={imageUrl}
          alt={theme ?? 'theme'}
          style={{ width: '100%', maxHeight: '380px', objectFit: 'cover', borderRadius: '14px', display: 'block' }}
        />
      </div>

      {/* ── Recording Controls ─────────────────────────────────────────────── */}
      {!isAnalyzing ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>

          {/* Main button */}
          <button
            onClick={isRecording ? stopAndAnalyse : startRecording}
            className="btn"
            style={{
              padding: '1rem 3rem',
              fontSize: '1.1rem',
              borderRadius: '50px',
              background: isRecording ? 'var(--accent-danger)' : 'var(--gradient-primary)',
              color: 'white',
              border: 'none',
              boxShadow: isRecording
                ? '0 0 30px rgba(239, 68, 68, 0.45)'
                : '0 4px 20px rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            {isRecording
              ? <><Square size={20} /> Stop &amp; Analyze</>
              : <><Mic size={20} /> Start Recording</>}
          </button>

          {/* Recording indicator */}
          {isRecording && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.65rem 1.5rem',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '50px',
            }}>
              <span style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: 'var(--accent-danger)',
                display: 'inline-block',
                animation: 'pulseDot 1.5s ease-in-out infinite',
              }} />
              <span style={{ fontWeight: 600 }}>REC — {formatTime(recordingTime)}</span>
            </div>
          )}

          {!isRecording && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Speak for at least 15–30 seconds for best results.
              Powered by Speechmatics Enhanced ASR.
            </p>
          )}
        </div>

      ) : (
        /* ── Analyzing State ──────────────────────────────────────────────── */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '1.5rem', textAlign: 'center',
        }}>
          {/* Spinner */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'var(--gradient-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'spin 2s linear infinite',
          }}>
            <Loader size={36} color="var(--accent-primary)" />
          </div>

          <h3 style={{ margin: 0 }}>Analyzing your speech...</h3>

          {/* Step Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '400px' }}>
            {ANALYSIS_STEPS.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.6rem 1rem',
                borderRadius: '10px',
                background: i === stepIndex
                  ? 'rgba(99, 102, 241, 0.15)'
                  : i < stepIndex
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'transparent',
                border: i === stepIndex
                  ? '1px solid rgba(99, 102, 241, 0.3)'
                  : i < stepIndex
                  ? '1px solid rgba(16, 185, 129, 0.2)'
                  : '1px solid transparent',
                transition: 'all 0.3s ease',
              }}>
                <ChevronRight
                  size={14}
                  color={
                    i < stepIndex
                      ? 'var(--accent-success)'
                      : i === stepIndex
                      ? 'var(--accent-primary)'
                      : 'var(--text-secondary)'
                  }
                />
                <span style={{
                  fontSize: '0.875rem',
                  color: i === stepIndex
                    ? 'var(--text-primary)'
                    : i < stepIndex
                    ? 'var(--accent-success)'
                    : 'var(--text-secondary)',
                }}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '380px', margin: 0 }}>
            Speechmatics AI is detecting disfluencies and measuring acoustic pauses from word-level timestamps.
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulseDot {
          0%   { box-shadow: 0 0 0 0    rgba(239, 68, 68, 0.7); }
          70%  { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);   }
          100% { box-shadow: 0 0 0 0    rgba(239, 68, 68, 0);   }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (max-width: 600px) {
          .container { padding: 1rem !important; }
        }
      `}</style>
    </div>
  );
};

export default SpeechTest;