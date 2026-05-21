import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, Plus, LogOut, Clock, Mic, FileText, 
  Settings, ShieldCheck 
} from 'lucide-react';

interface Session {
  id: number;
  timestamp: string;
  theme: string;
  transcript: string;
  fillersCount: number;
  estimatedPauses: number;
  duration: number;
  fillerInstances: unknown[];
  pauseInstances: unknown[];
  compositeScore?: number;
}

const Dashboard: React.FC = () => {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();
  
  // Tab states: 'test' | 'history' | 'profile'
  const [activeTab, setActiveTab] = useState<'test' | 'history' | 'profile'>('test');
  
  // History log state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  
  // Profile editor states
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [healthStatus, setHealthStatus] = useState(user?.healthStatus || 'Healthy');
  const [educationLevel, setEducationLevel] = useState(user?.educationLevel || 'College/University Degree');
  const [weight, setWeight] = useState(user?.weight?.toString() || '');
  const [height, setHeight] = useState(user?.height?.toString() || '');
  const [phq1, setPhq1] = useState(user?.phq1?.toString() || '0');
  const [phq2, setPhq2] = useState(user?.phq2?.toString() || '0');
  
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Dynamic real-time BMI calculator computed on render
  const wVal = parseFloat(weight);
  const hVal = parseFloat(height);
  const bmi = (wVal > 0 && hVal > 0) ? Math.round((wVal / Math.pow(hVal / 100, 2)) * 10) / 10 : null;

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setHistoryLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/sessions/${user.id}`);
        setSessions(res.data);
      } catch (error) {
        console.error('Failed to fetch history', error);
      } finally {
        setHistoryLoading(false);
      }
    };

    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, user]);

  const handleLogout = () => {
    logout();
    navigate('/welcome');
  };

  // Review a specific past session
  const reviewSession = async (sessionId: number) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/sessions/detail/${sessionId}`);
      const data = res.data;
      navigate('/report', {
        state: {
          transcript: data.transcript,
          fillersCount: data.fillersCount,
          fillerInstances: data.fillerInstances,
          estimatedPauses: data.estimatedPauses,
          pauseInstances: data.pauseInstances,
          duration: data.duration,
          theme: data.theme,
          id: data.id,
        },
      });
    } catch (error) {
      console.error('Failed to retrieve session details', error);
      alert('Could not retrieve session details.');
    }
  };

  // Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setProfileSaving(true);

    try {
      const res = await axios.put('http://localhost:5000/api/auth/profile', {
        id: user?.id,
        age: parseInt(age),
        healthStatus,
        educationLevel,
        phq1: parseInt(phq1),
        phq2: parseInt(phq2),
        weight: parseFloat(weight) || null,
        height: parseFloat(height) || null,
        bmi
      });

      // Update global context
      login(res.data.user, token!);
      setProfileSuccess('Clinical profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setProfileError(axiosError.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const getBmiCategoryText = (val: number) => {
    if (val < 18.5) return 'Underweight (Risk)';
    if (val < 25.0) return 'Normal Weight';
    return 'Overweight (Wiley 2025 Protective)';
  };

  const getRiskColor = (score: number) => {
    if (score >= 60) return 'var(--accent-danger)';
    if (score >= 30) return 'var(--accent-warning)';
    return 'var(--accent-success)';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 60) return 'High';
    if (score >= 30) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="container animate-in" style={{ paddingBottom: '5rem' }}>
      
      {/* Upper Dashboard Welcome */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Patient Portal
          </span>
          <h1 style={{ marginTop: '0.2rem', marginBottom: '0.25rem' }}>Hello, {user?.userId}</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Welcome to your acoustic disfluency screening landing page.</p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* Modern Horizontal Tabs Menu */}
      <div style={{
        display: 'flex',
        gap: '0.35rem',
        padding: '0.35rem',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: '2.5rem',
        maxWidth: '550px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <button 
          onClick={() => setActiveTab('test')}
          style={{
            flex: 1, padding: '0.65rem 0.5rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
            fontSize: '0.85rem',
            background: activeTab === 'test' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'test' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          New Test
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1, padding: '0.65rem 0.5rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
            fontSize: '0.85rem',
            background: activeTab === 'history' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'history' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          History Log
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          style={{
            flex: 1, padding: '0.65rem 0.5rem', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
            fontSize: '0.85rem',
            background: activeTab === 'profile' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'profile' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          Clinical Profile
        </button>
      </div>

      {/* ── Content View panels ─────────────────────────────────────────────── */}
      
      {/* 1. New Speech Test Tab */}
      {activeTab === 'test' && (
        <div className="glass-panel animate-in" style={{ padding: '3rem 2.5rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '1.5rem' }}>
            <Mic size={36} color="var(--accent-primary)" />
          </div>
          <h2>Acoustic Disfluency Elicitation</h2>
          <p style={{ maxWidth: '500px', margin: '0.5rem auto 2.5rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Choose from 6 visual elicitation prompts, record yourself describing the scene for 30 seconds, and generate a multi-factorial risk report.
          </p>
          <button 
            onClick={() => navigate('/theme')} 
            className="btn btn-primary" 
            style={{ padding: '1rem 3.5rem', fontSize: '1.1rem', borderRadius: '50px' }}
          >
            <Plus size={20} /> Select Theme &amp; Start Test
          </button>
        </div>
      )}

      {/* 2. Vocal History Log Tab */}
      {activeTab === 'history' && (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {historyLoading ? (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
              <p>Fetching session records from SQLite...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Activity size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
              <h3>No past speech tests found</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 1.5rem' }}>Complete an acoustic speech assessment to compile history logs.</p>
              <button onClick={() => navigate('/theme')} className="btn btn-primary">Start Speech Test</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' }}>
              {sessions.map(session => {
                const rScore = session.compositeScore || 0;
                const rColor = getRiskColor(rScore);
                const rLabel = getRiskLabel(rScore);

                return (
                  <div key={session.id} className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1.1rem' }}>
                          {session.theme.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <Clock size={12} />
                          {new Date(session.timestamp).toLocaleString()}
                        </div>
                      </div>
                      
                      {/* Risk Badge */}
                      <span style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: '50px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: `${rColor}15`,
                        color: rColor,
                        border: `1px solid ${rColor}33`
                      }}>
                        {rScore}% ({rLabel} Risk)
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.01)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{session.fillersCount}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Fillers</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{session.estimatedPauses}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Pauses</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{session.duration}s</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Duration</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => reviewSession(session.id)} 
                      className="btn btn-secondary" 
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 0' }}
                    >
                      <FileText size={16} /> Review Full Report
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Clinical Profile Editor Tab */}
      {activeTab === 'profile' && (
        <div className="glass-panel animate-in" style={{ padding: '2.5rem', maxWidth: '750px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
            <Settings size={22} color="var(--accent-secondary)" />
            <h3 style={{ margin: 0 }}>Review &amp; Edit Clinical Questions</h3>
          </div>

          {profileSuccess && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <ShieldCheck size={18} /> {profileSuccess}
            </div>
          )}

          {profileError && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            {/* Section 1: Demographics */}
            <h4 style={{ color: 'var(--accent-primary)', marginBottom: '1rem', marginTop: 0 }}>1. Demographics</h4>
            <div className="grid-2" style={{ marginBottom: '2rem' }}>
              <div className="input-group">
                <label className="input-label">Age</label>
                <input type="number" className="input-field" value={age} onChange={(e) => setAge(e.target.value)} required min="1" max="120" />
              </div>
              <div className="input-group">
                <label className="input-label">Known Health Status</label>
                <select className="input-field" value={healthStatus} onChange={(e) => setHealthStatus(e.target.value)} required style={{ appearance: 'none' }}>
                  <option value="Healthy">Healthy</option>
                  <option value="Mild Cognitive Impairment">Mild Cognitive Impairment</option>
                  <option value="Dementia">Dementia</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Section 2: Wiley 2025 Predictors */}
            <h4 style={{ color: 'var(--accent-secondary)', marginBottom: '1rem' }}>2. Modifiable Predictors (Wiley 2025)</h4>
            <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label">Highest Education Completed</label>
                <select className="input-field" value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} required style={{ appearance: 'none' }}>
                  <option value="High School or Less">High School or Less (Higher Conversion Risk)</option>
                  <option value="College/University Degree">College/University Degree (Moderate Risk)</option>
                  <option value="Postgraduate/Advanced Degree">Postgraduate/Advanced Degree (Lowest Risk - High Reserve)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Height (cm)</label>
                <input type="number" className="input-field" value={height} onChange={(e) => setHeight(e.target.value)} required min="100" max="250" />
              </div>
              <div className="input-group">
                <label className="input-label">Weight (kg)</label>
                <input type="number" className="input-field" value={weight} onChange={(e) => setWeight(e.target.value)} required min="30" max="250" />
              </div>
            </div>

            {/* Dynamic BMI widget */}
            {bmi !== null && (
              <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Calculated BMI:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginLeft: '0.5rem' }}>{bmi}</span>
                </div>
                <div style={{
                  padding: '0.35rem 0.75rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 600,
                  background: bmi >= 25 ? 'rgba(16, 185, 129, 0.15)' : bmi < 18.5 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                  color: bmi >= 25 ? 'var(--accent-success)' : bmi < 18.5 ? 'var(--accent-danger)' : 'var(--text-primary)',
                  border: bmi >= 25 ? '1px solid rgba(16, 185, 129, 0.3)' : bmi < 18.5 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  {getBmiCategoryText(bmi)}
                </div>
              </div>
            )}

            {/* Section 3: Depressive Symptoms Questionnaire */}
            <h4 style={{ color: 'var(--accent-danger)', marginBottom: '0.5rem' }}>3. Mood Screen (PHQ-2)</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
              Over the last 2 weeks, how often have you been bothered by:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
              <div className="input-group">
                <label className="input-label">1. Little interest or pleasure in doing things?</label>
                <select className="input-field" value={phq1} onChange={(e) => setPhq1(e.target.value)} required style={{ appearance: 'none' }}>
                  <option value="0">Not at all (0)</option>
                  <option value="1">Several days (1)</option>
                  <option value="2">More than half the days (2)</option>
                  <option value="3">Nearly every day (3)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">2. Feeling down, depressed, or hopeless?</label>
                <select className="input-field" value={phq2} onChange={(e) => setPhq2(e.target.value)} required style={{ appearance: 'none' }}>
                  <option value="0">Not at all (0)</option>
                  <option value="1">Several days (1)</option>
                  <option value="2">More than half the days (2)</option>
                  <option value="3">Nearly every day (3)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem' }} disabled={profileSaving}>
              {profileSaving ? 'Saving Changes...' : 'Save & Update Profile'}
            </button>
          </form>

        </div>
      )}

    </div>
  );
};

export default Dashboard;
