const { searchOpenAlex } = require('./openAlexService');
const { searchPubMed } = require('./pubmedService');
const { searchClinicalTrials } = require('./clinicalTrialsService');
const ResearchCache = require('../models/ResearchCache');

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

  console.log(`[Research] Cache MISS — performing deep retrieval for: "${enrichedQuery.slice(0, 80)}..."`);

  // ─── Step 1: Deep Retrieval — parallel fetch from all 3 sources ───
  const [openAlexResults, pubmedResults, trialResults] = await Promise.allSettled([
    searchOpenAlex(enrichedQuery, 100),
    searchPubMed(enrichedQuery, 80),
    searchClinicalTrials(enrichedQuery, 50)
  ]);

  const publications = [
    ...(openAlexResults.status === 'fulfilled' ? openAlexResults.value : []),
    ...(pubmedResults.status === 'fulfilled' ? pubmedResults.value : [])
  ];

  const trials = trialResults.status === 'fulfilled' ? trialResults.value : [];

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

  // ─── Step 5: Select top results ───
  const topPubs = scoredPubs.slice(0, 6).map(({ _score, ...rest }) => rest);
  const topTrials = scoredTrials.slice(0, 3).map(({ _score, ...rest }) => rest);

  const meta = {
    totalRetrieved: publications.length + trials.length,
    totalAfterDedup: dedupedPubs.length + trials.length,
    finalSelected: topPubs.length + topTrials.length,
    query: enrichedQuery
  };

  console.log(`[Research] Final selection: ${topPubs.length} publications, ${topTrials.length} trials`);

  // ─── Step 6: Store in cache (non-blocking) ───
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
 * Score a publication based on relevance, recency, and credibility.
 */
function scorePublication(pub, query, profile) {
  let score = 0;
  const currentYear = new Date().getFullYear();
  const queryLower = query.toLowerCase();
  const titleLower = (pub.title || '').toLowerCase();
  const abstractLower = (pub.abstract || '').toLowerCase();

  // Relevance: title match (high weight)
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
  for (const word of queryWords) {
    if (titleLower.includes(word)) score += 15;
    if (abstractLower.includes(word)) score += 5;
  }

  // Profile condition match (strong signal)
  const conditions = (profile?.medicalHistory?.conditions || []).map(c => c.toLowerCase());
  for (const cond of conditions) {
    if (titleLower.includes(cond)) score += 20;
    if (abstractLower.includes(cond)) score += 10;
  }

  // Symptom match
  const symptoms = (profile?.currentSymptoms || []).map(s => s.toLowerCase());
  for (const sym of symptoms) {
    if (titleLower.includes(sym)) score += 12;
    if (abstractLower.includes(sym)) score += 6;
  }

  // Recency: papers from recent years get a boost
  if (pub.year) {
    const age = currentYear - pub.year;
    if (age <= 2) score += 20;
    else if (age <= 5) score += 12;
    else if (age <= 10) score += 5;
  }

  // Credibility: citation count (logarithmic scale)
  if (pub.citations > 0) {
    score += Math.min(Math.log10(pub.citations) * 8, 25);
  }

  // Abstract presence bonus
  if (pub.abstract && pub.abstract.length > 100) score += 8;

  // Source quality bonus (known high-impact journals)
  const highImpactJournals = ['lancet', 'nejm', 'bmj', 'jama', 'nature', 'science', 'cell', 'plos'];
  if (highImpactJournals.some(j => (pub.source || '').toLowerCase().includes(j))) {
    score += 15;
  }

  return score;
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
