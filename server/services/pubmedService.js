const axios = require('axios');

const EUTILS_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

/**
 * Search PubMed for research publications.
 * Two-step: esearch for IDs, then efetch for details.
 */
async function searchPubMed(query, limit = 80) {
  try {
    // Step 1: Search for PMIDs
    const searchRes = await axios.get(`${EUTILS_BASE}/esearch.fcgi`, {
      params: {
        db: 'pubmed',
        term: query,
        retmax: Math.min(limit, 100),
        sort: 'relevance',
        retmode: 'json'
      },
      timeout: 12000
    });

    const ids = searchRes.data?.esearchresult?.idlist || [];
    if (ids.length === 0) return [];

    // Step 2: Fetch article details
    const fetchRes = await axios.get(`${EUTILS_BASE}/efetch.fcgi`, {
      params: {
        db: 'pubmed',
        id: ids.join(','),
        retmode: 'xml',
        rettype: 'abstract'
      },
      timeout: 15000
    });

    // Parse XML response (lightweight regex-based extraction)
    const articles = parseArticlesFromXml(fetchRes.data);
    return articles;
  } catch (err) {
    console.error('PubMed search error:', err.message);
    return [];
  }
}

/**
 * Lightweight XML parser for PubMed efetch results.
 * Extracts title, abstract, authors, journal, year, and PMID.
 */
function parseArticlesFromXml(xml) {
  const articles = [];
  const articleBlocks = xml.split('<PubmedArticle>').slice(1);

  for (const block of articleBlocks) {
    try {
      const title = extractTag(block, 'ArticleTitle') || 'Untitled';
      const abstract = extractTag(block, 'AbstractText') || '';
      const journal = extractTag(block, 'Title') || 'Unknown Journal';
      const year = extractTag(block, 'Year') || '';
      const pmid = extractTag(block, 'PMID') || '';

      // Extract authors
      const authors = [];
      const authorMatches = block.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
      for (const authorBlock of authorMatches.slice(0, 5)) {
        const lastName = extractTag(authorBlock, 'LastName');
        const firstName = extractTag(authorBlock, 'ForeName');
        if (lastName) {
          authors.push(firstName ? `${firstName} ${lastName}` : lastName);
        }
      }

      articles.push({
        type: 'publication',
        title,
        abstract: abstract.slice(0, 500) + (abstract.length > 500 ? '...' : ''),
        authors,
        year: parseInt(year) || null,
        source: journal,
        url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : '',
        citations: 0, // PubMed doesn't provide citation counts in efetch
        provider: 'PubMed'
      });
    } catch (e) {
      // Skip malformed entries
    }
  }

  return articles;
}

function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].replace(/<[^>]*>/g, '').trim() : null;
}

module.exports = { searchPubMed };
