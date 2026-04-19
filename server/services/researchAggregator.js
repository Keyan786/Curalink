const { searchOpenAlex } = require('./openAlexService');
const { searchPubMed } = require('./pubmedService');
const { searchClinicalTrials } = require('./clinicalTrialsService');
const ResearchCache = require('../models/ResearchCache');

// ─── Constants ───
const LOW_EVIDENCE_THRESHOLD = 40; // Minimum avg score for results to be considered reliable
const SNIPPET_SENTENCE_COUNT = 3;  // Number of complete sentences to extract from abstracts

/**
 * Normalize a query string into a stable cache key.
 * Lowercases, trims, collapses whitespace, and sorts words for fuzzy dedup.
 */
function buildCacheKey(query) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .sort()
    .join('_');
}

/**
 * Deep retrieval: fetch 50-300 results from all sources in parallel,
 * then intelligently filter, rank, and return top 6-8 results.
 *
 * Includes a MongoDB-backed caching layer with 48-hour TTL.
 *
 * @param {string} query - The user's health query
 * @param {object} profile - The user's health profile (conditions, symptoms, etc.)
 * @returns {object} { publications: [...], trials: [...], meta: {...} }
 */
async function aggregateResearch(query, profile = {}) {
  // Build enriched search terms using query + user profile context
  const profileTerms = buildProfileTerms(profile);
  const enrichedQuery = `${query} ${profileTerms}`.trim();
  const cacheKey = buildCacheKey(enrichedQuery);

  // ─── Step 0: Check cache ───
  try {
    const cached = await ResearchCache.findOne({ queryKey: cacheKey });
    if (cached) {
      console.log(`[Research] Cache HIT for key: "${cacheKey.slice(0, 60)}..." (${cached.meta.finalSelected} results)`);
      return {
        publications: cached.publications,
        trials: cached.trials,
        meta: { ...cached.meta.toObject?.() || cached.meta, cached: true }
      };
    }
  } catch (err) {
    console.error('[Research] Cache lookup failed (non-blocking):', err.message);
  }

  // ─── Step 1: Multi-Query Expansion ───
  // Generate 3 queries for deeper retrieval
  const queries = [
    enrichedQuery,
    `${enrichedQuery} clinical trials OR outcomes`,
    `${profile?.medicalHistory?.conditions?.[0] || 'general'} ${query} survival OR treatment`
  ];

  console.log(`[Research] Cache MISS — performing deep retrieval for ${queries.length} expanded queries...`);

  // ─── Step 2: Parallel Fetch across all queries and sources ───
  const fetchPromises = [];
  for (const q of queries) {
    fetchPromises.push(searchOpenAlex(q, 40));
    fetchPromises.push(searchPubMed(q, 40));
    fetchPromises.push(searchClinicalTrials(q, 25));
  }

  const results = await Promise.allSettled(fetchPromises);

  const publications = [];
  const trials = [];

  results.forEach((res, index) => {
    if (res.status === 'fulfilled') {
      // Determine what type of result this was based on the index
      if (index % 3 === 2) {
        trials.push(...res.value);
      } else {
        publications.push(...res.value);
      }
    }
  });

  console.log(`[Research] Deep retrieval: ${publications.length} publications, ${trials.length} trials`);

  // ─── Step 2: Deduplicate publications by normalized title ───
  const dedupedPubs = deduplicateByTitle(publications);

  // ─── Step 3: Score and rank publications ───
  const scoredPubs = dedupedPubs.map(pub => ({
    ...pub,
    _score: scorePublication(pub, query, profile)
  }));
  scoredPubs.sort((a, b) => b._score - a._score);

  // ─── Step 4: Score and rank trials ───
  const scoredTrials = trials.map(trial => ({
    ...trial,
    _score: scoreTrial(trial, query, profile)
  }));
  scoredTrials.sort((a, b) => b._score - a._score);

  // ─── Step 5: Select top results + enrich with snippets & confidence tier ───
  const topPubs = scoredPubs.slice(0, 8).map(({ _score, ...rest }) => ({
    ...rest,
    snippet: extractSnippet(rest.abstract),
    confidenceTier: classifyStudyConfidence(rest.title, rest.abstract),
    relevanceScore: Math.round(_score)
  }));
  const topTrials = scoredTrials.slice(0, 4).map(({ _score, ...rest }) => rest);

  // ─── Step 6: Calculate Confidence Score + Evidence Strength ───
  let confidenceScore = 'Low Evidence';
  const avgScore = topPubs.length > 0
    ? topPubs.reduce((sum, p) => sum + p.relevanceScore, 0) / topPubs.length
    : 0;
  const isLowEvidence = topPubs.length === 0 || avgScore < LOW_EVIDENCE_THRESHOLD;

  if (topPubs.length > 0) {
    const hasHighEviStudy = topPubs.some(p =>
      p.confidenceTier === 'High' || p.confidenceTier === 'Very High'
    );
    if (hasHighEviStudy && topPubs.length >= 3) {
      confidenceScore = 'High Evidence';
    } else if (topPubs.length >= 2 && !isLowEvidence) {
      confidenceScore = 'Moderate Evidence';
    }
  }

  // Determine if we have enough quality data for Research Mode
  const isResearchMode = !isLowEvidence && topPubs.length >= 2;

  const meta = {
    totalRetrieved: publications.length + trials.length,
    totalAfterDedup: dedupedPubs.length + trials.length,
    finalSelected: topPubs.length + topTrials.length,
    confidenceScore,
    isLowEvidence,
    isResearchMode,
    averageRelevance: Math.round(avgScore),
    query: enrichedQuery
  };

  console.log(`[Research] Final: ${topPubs.length} pubs (avg relevance: ${Math.round(avgScore)}), ${topTrials.length} trials | Mode: ${isResearchMode ? 'Research' : 'Quick'} | Confidence: ${confidenceScore}`);

  // ─── Step 7: Store in cache (non-blocking) ───
  try {
    await ResearchCache.findOneAndUpdate(
      { queryKey: cacheKey },
      {
        queryKey: cacheKey,
        publications: topPubs,
        trials: topTrials,
        meta,
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );
    console.log(`[Research] Results cached with key: "${cacheKey.slice(0, 60)}..."`);
  } catch (err) {
    console.error('[Research] Cache write failed (non-blocking):', err.message);
  }

  return {
    publications: topPubs,
    trials: topTrials,
    meta: { ...meta, cached: false }
  };
}

/**
 * Build additional search terms from the user's health profile.
 */
function buildProfileTerms(profile) {
  const terms = [];

  if (profile?.medicalHistory?.conditions?.length) {
    terms.push(...profile.medicalHistory.conditions);
  }
  if (profile?.currentSymptoms?.length) {
    terms.push(...profile.currentSymptoms);
  }
  if (profile?.lifestyle?.dietType) {
    terms.push(profile.lifestyle.dietType + ' diet');
  }

  return terms.slice(0, 5).join(' ');
}

/**
 * Deduplicate publications by normalized title.
 */
function deduplicateByTitle(publications) {
  const seen = new Map();
  for (const pub of publications) {
    const key = (pub.title || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
    if (!key) continue;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, pub);
    } else {
      // Keep the one with more data (longer abstract, more citations)
      if ((pub.abstract?.length || 0) > (existing.abstract?.length || 0) ||
          (pub.citations || 0) > (existing.citations || 0)) {
        seen.set(key, pub);
      }
    }
  }
  return Array.from(seen.values());
}

/**
 * Extract the first N complete sentences from an abstract.
 * Uses sentence-boundary detection instead of raw character cuts.
 */
function extractSnippet(abstract) {
  if (!abstract || abstract.trim().length === 0) return '';

  // Split on sentence boundaries: period/exclamation/question followed by space or end-of-string
  const sentences = abstract.match(/[^.!?]*[.!?]+(?:\s|$)/g);
  if (!sentences || sentences.length === 0) {
    // Fallback: if no sentence boundaries found, take first 250 chars cleanly
    return abstract.length <= 250 ? abstract : abstract.slice(0, 250).replace(/\s+\S*$/, '') + '...';
  }

  let snippet = '';
  for (let i = 0; i < Math.min(sentences.length, SNIPPET_SENTENCE_COUNT); i++) {
    snippet += sentences[i].trim() + ' ';
  }
  return snippet.trim();
}

/**
 * Classify a publication's confidence tier based on study design.
 * Returns: 'Very High' | 'High' | 'Moderate' | 'Low'
 */
function classifyStudyConfidence(title, abstract) {
  const text = `${(title || '')} ${(abstract || '')}`.toLowerCase();

  if (text.includes('meta-analysis')) return 'Very High';
  if (text.includes('systematic review')) return 'Very High';
  if (text.includes('randomized controlled trial') || text.match(/\brct\b/)) return 'High';
  if (text.includes('clinical trial') || text.includes('double-blind')) return 'High';
  if (text.includes('cohort study') || text.includes('prospective study')) return 'Moderate';
  if (text.includes('observational study') || text.includes('cross-sectional')) return 'Moderate';
  if (text.includes('case report') || text.includes('case series')) return 'Low';
  return 'Low'; // Default for unclassifiable studies
}

/**
 * Score a publication based on relevance, recency, credibility, and study type.
 */
function scorePublication(pub, query, profile) {
  let keywordScore = 0;
  let recencyScore = 0;
  let citationScore = 0;
  let studyTypeScore = 0;
  let diseaseBoost = 0;

  const currentYear = new Date().getFullYear();
  const queryLower = query.toLowerCase();
  const titleLower = (pub.title || '').toLowerCase();
  const abstractLower = (pub.abstract || '').toLowerCase();

  // 1. Keyword Relevance
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
  for (const word of queryWords) {
    if (titleLower.includes(word)) keywordScore += 20;
    if (abstractLower.includes(word)) keywordScore += 5;
  }

  // 2. Disease Boost (explicit mentions in title/abstract)
  const conditions = (profile?.medicalHistory?.conditions || []).map(c => c.toLowerCase());
  for (const cond of conditions) {
    if (titleLower.includes(cond)) diseaseBoost += 30;
    if (abstractLower.includes(cond)) diseaseBoost += 15;
  }

  // 3. Recency Score
  if (pub.year) {
    const age = currentYear - pub.year;
    if (age <= 2) recencyScore = 100;
    else if (age <= 5) recencyScore = 70;
    else if (age <= 10) recencyScore = 30;
    else recencyScore = 0; // Penalize old papers
  }

  // 4. Citation Count Score (logarithmic)
  if (pub.citations > 0) {
    citationScore = Math.min(Math.log10(pub.citations) * 20, 100);
  }

  // 5. Study Type Score (Crucial for evidence quality)
  const combinedText = `${titleLower} ${abstractLower}`;
  if (combinedText.includes('meta-analysis')) studyTypeScore += 100;
  if (combinedText.includes('systematic review')) studyTypeScore += 90;
  if (combinedText.includes('randomized controlled trial') || combinedText.includes(' rct ')) studyTypeScore += 80;
  if (combinedText.includes('clinical trial')) studyTypeScore += 60;
  if (combinedText.includes('observational study') || combinedText.includes('cohort study')) studyTypeScore += 40;

  // Final Weighted Formula:
  // Relevance (40%) + Recency (20%) + Citations (20%) + Study Type (20%) + Disease Boost (Additive)
  const finalScore = 
    ((keywordScore / 100) * 40) + 
    ((recencyScore / 100) * 20) + 
    ((citationScore / 100) * 20) + 
    ((studyTypeScore / 100) * 20) + 
    diseaseBoost;

  return finalScore;
}


/**
 * Score a clinical trial based on relevance, recency, and status.
 */
function scoreTrial(trial, query, profile) {
  let score = 0;
  const queryLower = query.toLowerCase();
  const titleLower = (trial.title || '').toLowerCase();
  const summaryLower = (trial.summary || '').toLowerCase();

  // Relevance
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
  for (const word of queryWords) {
    if (titleLower.includes(word)) score += 15;
    if (summaryLower.includes(word)) score += 5;
  }

  // Condition match
  const trialConditions = (trial.conditions || []).map(c => c.toLowerCase());
  const userConditions = (profile?.medicalHistory?.conditions || []).map(c => c.toLowerCase());
  for (const uc of userConditions) {
    for (const tc of trialConditions) {
      if (tc.includes(uc) || uc.includes(tc)) score += 25;
    }
  }

  // Status: recruiting trials are most valuable
  const status = (trial.status || '').toUpperCase();
  if (status === 'RECRUITING') score += 20;
  else if (status === 'NOT_YET_RECRUITING') score += 15;
  else if (status === 'ACTIVE_NOT_RECRUITING') score += 8;
  else if (status === 'COMPLETED') score += 5;

  // Has contact info (actionable)
  if (trial.contacts?.length > 0 && trial.contacts[0].email) score += 10;

  // Has locations
  if (trial.locations?.length > 0) score += 5;

  return score;
}

module.exports = { aggregateResearch };
