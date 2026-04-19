import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Microscope, Search, TrendingUp, BookOpen, Clock,
  FlaskConical, ExternalLink, LogOut, ChevronRight,
  BarChart2, Sparkles, Database, Activity, FileText
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

// ─── Sample Trends (clearly labelled as example data) ───
const SAMPLE_TRENDS = [
  { label: 'CRISPR Gene Editing', growth: '+34%', field: 'Genomics' },
  { label: 'GLP-1 Agonists & Obesity', growth: '+28%', field: 'Endocrinology' },
  { label: 'Neuroinflammation & Depression', growth: '+22%', field: 'Psychiatry' },
  { label: 'mRNA Vaccine Platforms', growth: '+19%', field: 'Immunology' },
  { label: 'Microbiome & Metabolic Health', growth: '+17%', field: 'Gastroenterology' },
];

// ─── Theme Pill ───
const ThemePill = ({ keyword, count }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 16px', borderRadius: 999,
    background: 'var(--primary-light)', border: '1px solid var(--border)',
    transition: 'var(--transition)', cursor: 'default'
  }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'inherit'; }}
  >
    <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{keyword}</span>
    <span style={{
      fontSize: '0.7rem', fontWeight: 700, background: 'var(--primary)', color: '#fff',
      padding: '2px 7px', borderRadius: 999
    }}>{count}</span>
  </div>
);

// ─── Publication Mini-Card ───
const PubMiniCard = ({ pub }) => (
  <a href={pub.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0',
      borderBottom: '1px solid var(--border)', transition: 'var(--transition)', cursor: 'pointer'
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: pub.confidenceTier === 'Very High' ? '#dcfce7' :
          pub.confidenceTier === 'High' ? '#dbeafe' : '#f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <FileText size={16} color={
          pub.confidenceTier === 'Very High' ? '#16a34a' :
            pub.confidenceTier === 'High' ? '#2563eb' : '#6b7280'
        } />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)',
          lineHeight: 1.4, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>{pub.title}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
          {pub.year && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{pub.year}</span>}
          {pub.provider && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 999,
              background: pub.provider === 'PubMed' ? '#fef3c7' : '#dbeafe',
              color: pub.provider === 'PubMed' ? '#92400e' : '#1e40af',
            }}>{pub.provider}</span>
          )}
          {pub.confidenceTier && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 999,
              background: '#e8f3f1', color: '#2d5a52', border: '1px solid #c6e4dd'
            }}>{pub.confidenceTier}</span>
          )}
        </div>
      </div>
      <ExternalLink size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 4 }} />
    </div>
  </a>
);

// ─── Recent Insight Row ───
const InsightRow = ({ insight, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
      borderRadius: 12, border: '1px solid var(--border)', background: '#fff',
      cursor: 'pointer', transition: 'var(--transition)'
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#fff'; }}
  >
    <div style={{
      width: 40, height: 40, borderRadius: 10, background: 'var(--secondary-light)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <Search size={16} color="var(--secondary)" />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{
        fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', margin: 0,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>{insight.query}</p>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
        {insight.sourceCount} sources retrieved · {new Date(insight.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
    <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
  </div>
);

// ─── Main Dashboard ───
const DashboardPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    api.get('/chat/analytics')
      .then(res => setAnalytics(res.data))
      .catch(err => console.error('Analytics load failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const hasData = analytics && analytics.totalSessions > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ─── Navbar ─── */}
      <nav className="glass" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', position: 'sticky', top: 0, zIndex: 10,
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Microscope size={28} color="var(--primary)" />
          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>Curalink</span>
          <span style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999,
            background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--border)'
          }}>Research</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/chat')} className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} /> New Research Session
          </button>
          <button onClick={logout} style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, background: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px', boxSizing: 'border-box', width: '100%' }}>

        {/* ─── Header ─── */}
        <div className="animate-fade" style={{ marginBottom: 40 }}>
          <h1 style={{ marginBottom: 8, fontSize: '2rem' }}>Research Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            {hasData
              ? `${analytics.totalSessions} research session${analytics.totalSessions !== 1 ? 's' : ''} · Evidence-first exploration`
              : 'Start your first research session to populate your dashboard.'}
          </p>
        </div>

        {/* ─── Quick Stats Row ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 14, marginBottom: 32 }}>
          {[
            { icon: <Database size={22} color="#2563eb" />, label: 'Total Sessions', value: analytics?.totalSessions ?? 0, bg: '#dbeafe', delay: '0.05s' },
            { icon: <BookOpen size={22} color="#16a34a" />, label: 'Top Publications', value: analytics?.topPublications?.length ?? 0, bg: '#dcfce7', delay: '0.1s' },
            { icon: <TrendingUp size={22} color="#d97706" />, label: 'Emerging Themes', value: analytics?.themes?.length ?? 0, bg: '#fef3c7', delay: '0.15s' },
            { icon: <FlaskConical size={22} color="#7c3aed" />, label: 'Recent Insights', value: analytics?.recentInsights?.length ?? 0, bg: '#ede9fe', delay: '0.2s' },
          ].map((s, i) => (
            <div key={i} className="card animate-fade" style={{ padding: 20, animationDelay: s.delay, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Grid: Main Content ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
          gap: 24,
          marginBottom: 24,
          width: '100%',
        }}>

          {/* ─── Your Research Insights ─── */}
          <div className="card animate-fade" style={{ animationDelay: '0.25s', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={20} color="var(--secondary)" />
                <h3 style={{ margin: 0 }}>Your Research Insights</h3>
              </div>
              <button onClick={() => navigate('/chat')} style={{
                fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)',
                background: 'var(--primary-light)', padding: '4px 12px', borderRadius: 999, border: 'none'
              }}>
                + New Session
              </button>
            </div>
            {!hasData ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Search size={36} color="var(--border)" style={{ marginBottom: 12 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Your research history will appear here after your first query.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {analytics.recentInsights.map((ins, i) => (
                  <InsightRow key={i} insight={ins} onClick={() => navigate('/chat')} />
                ))}
              </div>
            )}
          </div>

          {/* ─── Top Publications from Your Research ─── */}
          <div className="card animate-fade" style={{ animationDelay: '0.3s', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <BookOpen size={20} color="var(--primary)" />
              <h3 style={{ margin: 0 }}>Top Publications</h3>
            </div>
            {!hasData || !analytics.topPublications?.length ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <BookOpen size={36} color="var(--border)" style={{ marginBottom: 12 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Most relevant publications from your sessions will appear here.</p>
              </div>
            ) : (
              <div>
                {analytics.topPublications.map((pub, i) => (
                  <PubMiniCard key={i} pub={pub} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Bottom Row: Emerging Themes + Sample Trends ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 24,
          width: '100%',
        }}>

          {/* ─── Emerging Research Themes ─── */}
          <div className="card animate-fade" style={{ animationDelay: '0.35s', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <BarChart2 size={20} color="var(--secondary)" />
              <h3 style={{ margin: 0 }}>Emerging Research Themes</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Keywords derived from your query history via frequency analysis.
            </p>
            {!hasData || !analytics.themes?.length ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <TrendingUp size={36} color="var(--border)" style={{ marginBottom: 12 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Themes emerge after multiple research sessions.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {analytics.themes.map((theme, i) => (
                  <ThemePill key={i} keyword={theme.keyword} count={theme.count} />
                ))}
              </div>
            )}
          </div>

          {/* ─── Sample Global Trends ─── */}
          <div className="card animate-fade" style={{ animationDelay: '0.4s', background: 'var(--primary)', border: 'none', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Sparkles size={20} color="#fff" />
              <h3 style={{ margin: 0, color: '#fff' }}>Sample Global Trends</h3>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginBottom: 20, fontStyle: 'italic' }}>

            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SAMPLE_TRENDS.map((trend, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.10)'
                }}>
                  <div>
                    <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', margin: 0 }}>{trend.label}</p>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{trend.field}</p>
                  </div>
                  <span style={{
                    fontSize: '0.8rem', fontWeight: 700, color: '#4ade80',
                    background: 'rgba(74,222,128,0.15)', padding: '3px 10px', borderRadius: 999
                  }}>{trend.growth}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/chat')} style={{
              width: '100%', marginTop: 20, padding: '12px', background: '#fff', color: 'var(--primary)',
              borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, border: 'none', fontSize: '0.9rem', cursor: 'pointer', transition: 'var(--transition)'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <Search size={16} /> Explore These Topics
            </button>
          </div>

        </div>
      </main>

      {/* ─── CTA: Start Research ─── */}
      {!hasData && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 48px' }}>
          <div className="card animate-fade" style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            border: 'none', padding: '40px 48px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 32, animationDelay: '0.4s'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Activity size={24} color="rgba(255,255,255,0.8)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Get Started</span>
              </div>
              <h2 style={{ color: '#fff', marginBottom: 8, fontSize: '1.6rem' }}>Begin Your First Research Session</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 480 }}>
                Ask any medical research question and Curalink will retrieve evidence from PubMed, OpenAlex, and ClinicalTrials.gov — all properly cited and ranked by evidence quality.
              </p>
            </div>
            <button onClick={() => navigate('/chat')} style={{
              flexShrink: 0, background: '#fff', color: 'var(--primary)', fontWeight: 700, fontSize: '1rem',
              padding: '16px 32px', borderRadius: 14, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap',
              transition: 'var(--transition)'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <Microscope size={20} /> Start Researching
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
