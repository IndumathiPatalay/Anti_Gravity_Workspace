import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, Home, AlertTriangle, CheckCircle, XCircle, Clock, 
  MessageSquare, User, Shield, Activity, Calendar, Award, Heart 
} from 'lucide-react';

interface FillerInstance {
  word: string;
  time: number;
}
interface PauseInstance {
  duration: string;
  after: string;
  time: number;
}

const AnalysisReport: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const data = location.state;

  if (!data) {
    return (
      <div className="center-screen" style={{ flexDirection: 'column', gap: '1rem' }}>
        <p>No report data found. Please take a test first.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">Go to Dashboard</button>
      </div>
    );
  }

  const { transcript, fillersCount, fillerInstances, estimatedPauses, pauseInstances } = data;

  // ── Multi-Factorial Risk Stratification Algorithm (Wiley 2025) ───────────────────
  
  // 1. Speech Score (starts at 100, drops for each filler word and pause)
  const fCount = fillersCount || 0;
  const pCount = estimatedPauses || 0;
  const fillerDeduction = Math.min(fCount * 8, 40);
  const pauseDeduction = Math.min(pCount * 12, 60);
  const speechScore = Math.max(100 - fillerDeduction - pauseDeduction, 0);

  // 2. Clinical Risk Score (starts at 0, accumulates points up to 100)
  let clinicalScore = 0;
  
  // Age factor
  const age = user?.age || 0;
  let ageRiskText = 'Low Risk';
  let ageRiskColor = 'var(--accent-success)';
  if (age >= 75) {
    clinicalScore += 35;
    ageRiskText = 'High Risk (Age 75+)';
    ageRiskColor = 'var(--accent-danger)';
  } else if (age >= 65) {
    clinicalScore += 25;
    ageRiskText = 'High Risk (Age 65-74)';
    ageRiskColor = 'var(--accent-danger)';
  } else if (age >= 50) {
    clinicalScore += 10;
    ageRiskText = 'Moderate Risk (Age 50-64)';
    ageRiskColor = 'var(--accent-warning)';
  } else {
    ageRiskText = 'Low Risk (Age < 50)';
  }

  // Depression factor (PHQ-2 score >= 3)
  const phq1 = user?.phq1 || 0;
  const phq2 = user?.phq2 || 0;
  const phqTotal = phq1 + phq2;
  const isDepressed = phqTotal >= 3;
  let moodRiskText = 'Low Risk';
  let moodRiskColor = 'var(--accent-success)';
  if (isDepressed) {
    clinicalScore += 25;
    moodRiskText = `Elevated Symptoms (PHQ-2: ${phqTotal}/6)`;
    moodRiskColor = 'var(--accent-danger)';
  } else {
    moodRiskText = `Minimal Symptoms (PHQ-2: ${phqTotal}/6)`;
  }

  // Education level factor
  const edu = user?.educationLevel || 'College/University Degree';
  let eduRiskText = 'Moderate Risk';
  let eduRiskColor = 'var(--accent-warning)';
  if (edu === 'High School or Less') {
    clinicalScore += 25;
    eduRiskText = 'Elevated Risk (High School or Less)';
    eduRiskColor = 'var(--accent-danger)';
  } else if (edu === 'Postgraduate/Advanced Degree') {
    clinicalScore += 0;
    eduRiskText = 'Cognitive Reserve (Advanced Degree)';
    eduRiskColor = 'var(--accent-success)';
  } else {
    clinicalScore += 10;
    eduRiskText = 'Normal Reserve (University Degree)';
  }

  // BMI factor (Protective if Overweight/Obese: BMI >= 25, Risk if BMI < 18.5)
  const bmi = user?.bmi || 22.0;
  let bmiRiskText = 'Normal';
  let bmiRiskColor = 'var(--text-secondary)';
  if (bmi < 18.5) {
    clinicalScore += 15;
    bmiRiskText = `Underweight (Elevated Risk, BMI: ${bmi})`;
    bmiRiskColor = 'var(--accent-danger)';
  } else if (bmi >= 25.0) {
    clinicalScore += 0; // 0 risk points added
    bmiRiskText = `Overweight/Obese (Protective Factor, BMI: ${bmi})`;
    bmiRiskColor = 'var(--accent-success)';
  } else {
    clinicalScore += 5;
    bmiRiskText = `Normal (BMI: ${bmi})`;
    bmiRiskColor = 'var(--accent-secondary)';
  }

  // 3. Composite Stratified Risk Score (60% Clinical Factors + 40% Speech Markers)
  const speechRisk = 100 - speechScore;
  const compositeScore = Math.round((clinicalScore * 0.6) + (speechRisk * 0.4));

  // Determine Overall Conversion Risk Category
  let riskLevel = 'Low';
  let riskColor = 'var(--accent-success)';
  let RiskIcon = CheckCircle;
  let riskMessage = 'Your overall multi-factorial dementia conversion risk appears low. Good cognitive reserves, a healthy BMI, and steady vocal fluency contribute to a strong protective profile.';

  if (compositeScore >= 60) {
    riskLevel = 'High';
    riskColor = 'var(--accent-danger)';
    RiskIcon = XCircle;
    riskMessage = 'Elevated conversion indicators detected. The combination of your vocal features, clinical demographics, and symptom checklist suggests the need for clinical neuro-psychological assessments.';
  } else if (compositeScore >= 30) {
    riskLevel = 'Moderate';
    riskColor = 'var(--accent-warning)';
    RiskIcon = AlertTriangle;
    riskMessage = 'Moderate conversion risk indicators are present. We recommend periodic speech testing to monitor trends, alongside healthy lifestyle enhancements to booster cognitive reserves.';
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="container animate-in" style={{ paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'var(--gradient-primary)', marginBottom: '1rem' }}>
          <FileText size={32} color="white" />
        </div>
        <h1>Multi-Factorial Analysis Report</h1>
        <p style={{ maxWidth: '600px', margin: '0.25rem auto 0', color: 'var(--text-secondary)' }}>
          Powered by Speechmatics SaaS Batch ASR &amp; correlated against modifiable dementia risk factors (<i>Wiley 2025 Study</i>).
        </p>
      </div>

      {/* ── Multi-Factorial Risk Stratification Card ────────────────────────── */}
      <div className="glass-panel" style={{
        marginBottom: '2rem', padding: '2.5rem',
        border: `1px solid ${riskColor}33`,
        boxShadow: `0 0 40px ${riskColor}22`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        <RiskIcon size={56} color={riskColor} style={{ marginBottom: '1rem' }} />
        
        {/* Risk Percentage Dial */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{
            fontSize: '3rem', fontWeight: 800,
            background: `linear-gradient(135deg, #fff, ${riskColor})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {compositeScore}%
          </div>
        </div>

        <h2 style={{ color: riskColor, margin: '0 0 0.75rem' }}>{riskLevel} Stratified Risk Indicator</h2>
        <p style={{ maxWidth: '580px', margin: '0 auto 1.25rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
          {riskMessage}
        </p>

        {/* Small Wiley citation tag */}
        <div style={{
          fontSize: '0.75rem', color: 'var(--text-secondary)',
          background: 'rgba(255,255,255,0.04)', padding: '0.4rem 1rem',
          borderRadius: '50px', border: '1px solid rgba(255,255,255,0.06)'
        }}>
          DOI Correlation Ref: <strong>10.1002/alz.70870</strong> (Stratified NACC cohort model)
        </div>
      </div>

      {/* ── Visual Comparison Score Cards ──────────────────────────────────── */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        
        {/* Speech Markers Breakdown */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Activity size={22} color="var(--accent-primary)" />
            <h3 style={{ margin: 0 }}>Vocal Biomarkers Score</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{speechScore}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>/ 100</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Filler Words ({fCount})</span>
              <span style={{ fontWeight: 600, color: fCount > 5 ? 'var(--accent-warning)' : 'var(--text-primary)' }}>
                -{fillerDeduction} pts
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Acoustic Pauses &gt;1.5s ({pCount})</span>
              <span style={{ fontWeight: 600, color: pCount > 3 ? 'var(--accent-warning)' : 'var(--text-primary)' }}>
                -{pauseDeduction} pts
              </span>
            </div>
          </div>
        </div>

        {/* Clinical Predictors Breakdown */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Shield size={22} color="var(--accent-secondary)" />
            <h3 style={{ margin: 0 }}>Clinical Risk Score</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{clinicalScore}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>/ 100</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Age Risk Contribution</span>
              <span style={{ fontWeight: 600, color: age >= 65 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                {age >= 65 ? '+25' : age >= 50 ? '+10' : '0'} pts
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Mood (PHQ-2 Depressive Symptoms)</span>
              <span style={{ fontWeight: 600, color: isDepressed ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                {isDepressed ? '+25' : '0'} pts
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cognitive Reserve (Education)</span>
              <span style={{ fontWeight: 600, color: edu === 'High School or Less' ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                {edu === 'High School or Less' ? '+25' : edu === 'College/University Degree' ? '+10' : '0'} pts
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Biometrics (BMI Risk)</span>
              <span style={{ fontWeight: 600, color: bmi < 18.5 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                {bmi < 18.5 ? '+15' : bmi >= 25 ? '0 (Protective)' : '+5'} pts
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Section 1: Detailed Patient Risk Profile (Wiley 2025) ────────────────── */}
      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', color: 'var(--accent-secondary)' }}>
          1. Modifiable &amp; Demographic Clinical Profile
        </h3>
        
        <div className="grid-4">
          
          {/* Age Card */}
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <Calendar size={18} color="var(--accent-primary)" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Age</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.25rem 0' }}>{age} yrs</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: ageRiskColor }}>{ageRiskText}</span>
          </div>

          {/* Education Reserve Card */}
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <Award size={18} color="var(--accent-secondary)" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Education Reserve</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0.25rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{edu}</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: eduRiskColor }}>{eduRiskText}</span>
          </div>

          {/* BMI Card */}
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <Heart size={18} color="var(--accent-success)" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>BMI Status</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.25rem 0' }}>{bmi}</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: bmiRiskColor }}>
              {bmiRiskText}
            </span>
          </div>

          {/* Depressive Symptoms Screen Card */}
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <User size={18} color="var(--accent-danger)" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Clinical Mood (PHQ-2)</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.25rem 0' }}>Score: {phqTotal} / 6</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: moodRiskColor }}>{moodRiskText}</span>
          </div>

        </div>
      </div>

      {/* ── Section 2: Speech Biomarkers Occurrences ──────────────────────── */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        
        {/* Filler Words */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <MessageSquare size={20} color="var(--accent-primary)" />
            <h3 style={{ margin: 0 }}>Filler Words ({fCount})</h3>
          </div>

          {fillerInstances && fillerInstances.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(fillerInstances as FillerInstance[]).map((f, i) => (
                <span key={i} style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '50px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  fontSize: '0.85rem',
                }}>
                  &ldquo;{f.word}&rdquo; @ {formatTime(f.time)}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>No disfluencies or filler words detected.</p>
          )}
        </div>

        {/* Acoustic Pauses */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Clock size={20} color="var(--accent-secondary)" />
            <h3 style={{ margin: 0 }}>Acoustic Pauses ({pCount})</h3>
          </div>

          {pauseInstances && pauseInstances.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {(pauseInstances as PauseInstance[]).map((p, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.02)',
                  fontSize: '0.875rem'
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>After: &ldquo;{p.after}&rdquo;</span>
                  <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: '50px', fontWeight: 600, fontSize: '0.75rem',
                    background: parseFloat(p.duration) > 3 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: parseFloat(p.duration) > 3 ? 'var(--accent-danger)' : 'var(--accent-warning)',
                  }}>
                    {p.duration}s pause
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>No acoustic pauses &gt;1.5 seconds detected.</p>
          )}
        </div>

      </div>

      {/* ── Section 3: Speech Transcript ──────────────────────────────────── */}
      <div className="glass-panel" style={{ marginBottom: '3rem', padding: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', color: 'var(--accent-primary)' }}>
          3. Speech Transcript
        </h3>
        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '12px', minHeight: '80px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.8 }}>
            {transcript || 'No speech detected.'}
          </p>
        </div>
      </div>

      {/* Back Button */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
          <Home size={20} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AnalysisReport;
