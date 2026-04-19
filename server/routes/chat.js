const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
const ChatHistory = require('../models/ChatHistory');
const { aggregateResearch } = require('../services/researchAggregator');

const router = express.Router();

const HF_API_URL = process.env.HF_API_URL || 'https://router.huggingface.co/v1/chat/completions';
const MODEL = process.env.HF_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';

// ─── Intent guardrail keywords ───
// If a query contains these, we redirect research-first rather than providing advice
const ADVICE_INTENT_PATTERNS = [
  /\b(how (to|can i) (cure|treat|fix|manage|get rid of))\b/i,
  /\b(what should i (eat|do|take|avoid))\b/i,
  /\b(best (diet|food|supplement|remedy|treatment) for)\b/i,
  /\b(i (have|feel|am suffering from|am experiencing))\b/i,
  /\b(help me (lose|gain) weight)\b/i,
  /\b(recommend (me|a) (drug|medicine|supplement|diet))\b/i,
];

function detectAdviceIntent(query) {
  return ADVICE_INTENT_PATTERNS.some(p => p.test(query));
}

// ─── Extract keywords from query for Emerging Themes analytics ───
const STOP_WORDS = new Set(['what','does','the','for','and','with','how','why','are','can',
  'have','this','that','from','its','into','about','more','your','been','they','when',
  'also','which','some','such','than','then','them','these','will','make','like','just',
  'was','were','had','his','her','their','our','you','but','not','all']);

function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4 && !STOP_WORDS.has(w))
    .slice(0, 8);
}

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await ChatHistory.findOne({ userId: req.userId });
    res.json(history?.messages || []);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch history.' });
  }
});

// Clear chat history
router.delete('/history', authMiddleware, async (req, res) => {
  try {
    await ChatHistory.findOneAndUpdate(
      { userId: req.userId },
      { messages: [], sessions: [] },
      { new: true }
    );
    res.json({ message: 'History cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear history.' });
  }
});

// Post a message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message, userContext } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message cannot be empty.' });

    // ─── Temporary Context Purge (Imitation Fix v1.2.1) ───
    // This clears the user's history once to remove legacy JSON patterns
    if (req.query.wipe === 'true' || process.env.AUTO_WIPE === 'true') {
      try {
        await ChatHistory.deleteMany({ userId: req.userId });
        console.log(`[Reliability] ChatHistory for User ${req.userId} purged to eliminate imitation bias.`);
      } catch (wipeErr) {
        console.error('[Reliability] History purge failed:', wipeErr.message);
      }
    }

    // Step 1: Load chat history
    let history = await ChatHistory.findOne({ userId: req.userId });
    if (!history) history = new ChatHistory({ userId: req.userId, messages: [], sessions: [] });

    // Step 2: Build expanded query (history + optional user context)
    const expandedQuery = buildExpandedQuery(message, history.messages, userContext);
    console.log(`[Chat] Query: "${message}" | Expanded: "${expandedQuery}"`);

    // Step 3: Research retrieval (non-blocking on failure)
    const research = await aggregateResearch(expandedQuery, null).catch(err => {
      console.error('[Chat] Research failed (non-blocking):', err.message);
      return { publications: [], trials: [], meta: { isLowEvidence: true, isResearchMode: false } };
    });

    const isLowEvidence = research.meta?.isLowEvidence ?? true;
    const isResearchMode = research.meta?.isResearchMode ?? false;
    const isAdviceQuery = detectAdviceIntent(message);


    // Step 4: Build research context for the prompt (compact data format)
    let researchContext = '';
    if (research.publications.length > 0) {
      researchContext += '### SCIENTIFIC PUBLICATIONS\n';
      research.publications.forEach((p, i) => {
        researchContext += `ID[${i + 1}]: ${p.title} (${p.year})\n`;
        researchContext += `   Auth: ${p.authors?.slice(0, 2).join(', ') || 'N/A'}\n`;
        researchContext += `   Tier: ${p.confidenceTier} | Plat: ${p.provider} | URL: ${p.url}\n`;
        if (p.snippet) researchContext += `   Key Findings: ${p.snippet}\n`;
      });
    }
    if (research.trials.length > 0) {
      researchContext += '\n### CLINICAL TRIALS\n';
      research.trials.forEach((t, i) => {
        researchContext += `ID[T${i + 1}]: ${t.title}\n`;
        researchContext += `   Status: ${t.status} | Phase: ${t.phase} | URL: ${t.url}\n`;
        if (t.summary) researchContext += `   Trial Overview: ${t.summary}\n`;
      });
    }

    // Step 5: Build evidence directive (Simplified Intent-based)
    let evidenceDirective = '';
    if (isAdviceQuery) {
      evidenceDirective = 'ADVICE DETECTED: Redirect to scientific landscape in conditionOverview; do not provide remedies.';
    } else if (isLowEvidence || !researchContext) {
      evidenceDirective = 'LIMITED EVIDENCE: State that clinical data is inconclusive in conditionOverview; do not invent findings.';
    }

    // Step 6: System prompt — Reliability 2.0 (High-Guard Orchestration)
    const systemPrompt = `Role: Biomedical Research Orchestrator (v2.0)
Task: Synthesize evidence into a two-part report: Natural Prose followed by Tagged JSON.

### EVIDENCE
${researchContext || 'Limited clinical data available.'}
<!-- Request-ID: ${Math.random().toString(36).substring(7)} -->

### CONSTRAINTS
1. NO MEDICAL ADVICE.
2. CITATIONS: Use [N] or [T1] for every claim.
3. ${evidenceDirective}
4. TONE: Fluid, professional prose.
5. JSON: Return technical pillars ONLY between the tags below.

---DATA_START---
{
  "schemaVersion": "2.0",
  "researchInsights": [{"text":"string [1]","sourceIds":[number|string],"confidence":"High|Moderate|Low"}],
  "clinicalTrialsSummary": [{"text":"string [T1]","trialId":"string"}],
  "sourceAttribution": [{"index":number,"title":"str","authors":"str","year":"str","platform":"str","url":"str","snippet":"str"}],
  "isResearchMode": boolean
}
---DATA_END---`;


    // Step 7: Append user message and prepare context window
    history.messages.push({ role: 'user', content: message });
    const recentMessages = history.messages.slice(-10);

    // Step 8: Call Hugging Face API (Generation 1)
    let response = await axios.post(HF_API_URL, {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentMessages.map(m => ({ role: m.role, content: m.content }))
      ],
      max_tokens: 1500,
      temperature: 0.2,
      options: { use_cache: false }
    }, {
      headers: { 'Authorization': `Bearer ${process.env.HF_TOKEN}`, 'Content-Type': 'application/json', 'x-use-cache': 'false' },
    });

    let rawOutput = response.data.choices[0].message.content.trim();
    
    // Step 9: Boundary Validation (Audit)
    let validation = validateAndNormalize(rawOutput, isResearchMode);
    const originalOverview = validation.parsed.conditionOverview;

    // Step 10: Validation-Guided 1-Shot Repair (if needed)
    if (validation.errors.length > 0) {
      console.warn(`[Reliability 2.0] Audit failed: ${validation.errors.join(', ')}. Triggering repair...`);
      
      const repairPrompt = `System: Fix ONLY the structural errors in the JSON block. Do NOT alter claims.
      
Errors:
${validation.errors.map(e => `- ${e}`).join('\n')}

Input:
${rawOutput}

Corrected Report (v2.0):
---DATA_START---
{ [FIXED JSON] }
---DATA_END---`;

      try {
        const repairRes = await axios.post(HF_API_URL, {
          model: MODEL,
          messages: [{ role: 'user', content: repairPrompt }],
          max_tokens: 1500,
          temperature: 0.1,
          options: { use_cache: false }
        }, {
          headers: { 'Authorization': `Bearer ${process.env.HF_TOKEN}`, 'Content-Type': 'application/json' },
        });

        rawOutput = repairRes.data.choices[0].message.content.trim();
        validation = validateAndNormalize(rawOutput, isResearchMode);
        
        // Hybrid Preservation: If repair lost the prose Overview, re-attach the original one
        if (originalOverview && (!validation.parsed.conditionOverview || validation.parsed.conditionOverview.includes('error encountered'))) {
          validation.parsed.conditionOverview = originalOverview;
        }

        if (validation.errors.length === 0) {
          console.log('[Reliability] 1-Shot repair successful.');
        } else {
          console.error(`[Reliability] 1-Shot repair failed again: ${validation.errors.join(', ')}. Falling back to safe prose.`);
        }
      } catch (repairErr) {
        console.error('[Reliability] Repair call failed:', repairErr.message);
      }
    }

    const parsedReply = validation.parsed;

    // Step 10: Generate follow-up questions (lightweight, non-blocking)
    let followUpQuestions = [];
    try {
      const followUpPrompt = `You are a medical research assistant. Given the following research query and response summary, generate exactly 3 concise follow-up research questions a scientist might logically ask next.

Original Query: "${message}"
Response Summary: "${parsedReply.conditionOverview?.slice(0, 300) || ''}"

Rules:
- Each question must be a specific, evidence-seeking research question (not advice-seeking).
- Return ONLY a JSON array of 3 strings. No other text.
Example: ["What are the long-term cardiovascular outcomes of GLP-1 use beyond 2 years?", "How does semaglutide compare to tirzepatide in head-to-head RCTs?", "What patient populations show the weakest response to GLP-1 therapy?"]`;

      const fuRes = await axios.post(HF_API_URL, {
        model: MODEL,
        messages: [{ role: 'user', content: followUpPrompt }],
        max_tokens: 250,
        temperature: 0.5,
      }, {
        headers: { 'Authorization': `Bearer ${process.env.HF_TOKEN}`, 'Content-Type': 'application/json' },
      });

      let fuRaw = fuRes.data.choices[0].message.content.trim()
        .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
      const fuParsed = JSON.parse(fuRaw);
      if (Array.isArray(fuParsed)) followUpQuestions = fuParsed.slice(0, 3);
    } catch (fuErr) {
      console.warn('[Chat] Follow-up generation failed (non-blocking):', fuErr.message);
      // Fallback: derive basic follow-ups from query keywords
      const kws = extractKeywords(message);
      if (kws.length > 0) {
        followUpQuestions = [
          `What are the long-term outcomes of studies on ${kws[0]}?`,
          `How do recent meta-analyses evaluate ${kws[0]}${kws[1] ? ` and ${kws[1]}` : ''}?`,
          `What clinical trials are currently recruiting for ${kws[0]} research?`,
        ];
      }
    }

    // Step 11: Save assistant message and session analytics
    history.messages.push({ role: 'assistant', content: JSON.stringify(parsedReply) });

    // Save session analytics (for dashboard: Emerging Themes, Top Publications)
    const sessionEntry = {
      query: message,
      enrichedQuery: expandedQuery,
      timestamp: new Date(),
      sources: research.publications.slice(0, 5).map(p => ({
        title: p.title,
        year: p.year,
        provider: p.provider,
        url: p.url,
        confidenceTier: p.confidenceTier,
        relevanceScore: p.relevanceScore,
      })),
      keywords: extractKeywords(expandedQuery),
    };
    history.sessions = history.sessions || [];
    history.sessions.push(sessionEntry);
    if (history.sessions.length > 50) history.sessions = history.sessions.slice(-50);

    await history.save();

    res.json({
      reply: parsedReply,
      followUpQuestions,
      history: history.messages,
      research: {
        publications: research.publications,
        trials: research.trials,
        meta: research.meta,
      },
    });

  } catch (err) {
    console.error('[Chat] Error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to process research query. Please try again.' });
  }
});

// ─── Analytics endpoint for dashboard ───
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const history = await ChatHistory.findOne({ userId: req.userId });
    if (!history || !history.sessions?.length) {
      return res.json({ themes: [], topPublications: [], recentInsights: [], totalSessions: 0 });
    }

    const sessions = history.sessions;

    // Keyword frequency for Emerging Themes (hybrid step 1)
    const keywordFreq = {};
    sessions.forEach(s => {
      (s.keywords || []).forEach(kw => {
        keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
      });
    });
    const themes = Object.entries(keywordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    // Top Publications — deduplicated by URL, sorted by relevance
    const pubMap = {};
    sessions.forEach(s => {
      (s.sources || []).forEach(pub => {
        if (!pub.url) return;
        if (!pubMap[pub.url] || (pub.relevanceScore > (pubMap[pub.url].relevanceScore || 0))) {
          pubMap[pub.url] = pub;
        }
      });
    });
    const topPublications = Object.values(pubMap)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 5);

    // Recent Research Insights — last 5 session queries
    const recentInsights = sessions
      .slice(-5)
      .reverse()
      .map(s => ({
        query: s.query,
        timestamp: s.timestamp,
        sourceCount: s.sources?.length || 0,
      }));

    res.json({
      themes,
      topPublications,
      recentInsights,
      totalSessions: sessions.length,
    });
  } catch (err) {
    console.error('[Analytics] Error:', err.message);
    res.status(500).json({ message: 'Failed to load analytics.' });
  }
});

// ─── Helper: Build context-expanded query ───
// userContext = { disease, intent, location, patientName, additionalQuery }
// Also handles natural-language structured input like:
//   "Patient Name: John Smith\nDisease of Interest: Parkinson's disease\nDeep Brain Stimulation\nLocation: Toronto"
function buildExpandedQuery(currentMessage, chatHistory, userContext) {
  // ── Step A: Parse natural-language structured input from the message itself ──
  const naturalParsed = parseNaturalStructuredQuery(currentMessage);
  // Merge natural-parsed fields with explicit userContext (userContext takes priority)
  const ctx = {
    disease: userContext?.disease || naturalParsed.disease || '',
    intent: userContext?.intent || naturalParsed.intent || '',
    location: userContext?.location || naturalParsed.location || '',
    patientName: userContext?.patientName || naturalParsed.patientName || '',
    additionalQuery: userContext?.additionalQuery || naturalParsed.additionalQuery || '',
  };

  // Reconstruct the core query stripping structured-field labels to get the natural topic
  let coreQuery = naturalParsed.coreQuery || currentMessage;

  // ── Step B: Build structured query string from context fields ──
  const contextParts = [];
  if (ctx.disease) contextParts.push(ctx.disease);
  if (ctx.intent) contextParts.push(ctx.intent);
  if (ctx.additionalQuery) contextParts.push(ctx.additionalQuery);
  if (ctx.location) contextParts.push(ctx.location);

  // Merge context parts into the core query without duplication
  const coreWords = new Set(coreQuery.toLowerCase().split(/\s+/));
  const uniqueCtxTerms = contextParts.join(' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !coreWords.has(w.toLowerCase()));

  let queryBase = uniqueCtxTerms.length > 0
    ? `${coreQuery} ${uniqueCtxTerms.join(' ')}`
    : coreQuery;

  // ── Step C: Historical context expansion from recent turns ──
  if (chatHistory?.length) {
    const recentTurns = chatHistory.slice(-4);
    const contextTerms = new Set();
    for (const msg of recentTurns) {
      if (msg.role === 'user') {
        msg.content.toLowerCase().split(/\s+/).filter(w => w.length > 4).forEach(w => contextTerms.add(w));
      } else if (msg.role === 'assistant') {
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.conditionOverview) {
            const medTerms = parsed.conditionOverview.match(/\b[A-Z][a-z]{3,}\b/g) || [];
            medTerms.slice(0, 3).forEach(t => contextTerms.add(t.toLowerCase()));
          }
        } catch (_) {}
      }
    }
    const baseWords = new Set(queryBase.toLowerCase().split(/\s+/));
    const expansionTerms = [...contextTerms].filter(t => !baseWords.has(t)).slice(0, 4);
    if (expansionTerms.length > 0) queryBase = `${queryBase} ${expansionTerms.join(' ')}`;
  }

  return queryBase.trim();
}

// ─── Helper: Parse natural/structured mixed queries ───
// Supports formats like:
//   "Patient Name: John / Disease of Interest: Parkinson's / Location: Toronto, Canada"
//   or plain natural language
function parseNaturalStructuredQuery(text) {
  const result = {
    patientName: '',
    disease: '',
    intent: '',
    location: '',
    additionalQuery: '',
    coreQuery: text,
  };

  // Pattern: "Field Name: Value" style
  const fieldPattern = /(?:patient\s*name|name)\s*:\s*([^\n,]+)/i;
  const diseasePattern = /(?:disease(?:\s*of\s*interest)?|condition|diagnosis)\s*:\s*([^\n,]+)/i;
  const intentPattern = /(?:research\s*intent|intent|focus|query\s*type)\s*:\s*([^\n,]+)/i;
  const locationPattern = /(?:location|city|country|region)\s*:\s*([^\n,]+)/i;
  const additionalPattern = /(?:additional\s*query|additional\s*context|topic|about)\s*:\s*([^\n,]+)/i;

  const nameMatch = text.match(fieldPattern);
  const diseaseMatch = text.match(diseasePattern);
  const intentMatch = text.match(intentPattern);
  const locationMatch = text.match(locationPattern);
  const additionalMatch = text.match(additionalPattern);

  if (nameMatch) result.patientName = nameMatch[1].trim();
  if (diseaseMatch) result.disease = diseaseMatch[1].trim();
  if (intentMatch) result.intent = intentMatch[1].trim();
  if (locationMatch) result.location = locationMatch[1].trim();
  if (additionalMatch) result.additionalQuery = additionalMatch[1].trim();

  // If structured fields were found, build a clean core query from them
  if (diseaseMatch || additionalMatch) {
    const parts = [];
    if (result.disease) parts.push(result.disease);
    if (result.additionalQuery) parts.push(result.additionalQuery);
    if (result.intent) parts.push(result.intent);
    if (parts.length > 0) result.coreQuery = parts.join(' ');
  }

  return result;
}


// ─── Schema Guard: Validate & normalize LLM output (v2.0 Tag-Based) ───
function validateAndNormalize(rawText, isResearchMode) {
  const errors = [];
  let parsed = null;
  let conditionOverview = '';

  const START_TAG = '---DATA_START---';
  const END_TAG = '---DATA_END---';

  try {
    // 1. Tag-Based Extraction (Prevents brace confusion)
    const startIndex = rawText.indexOf(START_TAG);
    const endIndex = rawText.lastIndexOf(END_TAG);

    if (startIndex === -1) {
      // Fallback to finding braces if tags are missing (backwards compatibility)
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        conditionOverview = rawText.trim();
        throw new Error('Missing structural tags and no JSON block found');
      }
      conditionOverview = rawText.substring(0, firstBrace).trim();
      const sanitized = rawText.substring(firstBrace, lastBrace + 1);
      parsed = JSON.parse(sanitized);
    } else {
      // Standard Tag Workflow
      conditionOverview = rawText.substring(0, startIndex).trim();
      const jsonContent = rawText.substring(startIndex + START_TAG.length, endIndex === -1 ? undefined : endIndex).trim();
      
      // Secondary extraction check for the actual braces within the tags
      const fb = jsonContent.indexOf('{');
      const lb = jsonContent.lastIndexOf('}');
      if (fb === -1) throw new Error('Tags found but no JSON object inside tags');
      
      parsed = JSON.parse(jsonContent.substring(fb, lb + 1));
    }

    // Surgical Removal of Hallucinated Fields
    if (parsed && parsed.conditionOverview) {
      delete parsed.conditionOverview;
    }
  } catch (e) {
    errors.push(`Validation 2.0 Fail: ${e.message}`);
  }

  // Normalization logic (v2.0)
  if (!parsed) {
    return {
      errors,
      parsed: {
        conditionOverview: conditionOverview || 'Structural fail (v2.0).',
        researchInsights: [],
        clinicalTrialsSummary: [],
        sourceAttribution: [],
        isResearchMode: false,
        schemaVersion: '2.0'
      }
    };
  }

  const normalized = {
    schemaVersion: '2.0',
    conditionOverview: conditionOverview || String(parsed.conditionOverview || 'No overview provided.'),
    researchInsights: Array.isArray(parsed.researchInsights) ? parsed.researchInsights.map(insight => {
        const rawIds = Array.isArray(insight.sourceIds) ? insight.sourceIds : [];
        return {
          text: String(insight.text || ''),
          sourceIds: rawIds.map(id => {
            const s = String(id).toUpperCase();
            return s.startsWith('T') ? s : parseInt(s.replace(/\D/g, '')) || id;
          }),
          confidence: ['High', 'Moderate', 'Low'].includes(insight.confidence) ? insight.confidence : 'Low'
        };
      }) : [],
    clinicalTrialsSummary: Array.isArray(parsed.clinicalTrialsSummary) ? parsed.clinicalTrialsSummary.map(t => ({
        text: String(t.text || ''),
        trialId: String(t.trialId || '')
      })) : [],
    sourceAttribution: Array.isArray(parsed.sourceAttribution) ? parsed.sourceAttribution.map(s => ({
        index: s.index,
        title: String(s.title || 'Untitled'),
        authors: String(s.authors || 'Unknown'),
        year: String(s.year || ''),
        platform: String(s.platform || ''),
        url: String(s.url || ''),
        snippet: String(s.snippet || '')
      })).slice(0, 10) : [],
    isResearchMode: typeof parsed.isResearchMode === 'boolean' ? parsed.isResearchMode : isResearchMode
  };

  return { errors, parsed: normalized };
}

module.exports = router;
