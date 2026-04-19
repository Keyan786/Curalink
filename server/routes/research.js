const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { aggregateResearch } = require('../services/researchAggregator');
const router = express.Router();

/**
 * GET /api/research?q=<query>
 * Perform a standalone evidence-based research search.
 * No longer depends on a health profile — queries are purely user-driven.
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Query parameter "q" is required.' });
    }

    console.log(`[Research] Standalone query: "${query}" | User: ${req.userId}`);
    const results = await aggregateResearch(query, null);

    res.json(results);
  } catch (err) {
    console.error('[Research] Route error:', err.message);
    res.status(500).json({ message: 'Failed to fetch research data.' });
  }
});

module.exports = router;
