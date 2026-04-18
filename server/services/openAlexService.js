const axios = require('axios');

const OPENALEX_BASE = 'https://api.openalex.org';

/**
 * Search OpenAlex for research publications.
 * Returns up to `limit` works matching the query.
 */
async function searchOpenAlex(query, limit = 80) {
  try {
    const res = await axios.get(`${OPENALEX_BASE}/works`, {
      params: {
        search: query,
        per_page: Math.min(limit, 100),
        sort: 'relevance_score:desc',
        filter: 'type:article|review',
        select: 'id,title,publication_year,authorships,primary_location,cited_by_count,abstract_inverted_index,doi'
      },
      timeout: 12000
    });

    return (res.data.results || []).map(work => {
      // Reconstruct abstract from inverted index
      let abstract = '';
      if (work.abstract_inverted_index) {
        const positions = [];
        for (const [word, indices] of Object.entries(work.abstract_inverted_index)) {
          for (const idx of indices) {
            positions.push({ idx, word });
          }
        }
        positions.sort((a, b) => a.idx - b.idx);
        abstract = positions.map(p => p.word).join(' ');
      }

      const authors = (work.authorships || [])
        .slice(0, 5)
        .map(a => a.author?.display_name)
        .filter(Boolean);

      const source = work.primary_location?.source?.display_name || 'Unknown Journal';
      const url = work.doi ? `https://doi.org/${work.doi.replace('https://doi.org/', '')}` : work.id;

      return {
        type: 'publication',
        title: work.title || 'Untitled',
        abstract: abstract.slice(0, 500) + (abstract.length > 500 ? '...' : ''),
        authors,
        year: work.publication_year,
        source,
        url,
        citations: work.cited_by_count || 0,
        provider: 'OpenAlex'
      };
    });
  } catch (err) {
    console.error('OpenAlex search error:', err.message);
    return [];
  }
}

module.exports = { searchOpenAlex };
