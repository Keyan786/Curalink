import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, ArrowRight } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const res = await api.post(endpoint, { email, password });
      login(res.data.token, res.data.userId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, background: 'var(--secondary-light)'
    }}>
      <div className="animate-fade" style={{ maxWidth: 440, width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Activity size={48} color="var(--primary)" style={{ marginBottom: 16 }} />
          <h2 style={{ marginBottom: 8 }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {isLogin ? 'Sign in to access your research dashboard' : 'Start exploring medical research evidence'}
          </p>
        </div>

        {/* Form Card */}
        <div className="card glass">
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: 12, borderRadius: 10, background: '#fef2f2', color: '#dc2626',
                fontSize: '0.85rem', border: '1px solid #fecaca', marginBottom: 20
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 22 }} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: 44 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 22 }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: 44 }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '16px 24px' }}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                style={{ marginLeft: 8, color: 'var(--primary)', fontWeight: 700, background: 'none', fontSize: '0.9rem' }}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 28, lineHeight: 1.6 }}>
          By continuing, you agree to Curalink's Privacy Policy.<br />
          We do not store or process personal health information.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
