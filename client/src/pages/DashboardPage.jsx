import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, User, ListTodo, MessageSquare, AlertCircle,
  Moon, Coffee, Droplets, ArrowRight, LogOut
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const [profile, setProfile] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, insightsRes] = await Promise.all([
          api.get('/profile'),
          api.get('/insights')
        ]);
        setProfile(profileRes.data);
        setInsights(insightsRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Activity size={48} color="var(--primary)" style={{ animation: 'pulse 1.5s ease infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Analyzing your health profile...</p>
      </div>
    );
  }

  const statCard = (icon, label, value, delay) => (
    <div className="card animate-fade" style={{ textAlign: 'center', padding: 24, animationDelay: delay }}>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{value}</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top Nav */}
      <nav className="glass" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={28} color="var(--primary)" />
          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>Curalink</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/chat')} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
            <MessageSquare size={16} /> Chat Mentor
          </button>
          <button onClick={logout} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, background: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px' }}>
        {/* Greeting */}
        <div className="animate-fade" style={{ marginBottom: 40 }}>
          <h1 style={{ marginBottom: 8 }}>Hello, welcome back.</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Your health status is looking stable today.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, alignItems: 'start' }}>

          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Daily Routine */}
            <div className="card animate-fade" style={{ animationDelay: '0.1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <ListTodo size={22} color="var(--secondary)" />
                <h3 style={{ marginBottom: 0 }}>Daily Routine</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {insights?.routine?.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '12px 14px',
                    borderRadius: 10, transition: 'var(--transition)', cursor: 'default'
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--secondary-light)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)', width: 80, flexShrink: 0 }}>{item.time}</span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.95rem' }}>{item.activity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {statCard(<Droplets size={24} color="#3b82f6" />, 'Hydration', '2.5L / 3L', '0.2s')}
              {statCard(<Moon size={24} color="#6366f1" />, 'Sleep', `${profile?.lifestyle?.sleepHours || 7}h Target`, '0.3s')}
              {statCard(<Coffee size={24} color="#d97706" />, 'Activity', profile?.lifestyle?.activityLevel || 'Moderate', '0.4s')}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Health Insights */}
            <div className="card animate-fade" style={{
              background: 'var(--primary)', color: '#fff', animationDelay: '0.5s',
              border: 'none'
            }}>
              <h3 style={{ color: '#fff', marginBottom: 20 }}>Health Insights</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {insights?.tips?.map((tip, i) => (
                  <div key={i} style={{ fontSize: '0.9rem', lineHeight: 1.6, borderLeft: '2px solid var(--primary-light)', paddingLeft: 12 }}>
                    {tip}
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/chat')} style={{
                width: '100%', marginTop: 28, padding: '14px 20px', background: '#fff', color: 'var(--primary)',
                borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                border: 'none', fontSize: '0.95rem', cursor: 'pointer', transition: 'var(--transition)'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Personalized Advice <ArrowRight size={18} />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="card animate-fade" style={{ animationDelay: '0.6s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <User size={20} color="var(--secondary)" />
                <h3 style={{ marginBottom: 0 }}>Profile Info</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Conditions</span>
                  <span style={{ fontWeight: 600 }}>{profile?.medicalHistory?.conditions?.join(', ') || 'None'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Diet Type</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{profile?.lifestyle?.dietType || 'N/A'}</span>
                </div>
                {profile?.currentSymptoms?.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <p style={{
                      fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', marginBottom: 8,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      <AlertCircle size={12} /> Reported Symptoms
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {profile.currentSymptoms.map((s, i) => (
                        <span key={i} style={{
                          fontSize: '0.78rem', background: '#fef2f2', color: '#dc2626',
                          padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca'
                        }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
