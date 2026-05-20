import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, UserCheck, UserPlus, FileAudio } from 'lucide-react';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="center-screen" style={{ padding: '2rem 1rem', background: 'radial-gradient(circle at top, rgba(99, 102, 241, 0.15), transparent 60%)' }}>
      <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '700px', padding: '3.5rem 2.5rem', textAlign: 'center' }}>
        
        {/* Animated App Icon */}
        <div style={{ display: 'inline-flex', padding: '1.25rem', borderRadius: '50%', background: 'var(--gradient-primary)', marginBottom: '1.5rem', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
          <FileAudio size={40} color="white" />
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>
          Dementia <span style={{ color: 'var(--accent-primary)' }}>ASR Screening</span>
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: '1.6', fontSize: '1.05rem' }}>
          An advanced acoustic assessment suite utilizing high-fidelity Speechmatics Batch ASR and correlated against clinical cognitive modifiable risk models.
        </p>

        {/* Action Panel Grid */}
        <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
          
          {/* Returning User Card */}
          <div 
            onClick={() => navigate('/login')}
            style={{
              cursor: 'pointer',
              padding: '2.25rem 1.5rem',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 30px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(99, 102, 241, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              e.currentTarget.style.boxShadow = '0 4px 30px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ display: 'flex', padding: '0.75rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', marginBottom: '1.25rem' }}>
              <UserCheck size={26} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>Returning Patient</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Log in to run a speech disfluency test or review past results.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              Sign In <ArrowRight size={14} />
            </div>
          </div>

          {/* New User Card */}
          <div 
            onClick={() => navigate('/register')}
            style={{
              cursor: 'pointer',
              padding: '2.25rem 1.5rem',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 30px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = 'var(--accent-secondary)';
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(139, 92, 246, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              e.currentTarget.style.boxShadow = '0 4px 30px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ display: 'flex', padding: '0.75rem', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-secondary)', marginBottom: '1.25rem' }}>
              <UserPlus size={26} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>New Profile</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Create a clinical patient profile and fill in risk questionnaire parameters.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
              Register <ArrowRight size={14} />
            </div>
          </div>

        </div>

        {/* Security Citation Tag */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '50px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <ShieldAlert size={14} color="var(--accent-warning)" />
          <span>Clinical Screening Tool — strictly anonymous &amp; secure data logs</span>
        </div>

      </div>
    </div>
  );
};

export default Welcome;
