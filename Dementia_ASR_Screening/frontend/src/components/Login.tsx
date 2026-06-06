import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import API_URL from '../api';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '') as string;

  useEffect(() => {
    // Check periodically for google accounts client library
    const checkGoogle = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      if (g && g.accounts) {
        setGoogleAvailable(true);
        clearInterval(checkGoogle);
        
        if (clientId) {
          try {
            g.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleCredentialResponse,
            });
            g.accounts.id.renderButton(
              document.getElementById('google-signin-btn-real'),
              { theme: 'outline', size: 'large', width: 336 }
            );
          } catch (e) {
            console.error('Error initializing Google Identity Services:', e);
          }
        }
      }
    }, 500);

    return () => clearInterval(checkGoogle);
  }, [clientId]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGoogleCredentialResponse = async (response: any) => {
    setError('');
    setLoading(true);
    
    try {
      const res = await axios.post(`${API_URL}/api/auth/oauth/google`, {
        credential: response.credential,
        isMock: false
      });
      
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: string } }; request?: unknown };
      if (axiosError.response) {
        setError(axiosError.response.data?.error || 'Google login failed.');
      } else {
        setError('Network error: unable to contact the backend for Google OAuth.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMockGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const mockEmail = prompt("Enter mock email address for testing Google OAuth:", "test-oauth-user@example.com");
    if (mockEmail === null) {
      setLoading(false);
      return;
    }
    if (!mockEmail.trim()) {
      setError("Mock email is required.");
      setLoading(false);
      return;
    }

    const mockName = mockEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
    const mockSub = `mock_${mockEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    try {
      const res = await axios.post(`${API_URL}/api/auth/oauth/google`, {
        isMock: true,
        mockEmail,
        mockName,
        mockSub
      });
      
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: string } }; request?: unknown };
      if (axiosError.response) {
        setError(axiosError.response.data?.error || 'Mock login failed.');
      } else {
        setError('Network error: unable to contact the backend for Mock OAuth.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { userId, password });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: string } }; request?: unknown };
      if (axiosError.response) {
        setError(axiosError.response.data?.error || 'Login failed.');
      } else if (axiosError.request) {
        setError('Cannot reach the server. Make sure the backend is running and VITE_API_URL is set.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen">
      <div className="glass-panel animate-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'var(--gradient-primary)', marginBottom: '1rem' }}>
            <LogIn size={32} color="white" />
          </div>
          <h2>Welcome Back</h2>
          <p>Login to continue your speech analysis</p>
        </div>

        {error && (
          <div style={{ 
            padding: '0.75rem', 
            borderRadius: '8px', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            color: 'var(--accent-danger)', 
            marginBottom: '1rem', 
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">User ID</label>
            <input 
              type="text" 
              className="input-field" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)} 
              placeholder="Enter your User ID"
              required 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter your password"
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', width: '100%' }}>
          {clientId && googleAvailable && (
            <div id="google-signin-btn-real" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
          )}

          <button 
            type="button"
            onClick={handleMockGoogleLogin} 
            className="btn btn-secondary" 
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.75rem',
              background: 'rgba(255,255,255,0.02)',
              color: 'var(--text-primary)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '0.65rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google (Mock Mode)
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Register here</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
          <Link to="/welcome" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>← Back to Welcome</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
