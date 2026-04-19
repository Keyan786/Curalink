import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Microscope, ArrowRight, ShieldCheck, BookOpen,
  FlaskConical, TrendingUp, Search, FileText, Database, Sparkles
} from 'lucide-react';

const STATS = [
  { value: '35M+', label: 'PubMed Articles' },
  { value: '250M+', label: 'OpenAlex Works' },
  { value: '400K+', label: 'Clinical Trials' },
  { value: '100%', label: 'Evidence-Cited' },
];

const FEATURES = [
  {
    icon: <Search size={26} color="#2563eb" />,
    bg: '#dbeafe',
    title: 'Deep Evidence Retrieval',
    desc: 'Queries are expanded and searched across PubMed, OpenAlex, and ClinicalTrials.gov simultaneously, ranked by relevance and evidence quality.',
  },
  {
    icon: <FileText size={26} color="#16a34a" />,
    bg: '#dcfce7',
    title: 'Structured Scientific Responses',
    desc: 'Every response follows a strict schema: Condition Overview, Key Insights with confidence tiers, and fully attributed source publications.',
  },
  {
    icon: <FlaskConical size={26} color="#7c3aed" />,
    bg: '#ede9fe',
    title: 'Clinical Trial Discovery',
    desc: 'Surface active, recruiting, and completed clinical trials relevant to your research area, with phase, status, and contact information.',
  },
  {
    icon: <TrendingUp size={26} color="#d97706" />,
    bg: '#fef3c7',
    title: 'Research Analytics Dashboard',
    desc: 'Track your research history, discover emerging themes from your query patterns, and revisit your top-cited publications.',
  },
  {
    icon: <ShieldCheck size={26} color="#0891b2" />,
    bg: '#cffafe',
    title: 'No Medical Advice',
    desc: 'Curalink is a research tool, not a doctor. It strictly presents what the literature says — never prescribing, diagnosing, or advising.',
  },
  {
    icon: <Database size={26} color="#be185d" />,
    bg: '#fce7f3',
    title: 'Persistent Research History',
    desc: 'Your queries, retrieved sources, and research sessions are saved, enabling continuity and pattern discovery across sessions.',
  },
];

const EXAMPLE_QUERIES = [
  'What does the evidence say about GLP-1 receptor agonists in type 2 diabetes management?',
  'Summarize recent RCTs on immune checkpoint inhibitors for non-small cell lung cancer.',
  'What is the current clinical trial landscape for Alzheimer\'s disease treatment?',
  'Evidence quality of SSRI use in treatment-resistant major depressive disorder.',
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [hoveredQuery, setHoveredQuery] = useState(null);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden' }}>

      {/* ─── Navbar ─── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', maxWidth: 1280, margin: '0 auto',
        position: 'sticky', top: 0, zIndex: 50, background: 'rgba(248,250,249,0.85)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Microscope size={28} color="var(--primary)" />
          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.02em' }}>Curalink</span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 999,
            background: 'var(--primary)', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>Research</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/auth')}
            style={{ background: 'none', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem', padding: '8px 16px', borderRadius: 10 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Sign In
          </button>
          <button onClick={() => navigate('/auth')} className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
            Start Researching <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 48px 72px', textAlign: 'center' }}>

        {/* Badge */}
        <div className="animate-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32, padding: '6px 18px', borderRadius: 999, background: 'var(--primary-light)', border: '1px solid var(--border)' }}>
          <Sparkles size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Evidence-First · Peer-Reviewed · No Medical Advice
          </span>
        </div>

        <h1 className="animate-fade" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)', lineHeight: 1.08, marginBottom: 24, letterSpacing: '-0.03em', animationDelay: '0.05s' }}>
          AI-Powered{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Medical Research
          </span>
          <br />Assistant
        </h1>

        <p className="animate-fade" style={{
          fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: 640,
          margin: '0 auto 48px', lineHeight: 1.75, animationDelay: '0.1s'
        }}>
          Curalink searches PubMed, OpenAlex, and ClinicalTrials.gov to surface ranked, cited, peer-reviewed evidence — structured and attributed for every query you ask.
        </p>

        <div className="animate-fade" style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', animationDelay: '0.15s' }}>
          <button onClick={() => navigate('/auth')} className="btn-primary" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
            Start Your Research <ArrowRight size={20} />
          </button>
          <button
            onClick={() => navigate('/auth')}
            style={{
              fontSize: '1.05rem', padding: '16px 36px', borderRadius: 14,
              border: '2px solid var(--border)', background: '#fff', color: 'var(--text)',
              fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#fff'; }}
          >
            View Dashboard
          </button>
        </div>

        {/* Stats Row */}
        <div className="animate-fade" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
          marginTop: 72, background: 'var(--border)', borderRadius: 16, overflow: 'hidden',
          border: '1px solid var(--border)', animationDelay: '0.2s'
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ background: '#fff', padding: '28px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Example Queries ─── */}
      <section style={{ background: 'var(--primary)', padding: '64px 48px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
            What researchers ask
          </p>
          <h2 style={{ color: '#fff', marginBottom: 40, fontSize: '1.8rem' }}>Ask Any Clinical Question</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {EXAMPLE_QUERIES.map((q, i) => (
              <div
                key={i}
                onClick={() => navigate('/auth')}
                onMouseEnter={() => setHoveredQuery(i)}
                onMouseLeave={() => setHoveredQuery(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px 22px',
                  borderRadius: 14, background: hoveredQuery === i ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.10)',
                  cursor: 'pointer', transition: 'var(--transition)', border: '1px solid rgba(255,255,255,0.15)',
                  textAlign: 'left'
                }}
              >
                <Search size={16} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>{q}</span>
                <ArrowRight size={14} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0, marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section style={{ padding: '96px 48px', background: 'var(--secondary-light)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Core Capabilities</p>
            <h2 style={{ fontSize: '2.2rem', marginBottom: 16 }}>Built for Serious Research</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto' }}>
              Every feature is designed around one goal: surfacing the best available evidence as fast as possible.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="card animate-fade" style={{ padding: '28px 28px', animationDelay: `${0.05 * i}s`, transition: 'var(--transition)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  {f.icon}
                </div>
                <h3 style={{ marginBottom: 10, fontSize: '1.05rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section style={{ padding: '96px 48px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Process</p>
          <h2 style={{ fontSize: '2.2rem', marginBottom: 60 }}>How Curalink Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, position: 'relative' }}>
            {[
              { step: '01', icon: <Search size={28} color="var(--primary)" />, title: 'You Ask a Research Question', desc: 'Type any clinical or biomedical research question. Curalink expands it for maximum coverage.' },
              { step: '02', icon: <Database size={28} color="var(--secondary)" />, title: 'Evidence is Retrieved & Ranked', desc: 'PubMed, OpenAlex, and ClinicalTrials.gov are queried in parallel. Results are scored by relevance, recency, and study type.' },
              { step: '03', icon: <BookOpen size={28} color="#7c3aed" />, title: 'Structured Answer Delivered', desc: 'A structured response with insights, confidence tiers, snippets, and source links is returned — all citations traceable.' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-flex', marginBottom: 20 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.icon}
                  </div>
                  <span style={{
                    position: 'absolute', top: -8, right: -8, width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--primary)', color: '#fff', fontSize: '0.65rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>{s.step}</span>
                </div>
                <h3 style={{ marginBottom: 10, fontSize: '1rem' }}>{s.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: '80px 48px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <Microscope size={48} color="rgba(255,255,255,0.3)" style={{ marginBottom: 24 }} />
          <h2 style={{ color: '#fff', fontSize: '2.2rem', marginBottom: 16 }}>Ready to Explore the Evidence?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', marginBottom: 40, lineHeight: 1.7 }}>
            Join researchers, clinicians, and scientists using Curalink to navigate peer-reviewed medical literature efficiently.
          </p>
          <button onClick={() => navigate('/auth')} style={{
            background: '#fff', color: 'var(--primary)', fontWeight: 700, fontSize: '1.05rem',
            padding: '16px 40px', borderRadius: 14, border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'var(--transition)'
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <Microscope size={20} /> Start Researching Free
          </button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ padding: '40px 48px', borderTop: '1px solid var(--border)', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Microscope size={20} color="var(--primary)" />
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Curalink Research</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            © 2026 Curalink. Evidence-only. Not medical advice.
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Sources: PubMed · OpenAlex · ClinicalTrials.gov
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
