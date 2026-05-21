import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { userId, password });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Failed to login');
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

        {error && <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

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
