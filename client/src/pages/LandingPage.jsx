import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, MessageSquare, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navbar */}
      <nav className="animate-fade" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '24px 40px', maxWidth: 1200, margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={32} color="var(--primary)" />
          <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.02em' }}>Curalink</span>
        </div>
        <button onClick={() => navigate('/auth')} className="btn-primary">Sign In</button>
      </nav>

      {/* Hero */}
      <header className="animate-fade" style={{
        maxWidth: 900, margin: '0 auto', padding: '80px 40px 60px', textAlign: 'center',
        animationDelay: '0.1s'
      }}>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', marginBottom: 24, lineHeight: 1.1 }}>
          Your Personalized{' '}
          <span style={{ color: 'var(--secondary)' }}>AI Health Mentor</span>
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Curalink builds a deep understanding of your wellness to provide safe, natural, and highly tailored guidance for your health journey.
        </p>
        <button onClick={() => navigate('/auth')} className="btn-primary" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
          Start Your Journey <ArrowRight size={20} />
        </button>
      </header>

      {/* Features */}
      <section style={{ background: 'var(--secondary-light)', padding: '80px 40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
          {[
            { icon: <ShieldCheck size={28} color="var(--primary)" />, title: 'Privacy First', desc: 'Your health data stays local with our on-device AI integration via Ollama.' },
            { icon: <Activity size={28} color="var(--primary)" />, title: 'Natural Guidance', desc: 'Evidence-based natural remedies and lifestyle adjustments tailored to you.' },
            { icon: <MessageSquare size={28} color="var(--primary)" />, title: 'Proactive Support', desc: "A mentor that doesn't just react, but proactively guides your daily routine." },
          ].map((f, i) => (
            <div key={i} className="card animate-fade" style={{ textAlign: 'center', animationDelay: `${0.2 + i * 0.1}s` }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
              }}>
                {f.icon}
              </div>
              <h3 style={{ marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="animate-fade" style={{
        padding: '80px 40px', textAlign: 'center', maxWidth: 700, margin: '0 auto',
        animationDelay: '0.5s'
      }}>
        <p style={{ fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          "Curalink bridges the gap between complex health data and accessible, natural wellness support."
        </p>
        <div style={{ marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          &copy; 2026 Curalink Health. Built for privacy and trust.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
