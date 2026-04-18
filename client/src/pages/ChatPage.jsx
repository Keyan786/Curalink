import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Send, ChevronLeft, ShieldAlert, Sparkles, Info,
  BookOpen, FlaskConical, ExternalLink, Users, MapPin, Calendar,
  ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import api from '../api/api';

/* ─── Research Card: Publication ─── */
const PublicationCard = ({ pub }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
      padding: '18px 20px', transition: 'var(--transition)',
      borderLeft: '4px solid var(--secondary)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <a href={pub.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1.4, textDecoration: 'none', display: 'block' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            {pub.title}
          </a>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} /> {pub.year || 'N/A'}
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FileText size={12} /> {pub.source}
            </span>
            {pub.citations > 0 && (
              <>
                <span>•</span>
                <span>{pub.citations} citations</span>
              </>
            )}
            <span style={{
              background: pub.provider === 'PubMed' ? '#e8f3f1' : '#ecf3f6',
              color: pub.provider === 'PubMed' ? 'var(--primary)' : 'var(--secondary)',
              padding: '2px 8px', borderRadius: 999, fontWeight: 600, fontSize: '0.7rem'
            }}>
              {pub.provider}
            </span>
          </div>
        </div>
        <a href={pub.url} target="_blank" rel="noopener noreferrer"
          style={{ flexShrink: 0, color: 'var(--secondary)', padding: 4 }}>
          <ExternalLink size={16} />
        </a>
      </div>

      {pub.authors?.length > 0 && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
          <Users size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          {pub.authors.join(', ')}
        </p>
      )}

      {pub.abstract && (
        <>
          <button onClick={() => setExpanded(!expanded)} style={{
            background: 'none', border: 'none', color: 'var(--secondary)', fontSize: '0.8rem',
            fontWeight: 600, marginTop: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0
          }}>
            {expanded ? 'Hide' : 'Show'} Abstract {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {expanded && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6, background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
              {pub.abstract}
            </p>
          )}
        </>
      )}
    </div>
  );
};

/* ─── Research Card: Clinical Trial ─── */
const TrialCard = ({ trial }) => {
  const [expanded, setExpanded] = useState(false);
  const statusColor = {
    'RECRUITING': '#16a34a',
    'NOT_YET_RECRUITING': '#ca8a04',
    'ACTIVE_NOT_RECRUITING': '#2563eb',
    'COMPLETED': '#6b7280',
  };
  const color = statusColor[trial.status?.toUpperCase()] || '#6b7280';
  const label = (trial.status || 'Unknown').replace(/_/g, ' ');

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: 14,
      padding: '18px 20px', borderLeft: '4px solid #d4a373'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <a href={trial.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1.4, textDecoration: 'none', display: 'block' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            {trial.title}
          </a>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span style={{
              background: `${color}18`, color, padding: '2px 10px', borderRadius: 999,
              fontWeight: 700, fontSize: '0.7rem', textTransform: 'capitalize'
            }}>
              {label}
            </span>
            {trial.phase && trial.phase !== 'N/A' && (
              <>
                <span>•</span>
                <span>Phase: {trial.phase}</span>
              </>
            )}
            {trial.nctId && (
              <>
                <span>•</span>
                <span>{trial.nctId}</span>
              </>
            )}
          </div>
        </div>
        <a href={trial.url} target="_blank" rel="noopener noreferrer"
          style={{ flexShrink: 0, color: '#d4a373', padding: 4 }}>
          <ExternalLink size={16} />
        </a>
      </div>

      {trial.conditions?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {trial.conditions.slice(0, 4).map((c, i) => (
            <span key={i} style={{
              fontSize: '0.72rem', background: 'var(--primary-light)', color: 'var(--primary)',
              padding: '3px 10px', borderRadius: 999, fontWeight: 500
            }}>{c}</span>
          ))}
        </div>
      )}

      {trial.locations?.length > 0 && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={12} /> {trial.locations[0]}
        </p>
      )}

      <button onClick={() => setExpanded(!expanded)} style={{
        background: 'none', border: 'none', color: '#d4a373', fontSize: '0.8rem',
        fontWeight: 600, marginTop: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0
      }}>
        {expanded ? 'Hide' : 'Show'} Details {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div style={{ marginTop: 10, background: 'var(--bg)', padding: 14, borderRadius: 8, fontSize: '0.82rem' }}>
          {trial.summary && <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 10 }}>{trial.summary}</p>}
          {trial.contacts?.length > 0 && trial.contacts[0].name && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <p style={{ fontWeight: 600, fontSize: '0.78rem', marginBottom: 4, color: 'var(--text)' }}>Contact</p>
              {trial.contacts.map((c, i) => (
                <p key={i} style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {c.name}{c.email ? ` · ${c.email}` : ''}{c.phone ? ` · ${c.phone}` : ''}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Research Panel ─── */
const ResearchPanel = ({ research }) => {
  if (!research || (research.publications?.length === 0 && research.trials?.length === 0)) return null;

  return (
    <div className="animate-fade" style={{
      alignSelf: 'flex-start', maxWidth: '85%', marginTop: 4
    }}>
      <div style={{
        background: 'var(--secondary-light)', borderRadius: 16, padding: '20px 22px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <BookOpen size={18} color="var(--secondary)" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--secondary)' }}>Evidence-Based Research</span>
        </div>
        {research.meta && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            Retrieved {research.meta.totalRetrieved} results → filtered to {research.meta.finalSelected} most relevant
          </p>
        )}

        {research.publications?.length > 0 && (
          <div style={{ marginBottom: research.trials?.length > 0 ? 20 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <FileText size={14} color="var(--secondary)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Publications ({research.publications.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {research.publications.map((pub, i) => <PublicationCard key={i} pub={pub} />)}
            </div>
          </div>
        )}

        {research.trials?.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <FlaskConical size={14} color="#d4a373" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Clinical Trials ({research.trials.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {research.trials.map((trial, i) => <TrialCard key={i} trial={trial} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Main Chat Page ─── */
const renderMessageWithCitations = (text) => {
  if (!text) return text;
  // Match [[YYYY|URL]] specifically
  const regex = /\[\[([^|]+)\|([^\]]+)\]\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const year = match[1].trim();
    const url = match[2].trim();
    parts.push(
      <a key={match.index} href={url} target="_blank" rel="noopener noreferrer" style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 6px',
        background: '#e8f3f1',
        color: '#2d5a52',
        borderRadius: '6px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        textDecoration: 'none',
        margin: '0 4px',
        verticalAlign: 'baseline',
        border: '1px solid #bce3db',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        {year}
      </a>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : text;
};

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [researchByIndex, setResearchByIndex] = useState({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const suggestions = [
    "What natural remedies help with fatigue?",
    "Suggest a diet plan for hypertension.",
    "How can I improve my sleep quality?",
    "What are the latest clinical trials for diabetes?"
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/chat/history');
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to fetch chat history', err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (text) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', { message: msg });
      const newHistory = res.data.history;
      setMessages(newHistory);

      // Attach research to the last assistant message index
      if (res.data.research && (res.data.research.publications?.length > 0 || res.data.research.trials?.length > 0)) {
        const lastAssistantIdx = newHistory.length - 1;
        setResearchByIndex(prev => ({ ...prev, [lastAssistantIdx]: res.data.research }));
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting to my knowledge base. Please ensure your local Ollama instance is running and try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Activity size={40} color="var(--primary)" style={{ animation: 'pulse 1.5s ease infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Header */}
      <header className="glass" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 4 }}>
            <ChevronLeft size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={22} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: 0, lineHeight: 1.3 }}>Curalink Mentor</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Evidence-Backed &amp; Personalized
              </p>
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 600,
          color: 'var(--text-muted)', background: 'var(--secondary-light)', padding: '6px 14px', borderRadius: 999
        }}>
          <ShieldAlert size={14} color="var(--secondary)" /> Local Privacy Mode
        </div>
      </header>

      {/* Disclaimer */}
      <div style={{
        background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '8px 28px',
        fontSize: '0.75rem', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0
      }}>
        <Info size={14} />
        <span><strong>DISCLAIMER:</strong> I am an AI mentor. My guidance is for wellness and natural care only. I do not provide medical diagnosis or prescriptions.</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '28px 28px',
        display: 'flex', flexDirection: 'column', gap: 20
      }}>
        {messages.length === 0 && (
          <div className="animate-fade" style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', maxWidth: 480, margin: '0 auto'
          }}>
            <Sparkles size={48} color="var(--primary)" style={{ opacity: 0.2, marginBottom: 16 }} />
            <h2 style={{ fontSize: '1.35rem', marginBottom: 8 }}>How can I support your health today?</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 }}>
              I'll search PubMed, OpenAlex, and ClinicalTrials.gov to back my guidance with real research.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  style={{
                    textAlign: 'left', padding: '16px 20px', borderRadius: 14,
                    border: '1.5px solid var(--border)', background: '#fff', fontSize: '0.9rem',
                    color: 'var(--text)', cursor: 'pointer', transition: 'var(--transition)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#fff'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <React.Fragment key={i}>
            <div className="animate-fade" style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '75%'
            }}>
              <div style={{
                padding: '14px 20px',
                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: m.role === 'user' ? 'var(--primary)' : '#fff',
                color: m.role === 'user' ? '#fff' : 'var(--text)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {m.role === 'assistant' ? renderMessageWithCitations(m.content) : m.content}
                </p>
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, padding: '0 4px' }}>
                {m.role === 'user' ? 'You' : 'Curalink Mentor'}
              </p>
            </div>
            {/* Render research panel after the assistant message it belongs to */}
            {m.role === 'assistant' && researchByIndex[i] && (
              <ResearchPanel research={researchByIndex[i]} />
            )}
          </React.Fragment>
        ))}

        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              background: '#fff', border: '1px solid var(--border)',
              padding: '16px 24px', borderRadius: '18px 18px 18px 4px',
              display: 'flex', gap: 6
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)',
                  animation: 'bounce 1s ease infinite', animationDelay: `${i * 0.15}s`
                }} />
              ))}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={12} /> Searching PubMed, OpenAlex &amp; ClinicalTrials.gov...
            </p>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: '20px 28px', background: '#fff', borderTop: '1px solid var(--border)', flexShrink: 0
      }}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}
        >
          <input
            type="text"
            placeholder="Ask about your health, conditions, or clinical trials..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ 
              paddingRight: 60, 
              background: '#fff', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1.5px solid var(--border)',
              padding: '16px 20px',
              color: 'var(--text)',
              fontSize: '1rem',
              width: '100%'
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              width: 44, height: 44, borderRadius: 12, background: 'var(--primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: (loading || !input.trim()) ? 0.4 : 1, border: 'none', cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            <Send size={18} />
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 12 }}>
          Powered by Ollama · Research from PubMed, OpenAlex &amp; ClinicalTrials.gov
        </p>
      </div>
    </div>
  );
};

export default ChatPage;
