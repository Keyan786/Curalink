import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, ChevronLeft, ShieldAlert, Sparkles, Info,
  BookOpen, FlaskConical, ExternalLink, MapPin,
  ChevronDown, ChevronUp, FileText, AlertTriangle, Zap, Microscope,
  Award, TrendingUp, SlidersHorizontal, X, Search
} from 'lucide-react';
import api from '../api/api';

// ─── Confidence Tier Badge ───
const ConfidenceBadge = ({ tier }) => {
  const config = {
    'Very High': { bg: '#dcfce7', color: '#166534', border: '#bbf7d0', label: 'Very High' },
    'High':      { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe', label: 'High' },
    'Moderate':  { bg: '#fef3c7', color: '#92400e', border: '#fde68a', label: 'Moderate' },
    'Low':       { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb', label: 'Low' },
  };
  const c = config[tier] || config['Low'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: '0.65rem', fontWeight: 700,
      padding: '2px 8px', borderRadius: 999,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      {tier === 'Very High' || tier === 'High' ? <Award size={9} /> : <TrendingUp size={9} />}
      {c.label}
    </span>
  );
};

// ─── Query Mode Badge ───
const QueryModeBadge = ({ isResearchMode }) => {
  if (isResearchMode) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 700,
        padding: '4px 12px', borderRadius: 999,
        background: 'linear-gradient(135deg, #dbeafe, #ede9fe)', color: '#4338ca', border: '1px solid #c7d2fe'
      }}>
        <Microscope size={12} /> Research Mode
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 700,
      padding: '4px 12px', borderRadius: 999, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a'
    }}>
      <Zap size={12} /> Quick Answer
    </span>
  );
};

// ─── Low Evidence Warning ───
const LowEvidenceWarning = () => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, marginTop: 8
  }}>
    <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
    <div style={{ fontSize: '0.82rem', color: '#991b1b', lineHeight: 1.5 }}>
      <strong>Limited Evidence:</strong> The research pipeline could not find strong clinical studies for this query.
    </div>
  </div>
);

// ─── Publication Card ───
const PublicationCard = ({ pub, index }) => {
  const [showSnippet, setShowSnippet] = useState(false);
  const tierColor = {
    'Very High': '#16a34a', 'High': '#2563eb', 'Moderate': '#ca8a04', 'Low': '#9ca3af'
  }[pub.confidenceTier] || '#9ca3af';

  return (
    <div
      id={`pub-${index}`}
      style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${tierColor}`,
        borderRadius: 14,
        padding: '14px 16px',
        transition: 'box-shadow 0.2s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <a
            href={pub.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1.45,
              textDecoration: 'none', display: 'block',
            }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            <span style={{ color: '#9ca3af', fontWeight: 500, marginRight: 4 }}>[{index}]</span>
            {pub.title}
          </a>
        </div>
        <a
          href={pub.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ flexShrink: 0, color: 'var(--primary)', opacity: 0.5, padding: 4 }}
        >
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Meta row */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8,
        fontSize: '0.75rem', color: 'var(--text-muted)'
      }}>
        {pub.authors?.length > 0 && (
          <span style={{ color: 'var(--text-muted)' }}>
            {pub.authors.slice(0, 2).join(', ')}{pub.authors.length > 2 ? ' et al.' : ''}
          </span>
        )}
        {pub.year && <><span>·</span><strong style={{ color: 'var(--text)' }}>{pub.year}</strong></>}
        <span style={{
          padding: '1px 7px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700,
          background: pub.provider === 'PubMed' ? '#fef3c7' : '#dbeafe',
          color: pub.provider === 'PubMed' ? '#92400e' : '#1e40af',
        }}>
          {pub.provider || 'Source'}
        </span>
        <ConfidenceBadge tier={pub.confidenceTier || 'Low'} />
        {pub.citations > 0 && (
          <span style={{
            fontSize: '0.65rem', color: '#16a34a', fontWeight: 700,
            background: '#dcfce7', padding: '1px 7px', borderRadius: 999,
          }}>
            {pub.citations} cited
          </span>
        )}
      </div>

      {/* Snippet toggle */}
      {pub.snippet && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setShowSnippet(!showSnippet)}
            style={{
              background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.76rem',
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0
            }}
          >
            {showSnippet ? 'Hide' : 'View'} Key Finding
            {showSnippet ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showSnippet && (
            <p style={{
              marginTop: 6, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.65,
              background: '#f8fafc', padding: '10px 14px', borderRadius: 8,
              border: '1px solid #e2e8f0', fontStyle: 'italic'
            }}>
              "{pub.snippet}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Clinical Trial Card ───
const TrialCard = ({ trial }) => {
  const [expanded, setExpanded] = useState(false);
  const statusColor = {
    'RECRUITING': '#16a34a', 'NOT_YET_RECRUITING': '#ca8a04',
    'ACTIVE_NOT_RECRUITING': '#2563eb', 'COMPLETED': '#6b7280',
  };
  const color = statusColor[trial.status?.toUpperCase()] || '#6b7280';
  const label = (trial.status || 'Unknown').replace(/_/g, ' ');

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderLeft: '4px solid #d4a373', borderRadius: 14, padding: '14px 16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <a href={trial.url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1.4, textDecoration: 'none', display: 'block' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >{trial.title}</a>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ background: `${color}18`, color, padding: '2px 10px', borderRadius: 999, fontWeight: 700, fontSize: '0.65rem', textTransform: 'capitalize' }}>{label}</span>
            {trial.phase && trial.phase !== 'N/A' && <><span>·</span><span>Phase: {trial.phase}</span></>}
            {trial.nctId && <><span>·</span><span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{trial.nctId}</span></>}
          </div>
        </div>
        <a href={trial.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, color: '#d4a373', padding: 4 }}>
          <ExternalLink size={15} />
        </a>
      </div>
      {trial.conditions?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {trial.conditions.slice(0, 3).map((c, i) => (
            <span key={i} style={{ fontSize: '0.68rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 10px', borderRadius: 999, fontWeight: 500 }}>{c}</span>
          ))}
        </div>
      )}
      {trial.locations?.length > 0 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={11} /> {trial.locations[0]}
        </p>
      )}
      <button onClick={() => setExpanded(!expanded)} style={{
        background: 'none', border: 'none', color: '#d4a373', fontSize: '0.76rem',
        fontWeight: 600, marginTop: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0
      }}>
        {expanded ? 'Hide' : 'Show'} Details {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {expanded && (
        <div style={{ marginTop: 10, background: 'var(--bg)', padding: 14, borderRadius: 8, fontSize: '0.8rem' }}>
          {trial.summary && <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 10 }}>{trial.summary}</p>}
          {trial.contacts?.length > 0 && trial.contacts[0].name && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <p style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: 4 }}>Contact</p>
              {trial.contacts.map((c, i) => (
                <p key={i} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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

// ─── Inline Research Panel ───
const InlineResearchPanel = ({ research }) => {
  if (!research || (!research.publications?.length && !research.trials?.length)) return null;
  return (
    <div className="animate-fade" style={{ alignSelf: 'flex-start', maxWidth: '88%', marginTop: 4 }}>
      <div style={{ background: 'var(--secondary-light)', borderRadius: 16, padding: '18px 20px', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={17} color="var(--secondary)" />
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--secondary)' }}>Scientific Evidence</span>
          </div>
          {research.meta?.confidenceScore && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', fontWeight: 700,
              padding: '3px 10px', borderRadius: 999,
              background: research.meta.confidenceScore === 'High Evidence' ? '#dcfce7' :
                          research.meta.confidenceScore === 'Moderate Evidence' ? '#fef3c7' : '#f3f4f6',
              color: research.meta.confidenceScore === 'High Evidence' ? '#166534' :
                     research.meta.confidenceScore === 'Moderate Evidence' ? '#92400e' : '#374151',
              border: `1px solid ${research.meta.confidenceScore === 'High Evidence' ? '#bbf7d0' :
                                   research.meta.confidenceScore === 'Moderate Evidence' ? '#fde68a' : '#e5e7eb'}`
            }}>
              <Sparkles size={11} /> {research.meta.confidenceScore}
            </span>
          )}
        </div>

        {/* Meta stats */}
        {research.meta && (research.meta.totalRetrieved > 0 || research.meta.finalSelected > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {research.meta.totalRetrieved > 0 && <span>{research.meta.totalRetrieved} studies screened</span>}
            {research.meta.finalSelected > 0 && <><span>·</span><span>{research.meta.finalSelected} selected</span></>}
            {research.meta.averageRelevance > 0 && <><span>·</span><span>Avg Relevance: {research.meta.averageRelevance}</span></>}
          </div>
        )}

        {/* Publications */}
        {research.publications?.length > 0 && (
          <div style={{ marginBottom: research.trials?.length > 0 ? 18 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <FileText size={13} color="var(--secondary)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Top Publications ({research.publications.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {research.publications.map((pub, i) => <PublicationCard key={i} index={i + 1} pub={pub} />)}
            </div>
          </div>
        )}

        {/* Clinical Trials */}
        {research.trials?.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <FlaskConical size={13} color="#d4a373" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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

// ─── Robust JSON Sanitization ───
const cleanJSON = (text) => {
  if (!text) return null;
  try {
    const sanitized = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(sanitized);
  } catch (e) {
    return null;
  }
};

// ─── Render text with traceable citations (supports [1] and [T1]) ───
const renderMessageWithCitations = (text, publications) => {
  if (!text) return text;
  text = text.replace(/\*\*/g, '');
  
  // Matches [1], [T1], or [[text|url]]
  const regex = /\[([tT]?\d+)\]|\[\[([^|]+)\|([^\]]+)\]\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));

    if (match[1]) {
      const id = match[1].toUpperCase();
      const isTrial = id.startsWith('T');
      const numericId = parseInt(id.replace(/\D/g, ''));
      
      const pub = !isTrial && publications && publications[numericId - 1];
      
      parts.push(
        <span key={match.index}
          onClick={() => {
            const elementId = isTrial ? `trial-${id}` : `pub-${numericId}`;
            const el = document.getElementById(elementId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          title={isTrial ? `Clinical Trial ${id}` : (pub ? `${pub.title} (${pub.year || 'N/A'})` : `Source [${numericId}]`)}
          style={{
            display: 'inline-flex', alignItems: 'center', padding: '1px 6px',
            background: isTrial ? '#fff9f2' : '#e8f3f1',
            color: isTrial ? '#d4a373' : '#2d5a52',
            border: `1px solid ${isTrial ? '#d4a37344' : '#c6e4dd'}`,
            borderRadius: '4px',
            fontSize: '0.72rem', fontWeight: '800', margin: '0 2px', verticalAlign: 'super',
            cursor: 'pointer', transition: 'all 0.15s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = isTrial ? '#fcf0e4' : '#d1ebe6';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isTrial ? '#fff9f2' : '#e8f3f1';
          }}
        >
          {id}
        </span>
      );
    } else if (match[2] && match[3]) {
      parts.push(
        <a key={match.index} href={match[3].trim()} target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-flex', padding: '1px 5px', background: '#e8f3f1', color: '#2d5a52',
          borderRadius: '4px', fontSize: '0.72rem', fontWeight: 'bold', textDecoration: 'none', margin: '0 2px', verticalAlign: 'super'
        }}>{match[2].trim()}</a>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return parts.length > 0 ? parts : text;
};

// ─── Insight Item ───
const InsightItem = ({ insight, publications }) => {
  const isObject = typeof insight === 'object' && insight.text;
  const text = isObject ? insight.text : String(insight);
  const confidence = isObject ? insight.confidence : null;
  const sourceIds = isObject ? (insight.sourceIds || []) : [];
  return (
    <li style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
          {renderMessageWithCitations(text, publications)}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {confidence && (
            <span style={{
              fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
              padding: '1px 7px', borderRadius: 999,
              background: confidence === 'High' ? '#dbeafe' : confidence === 'Moderate' ? '#fef3c7' : '#f3f4f6',
              color: confidence === 'High' ? '#1e40af' : confidence === 'Moderate' ? '#92400e' : '#6b7280',
              border: `1px solid ${confidence === 'High' ? '#bfdbfe' : confidence === 'Moderate' ? '#fde68a' : '#e5e7eb'}`
            }}>
              {confidence} confidence
            </span>
          )}
          {sourceIds.map(id => {
            const sid = String(id).toUpperCase();
            const isTrial = sid.startsWith('T');
            return (
              <span 
                key={id} 
                onClick={() => { 
                  const elementId = isTrial ? `trial-${sid}` : `pub-${id}`;
                  const el = document.getElementById(elementId); 
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
                }}
                style={{ 
                  fontSize: '0.63rem', fontWeight: 800, padding: '1px 7px', borderRadius: 999, 
                  background: isTrial ? '#fff9f2' : '#e8f3f1', 
                  color: isTrial ? '#d4a373' : '#2d5a52', 
                  cursor: 'pointer', border: `1px solid ${isTrial ? '#d4a37344' : '#c6e4dd'}` 
                }}
              >
                [{sid}]
              </span>
            );
          })}
        </div>
      </div>
    </li>
  );
};

// ─── Research Context Panel ───
const INTENT_OPTIONS = [
  'Treatment options', 'Clinical trials', 'Disease mechanisms',
  'Diagnostic criteria', 'Drug interactions', 'Epidemiology',
  'Prevention strategies', 'Biomarkers', 'Surgical interventions', 'Prognosis'
];

/* ─── Clinical Trial Highlight Item ─── */
const TrialHighlightItem = ({ trial }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
    background: '#fff', border: '1.5px solid #d4a37333', borderRadius: 12, marginBottom: 8
  }}>
    <FlaskConical size={14} color="#d4a373" style={{ marginTop: 3, flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '0.86rem', lineHeight: 1.55, margin: 0, color: 'var(--text)' }}>
        {trial.text}
        {trial.trialId && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 800, background: '#d4a3731a', color: '#d4a373',
            padding: '1px 5px', borderRadius: 4, marginLeft: 6, verticalAlign: 'middle', textTransform: 'uppercase'
          }}>
            Trial {trial.trialId}
          </span>
        )}
      </p>
    </div>
  </div>
);

/* ─── Source Attribution List (Verified Sources) ─── */
const SourceAttributionList = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!sources || sources.length === 0) return null;

  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem',
          fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0,
          textTransform: 'uppercase', letterSpacing: '0.05em'
        }}
      >
        <BookOpen size={12} /> {isExpanded ? 'Hide' : 'View'} {sources.length} Verified Sources {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {isExpanded && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sources.map((src, i) => (
            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontWeight: 800, color: 'var(--primary)', flexShrink: 0 }}>[{src.index}]</span>
                <div>
                  <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                    {src.title}
                  </a>
                  <div style={{ fontSize: '0.72rem', marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <span>{src.authors}</span>
                    <span>•</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{src.year}</span>
                    {src.platform && (
                      <span style={{
                        background: 'var(--secondary-light)', color: 'var(--secondary)',
                        padding: '1px 6px', borderRadius: 4, fontWeight: 700, fontSize: '0.65rem'
                      }}>
                        {src.platform}
                      </span>
                    )}
                  </div>
                  {src.snippet && <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', fontSize: '0.75rem', color: '#64748b' }}>"{src.snippet}"</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ResearchContextPanel = ({ context, onChange, onClose }) => {
  const [local, setLocal] = useState({ ...context });

  const update = (field, value) => setLocal(prev => ({ ...prev, [field]: value }));
  const apply = () => { onChange(local); onClose(); };
  const clear = () => { const empty = { disease: '', intent: '', location: '', patientName: '', additionalQuery: '' }; setLocal(empty); onChange(empty); };

  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 100,
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: '16px 16px 0 0', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
      padding: '20px 24px 16px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SlidersHorizontal size={16} color="var(--primary)" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.88rem', margin: 0 }}>Research Context</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Optional — refines your query for more targeted results</p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 8 }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Patient Name */}
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
            Patient Name <span style={{ fontWeight: 400, textTransform: 'none', opacity: 0.6 }}>(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. John Smith"
            value={local.patientName}
            onChange={e => update('patientName', e.target.value)}
            style={{ padding: '9px 14px', fontSize: '0.88rem', borderRadius: 10, border: '1.5px solid var(--border)', width: '100%', background: 'var(--bg)', marginTop: 0 }}
          />
        </div>

        {/* Disease / Condition */}
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
            Disease / Condition
          </label>
          <input
            type="text"
            placeholder="e.g. Parkinson's disease"
            value={local.disease}
            onChange={e => update('disease', e.target.value)}
            style={{ padding: '9px 14px', fontSize: '0.88rem', borderRadius: 10, border: '1.5px solid var(--border)', width: '100%', background: 'var(--bg)', marginTop: 0 }}
          />
        </div>

        {/* Research Intent */}
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
            Research Intent
          </label>
          <select
            value={local.intent}
            onChange={e => update('intent', e.target.value)}
            style={{ padding: '9px 14px', fontSize: '0.88rem', borderRadius: 10, border: '1.5px solid var(--border)', width: '100%', background: 'var(--bg)', marginTop: 0, cursor: 'pointer' }}
          >
            <option value="">— Select intent —</option>
            {INTENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Location */}
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
            Location <span style={{ fontWeight: 400, textTransform: 'none', opacity: 0.6 }}>(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Toronto, Canada"
            value={local.location}
            onChange={e => update('location', e.target.value)}
            style={{ padding: '9px 14px', fontSize: '0.88rem', borderRadius: 10, border: '1.5px solid var(--border)', width: '100%', background: 'var(--bg)', marginTop: 0 }}
          />
        </div>

        {/* Additional Query */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
            Additional Focus <span style={{ fontWeight: 400, textTransform: 'none', opacity: 0.6 }}>(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Deep Brain Stimulation, subthalamic nucleus targeting"
            value={local.additionalQuery}
            onChange={e => update('additionalQuery', e.target.value)}
            style={{ padding: '9px 14px', fontSize: '0.88rem', borderRadius: 10, border: '1.5px solid var(--border)', width: '100%', background: 'var(--bg)', marginTop: 0 }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
        <button onClick={clear} style={{
          padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--border)',
          background: '#fff', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
        }}>Clear</button>
        <button onClick={apply} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.82rem' }}>
          Apply Context
        </button>
      </div>
    </div>
  );
};

// ─── Active Context Tag (shown in toolbar when context is active) ───
const ActiveContextTag = ({ context, onClear }) => {
  const parts = [context.disease, context.intent, context.location].filter(Boolean);
  if (!parts.length && !context.patientName && !context.additionalQuery) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 6px',
      borderRadius: 999, background: 'var(--primary-light)', border: '1px solid var(--border)',
      fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)',
    }}>
      <Search size={11} color="var(--primary)" />
      <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {context.disease || context.additionalQuery || context.intent}
        {context.location ? ` · ${context.location}` : ''}
      </span>
      <button onClick={onClear} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 1 }}>
        <X size={11} />
      </button>
    </div>
  );
};

// ─── EMPTY CONTEXT (default) ───
const EMPTY_CONTEXT = { disease: '', intent: '', location: '', patientName: '', additionalQuery: '' };

// ─── Main Chat Page ───
const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [researchByIndex, setResearchByIndex] = useState({});
  const [replyMetaByIndex, setReplyMetaByIndex] = useState({});
  const [followUpsByIndex, setFollowUpsByIndex] = useState({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [userContext, setUserContext] = useState(EMPTY_CONTEXT);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const suggestions = [
    "What does current research say about GLP-1 agonists and weight management?",
    "Summarize recent clinical trials for Alzheimer's disease treatments.",
    "What is the evidence base for SSRI use in treatment-resistant depression?",
    "Latest findings on CRISPR gene therapy for sickle cell disease.",
  ];

  useEffect(() => {
    api.get('/chat/history')
      .then(res => setMessages(res.data))
      .catch(err => console.error('Failed to fetch chat history', err))
      .finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Close context panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (showContextPanel && !e.target.closest('[data-context-panel]') && !e.target.closest('[data-context-btn]')) {
        setShowContextPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showContextPanel]);

  const hasContext = () => Object.values(userContext).some(v => v.trim() !== '');

  const handleSend = async (text) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);
    setShowContextPanel(false);

    try {
      const payload = { message: msg };
      if (hasContext()) payload.userContext = userContext;

      const res = await api.post('/chat', payload);
      const newHistory = res.data.history;
      setMessages(newHistory);

      const lastIdx = newHistory.length - 1;

      if (res.data.research) {
        setResearchByIndex(prev => ({ ...prev, [lastIdx]: res.data.research }));
      }
      if (res.data.research?.meta) {
        setReplyMetaByIndex(prev => ({
          ...prev,
          [lastIdx]: {
            isResearchMode: res.data.research.meta.isResearchMode ?? false,
            isLowEvidence: res.data.research.meta.isLowEvidence ?? false,
          }
        }));
      }
      if (res.data.followUpQuestions?.length > 0) {
        setFollowUpsByIndex(prev => ({ ...prev, [lastIdx]: res.data.followUpQuestions }));
      }
    } catch (err) {
      console.error('[Chat] Request error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Research engine is temporarily unavailable. Please try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  if (initialLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <Microscope size={40} color="var(--primary)" style={{ animation: 'pulse 1.5s ease infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading research session...</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* ─── Header ─── */}
      <header className="glass" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', padding: 4, border: 'none', cursor: 'pointer' }}>
            <ChevronLeft size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', margin: 0, lineHeight: 1.3 }}>Curalink Research Assistant</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Evidence-Based · Peer-Reviewed
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--secondary-light)', padding: '5px 12px', borderRadius: 999 }}>
          <ShieldAlert size={13} color="var(--secondary)" /> Research Only
        </div>
      </header>

      {/* ─── Disclaimer Banner ─── */}
      <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '7px 24px', fontSize: '0.72rem', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, flexShrink: 0 }}>
        <Info size={13} />
        <span><strong>RESEARCH TOOL:</strong> Curalink presents peer-reviewed evidence only. It does not provide medical advice or diagnosis.</span>
      </div>

      {/* ─── Messages ─── */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}
      >
        {/* Empty state */}
        {messages.length === 0 && (
          <div className="animate-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
            <Sparkles size={44} color="var(--primary)" style={{ opacity: 0.2, marginBottom: 14 }} />
            <h2 style={{ fontSize: '1.3rem', marginBottom: 8 }}>What will you research today?</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.65 }}>
              I'll search PubMed, OpenAlex, and ClinicalTrials.gov and present ranked, cited scientific evidence.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => handleSend(s)} style={{
                  textAlign: 'left', padding: '14px 18px', borderRadius: 12,
                  border: '1.5px solid var(--border)', background: '#fff', fontSize: '0.88rem',
                  color: 'var(--text)', cursor: 'pointer', transition: 'var(--transition)'
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#fff'; }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((m, i) => {
          const rawText = m.content;
          const parsed = m.role === 'assistant' ? cleanJSON(rawText) : null;
          const meta = replyMetaByIndex[i];
          const research = researchByIndex[i];
          const publications = research?.publications || [];

          return (
            <React.Fragment key={i}>
              {/* Message bubble */}
              <div className="animate-fade" style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                <div style={{
                  padding: '14px 18px',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.role === 'user' ? '#fff' : 'var(--primary-light)',
                  color: m.role === 'user' ? 'var(--primary)' : 'var(--text)',
                  border: m.role === 'user' ? '1.5px solid #e0ede9' : 'none',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  {m.role === 'user' ? (
                    <p style={{ fontSize: '0.92rem', lineHeight: 1.7, margin: 0, color: 'inherit' }}>{rawText}</p>
                  ) : parsed ? (
                    <div>
                      {meta && (
                        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <QueryModeBadge isResearchMode={meta.isResearchMode} />
                        </div>
                      )}
                      {meta?.isLowEvidence && <LowEvidenceWarning />}
                      <p style={{ fontSize: '0.92rem', lineHeight: 1.7, margin: '8px 0 12px 0' }}>
                        {renderMessageWithCitations(parsed.conditionOverview, publications)}
                      </p>
                      {parsed.researchInsights?.length > 0 && (
                        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                            Key Clinical Insights
                          </span>
                          <ul style={{ margin: 0, paddingLeft: 18, listStyle: 'none' }}>
                            {parsed.researchInsights.map((ins, idx) => (
                              <InsightItem key={idx} insight={ins} publications={publications} />
                            ))}
                          </ul>
                        </div>
                      )}

                      {parsed.clinicalTrialsSummary?.some(t => String(t.text || '').trim().length > 0) && (
                        <div style={{ background: '#fff9f2', padding: '12px 16px', borderRadius: 12, border: '1px solid #d4a37344', marginBottom: 12 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d4a373', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                            Clinical Research Summary
                          </span>
                          <div>
                            {parsed.clinicalTrialsSummary.filter(t => String(t.text || '').trim().length > 0).map((trial, idx) => (
                              <TrialHighlightItem key={idx} trial={trial} />
                            ))}
                          </div>
                        </div>
                      )}

                      {parsed.sourceAttribution?.length > 0 && (
                        <SourceAttributionList sources={parsed.sourceAttribution} />
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.92rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
                      {renderMessageWithCitations(rawText, publications)}
                    </p>
                  )}
                </div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, padding: '0 4px' }}>
                  {m.role === 'user' ? 'You' : 'Curalink Research Assistant'}
                </p>
              </div>

              {/* Inline research panel */}
              {m.role === 'assistant' && research && <InlineResearchPanel research={research} />}

              {/* Follow-up suggestions */}
              {m.role === 'assistant' && followUpsByIndex[i]?.length > 0 && (
                <div className="animate-fade" style={{ alignSelf: 'flex-start', maxWidth: '88%', marginTop: 2 }}>
                  <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 16px' }}>
                    <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                      Suggested Follow-Up Questions
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {followUpsByIndex[i].map((q, qi) => (
                        <button key={qi} onClick={() => handleSend(q)} disabled={loading} style={{
                          textAlign: 'left', padding: '9px 13px', borderRadius: 10,
                          border: '1.5px solid var(--border)', background: 'var(--bg)',
                          fontSize: '0.83rem', color: 'var(--primary)', fontWeight: 500,
                          cursor: 'pointer', transition: 'var(--transition)', lineHeight: 1.5
                        }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }}
                        >
                          🔬 {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Loading indicator */}
        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ background: '#fff', border: '1px solid var(--border)', padding: '14px 20px', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'bounce 1s ease infinite', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0 4px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Microscope size={11} /> Retrieving and ranking peer-reviewed evidence...
            </p>
          </div>
        )}
      </div>

      {/* ─── Input Area ─── */}
      <div style={{ background: '#fff', borderTop: '1px solid var(--border)', flexShrink: 0, position: 'relative' }}>
        {/* Context panel (slides up from input area) */}
        {showContextPanel && (
          <div data-context-panel>
            <ResearchContextPanel
              context={userContext}
              onChange={setUserContext}
              onClose={() => setShowContextPanel(false)}
            />
          </div>
        )}

        <div style={{ padding: '14px 24px 16px', maxWidth: 860, margin: '0 auto' }}>
          {/* Context tag + toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {/* Context toggle button */}
            <button
              data-context-btn
              onClick={() => setShowContextPanel(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                borderRadius: 999, border: '1.5px solid', fontSize: '0.76rem', fontWeight: 600,
                cursor: 'pointer', transition: 'var(--transition)',
                borderColor: showContextPanel || hasContext() ? 'var(--primary)' : 'var(--border)',
                background: showContextPanel || hasContext() ? 'var(--primary-light)' : '#fff',
                color: showContextPanel || hasContext() ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              <SlidersHorizontal size={13} />
              Research Context
              {hasContext() && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />}
            </button>

            {/* Active context summary tag */}
            {hasContext() && (
              <ActiveContextTag
                context={userContext}
                onClear={() => setUserContext(EMPTY_CONTEXT)}
              />
            )}
          </div>

          {/* Input row */}
          <form onSubmit={e => { e.preventDefault(); handleSend(); }} style={{ position: 'relative', display: 'flex', gap: 10 }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask a medical research question…"
              value={input}
              onChange={e => setInput(e.target.value)}
              style={{
                flex: 1, padding: '14px 18px', fontSize: '0.95rem',
                borderRadius: 14, border: '1.5px solid var(--border)',
                background: '#fff', color: 'var(--text)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'var(--transition)',
                marginTop: 0,
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: 48, height: 48, borderRadius: 12,
                background: loading || !input.trim() ? '#e5e7eb' : 'var(--primary)',
                color: loading || !input.trim() ? '#9ca3af' : '#fff',
                border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'var(--transition)', flexShrink: 0,
              }}
            >
              <Send size={18} />
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 10 }}>
            Powered by Hugging Face · Evidence from PubMed, OpenAlex &amp; ClinicalTrials.gov
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
