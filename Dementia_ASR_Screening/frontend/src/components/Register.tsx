import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Info } from 'lucide-react';

const Register: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [healthStatus, setHealthStatus] = useState('');
  
  // Wiley 2025 Dementia Risk Factor inputs
  const [educationLevel, setEducationLevel] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // PHQ-2 Depressive Symptoms screening questions
  const [phq1, setPhq1] = useState('');
  const [phq2, setPhq2] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Dynamic real-time BMI calculation computed on render
  const w = parseFloat(weight);
  const h = parseFloat(height);
  const bmi = (w > 0 && h > 0) ? Math.round((w / Math.pow(h / 100, 2)) * 10) / 10 : null;

  const getBmiCategoryText = (val: number) => {
    if (val < 18.5) return 'Underweight (High Dementia Risk)';
    if (val < 25.0) return 'Normal Weight';
    return 'Overweight/Obese (Wiley 2025 Protective Factor)';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/auth/register', { 
        userId, 
        password, 
        age: parseInt(age), 
        healthStatus,
        educationLevel,
        phq1: parseInt(phq1) || 0,
        phq2: parseInt(phq2) || 0,
        weight: parseFloat(weight) || null,
        height: parseFloat(height) || null,
        bmi: bmi || null
      });
      navigate('/login');
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen" style={{ padding: '2rem 1rem' }}>
      <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '750px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'var(--gradient-primary)', marginBottom: '1rem' }}>
            <UserPlus size={32} color="white" />
          </div>
          <h2>Create Clinical Profile</h2>
          <p>Register to generate a multi-factorial dementia stratification profile</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', marginBottom: '1.5rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          {/* Section 1: Demographics */}
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>1. Demographics & Credentials</h3>
          <div className="grid-2" style={{ marginBottom: '2rem' }}>
            <div className="input-group">
              <label className="input-label">User ID</label>
              <input type="text" className="input-field" value={userId} onChange={(e) => setUserId(e.target.value)} required placeholder="e.g. patient123" />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <div className="input-group">
              <label className="input-label">Age</label>
              <input type="number" className="input-field" value={age} onChange={(e) => setAge(e.target.value)} required min="1" max="120" placeholder="e.g. 68" />
            </div>
            <div className="input-group">
              <label className="input-label">Known Health Status</label>
              <select className="input-field" value={healthStatus} onChange={(e) => setHealthStatus(e.target.value)} required style={{ appearance: 'none' }}>
                <option value="" disabled>Select Status</option>
                <option value="Healthy">Healthy</option>
                <option value="Mild Cognitive Impairment">Mild Cognitive Impairment</option>
                <option value="Dementia">Dementia</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Section 2: Clinical Risk Factors */}
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-secondary)' }}>2. Modifiable Predictors (Wiley 2025)</h3>
          
          {/* Informational Banner */}
          <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
            <Info size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
            <span>
              These parameters correlate with the 2025 <i>Alzheimer's &amp; Dementia</i> survival study.
              Higher education levels and higher BMI act as protective cognitive reserve elements, whereas lower BMI and depressive symptoms indicate conversion risks.
            </span>
          </div>

          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Highest Education Completed</label>
              <select className="input-field" value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} required style={{ appearance: 'none' }}>
                <option value="" disabled>Select Education Level</option>
                <option value="High School or Less">High School or Less (Higher Conversion Risk)</option>
                <option value="College/University Degree">College/University Degree (Moderate Risk)</option>
                <option value="Postgraduate/Advanced Degree">Postgraduate/Advanced Degree (Lowest Risk - High Reserve)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Height (cm)</label>
              <input type="number" className="input-field" value={height} onChange={(e) => setHeight(e.target.value)} required min="100" max="250" placeholder="e.g. 172" />
            </div>
            <div className="input-group">
              <label className="input-label">Weight (kg)</label>
              <input type="number" className="input-field" value={weight} onChange={(e) => setWeight(e.target.value)} required min="30" max="250" placeholder="e.g. 78" />
            </div>
          </div>

          {/* Dynamic BMI widget */}
          {bmi !== null && (
            <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Calculated Body Mass Index (BMI):</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{bmi}</div>
              </div>
              <div style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '50px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: bmi >= 25 ? 'rgba(16, 185, 129, 0.15)' : bmi < 18.5 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                color: bmi >= 25 ? 'var(--accent-success)' : bmi < 18.5 ? 'var(--accent-danger)' : 'var(--text-primary)',
                border: bmi >= 25 ? '1px solid rgba(16, 185, 129, 0.3)' : bmi < 18.5 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                {getBmiCategoryText(bmi)}
              </div>
            </div>
          )}

          {/* Section 3: Depressive Symptoms Questionnaire */}
          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--accent-danger)' }}>3. Clinical Mood Screen (PHQ-2)</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
            Over the last 2 weeks, how often have you been bothered by the following problems?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="input-group">
              <label className="input-label">1. Little interest or pleasure in doing things?</label>
              <select className="input-field" value={phq1} onChange={(e) => setPhq1(e.target.value)} required style={{ appearance: 'none' }}>
                <option value="" disabled>Choose Frequency</option>
                <option value="0">Not at all (0)</option>
                <option value="1">Several days (1)</option>
                <option value="2">More than half the days (2)</option>
                <option value="3">Nearly every day (3)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">2. Feeling down, depressed, or hopeless?</label>
              <select className="input-field" value={phq2} onChange={(e) => setPhq2(e.target.value)} required style={{ appearance: 'none' }}>
                <option value="" disabled>Choose Frequency</option>
                <option value="0">Not at all (0)</option>
                <option value="1">Several days (1)</option>
                <option value="2">More than half the days (2)</option>
                <option value="3">Nearly every day (3)</option>
              </select>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Creating Account & Profile...' : 'Complete Registration'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Login here</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
          <Link to="/welcome" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>← Back to Welcome</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
