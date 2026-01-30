/**
 * Firecrawl client for scraping Fragrantica pages
 * 
 * Uses Firecrawl's managed scraping infrastructure to bypass
 * Cloudflare and rate limiting issues.
 */

import Firecrawl from '@mendable/firecrawl-js';
import * as cheerio from 'cheerio';
import type { FragranticaMetadata } from './fragrantica';

function getFirecrawlClient(): Firecrawl {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY environment variable is required. Add it to .env.local');
  }
  return new Firecrawl({ apiKey });
}

/**
 * Scrape a Fragrantica page and extract metadata using Firecrawl
 */
export async function scrapeFragranticaWithFirecrawl(
  url: string
): Promise<FragranticaMetadata> {
  const firecrawl = getFirecrawlClient();
  
  // SDK throws on error, returns Document directly on success
  // waitFor: 5000 is needed because Fragrantica loads notes via JavaScript
  // timeout: 60000 to avoid premature timeouts
  const result = await firecrawl.scrape(url, {
    formats: ['html'],
    waitFor: 5000,
    timeout: 60000,
  });

  if (!result.html) {
    throw new Error(`Failed to scrape ${url}: No HTML returned`);
  }

  // Check for 404 page
  if (is404Page(result.html)) {
    throw new Error(`Page not found (404): ${url} - URL may be incorrect`);
  }

  return parseFragranticaHtml(result.html);
}

/**
 * Scrape multiple Fragrantica pages in batch
 */
export async function batchScrapeFragrantica(
  urls: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, FragranticaMetadata>> {
  const firecrawl = getFirecrawlClient();
  const results = new Map<string, FragranticaMetadata>();
  
  // Firecrawl batch scrape - SDK throws on error
  const job = await firecrawl.batchScrape(urls, {
    options: {
      formats: ['html'],
    },
  });

  // Process results
  let completed = 0;
  for (const doc of job.data || []) {
    if (doc.html && doc.metadata?.sourceURL) {
      try {
        const metadata = parseFragranticaHtml(doc.html);
        results.set(doc.metadata.sourceURL, metadata);
      } catch (e) {
        console.error(`Failed to parse ${doc.metadata.sourceURL}:`, e);
      }
    }
    completed++;
    onProgress?.(completed, urls.length);
  }

  return results;
}

/**
 * Scrape the Fragrantica Pulse page and extract all fragrance URLs
 */
export async function scrapePulsePageWithFirecrawl(): Promise<string[]> {
  const firecrawl = getFirecrawlClient();
  
  // Pulse page requires scrolling to load all content, use actions
  // SDK throws on error, returns Document directly on success
  const result = await firecrawl.scrape('https://www.fragrantica.com/pulse/', {
    formats: ['html'],
    actions: [
      // Scroll to load lazy content
      { type: 'scroll', direction: 'down' },
      { type: 'wait', milliseconds: 2000 },
      { type: 'scroll', direction: 'down' },
      { type: 'wait', milliseconds: 2000 },
      { type: 'scroll', direction: 'down' },
      { type: 'wait', milliseconds: 2000 },
      { type: 'scroll', direction: 'down' },
      { type: 'wait', milliseconds: 2000 },
    ],
  });

  if (!result.html) {
    throw new Error('Failed to scrape Pulse page: No HTML returned');
  }

  const $ = cheerio.load(result.html);
  const urls: string[] = [];

  $('a[href*="/perfume/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.match(/\/perfume\/[^/]+\/[^/]+-\d+\.html$/)) {
      const fullUrl = href.startsWith('http')
        ? href
        : `https://www.fragrantica.com${href}`;
      if (!urls.includes(fullUrl)) {
        urls.push(fullUrl);
      }
    }
  });

  return urls;
}

/**
 * Check if the HTML is a 404/not found page
 */
function is404Page(html: string): boolean {
  const lowerHtml = html.toLowerCase();
  // Fragrantica 404 pages typically have these indicators
  return (
    lowerHtml.includes('page not found') ||
    lowerHtml.includes('404 not found') ||
    lowerHtml.includes('the page you requested') ||
    // Check if it's missing typical fragrance page elements
    (!lowerHtml.includes('/notes/') && !lowerHtml.includes('perfumer'))
  );
}

/**
 * Parse Fragrantica HTML to extract metadata using cheerio
 */
function parseFragranticaHtml(html: string): FragranticaMetadata {
  const $ = cheerio.load(html);
  const metadata: FragranticaMetadata = {};
  const bodyText = $('body').text() || '';

  // Extract year
  const yearMatch = bodyText.match(
    /(?:launched|introduced|released|created)\s+(?:in\s+)?(\d{4})/i
  );
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    if (year >= 1900 && year <= new Date().getFullYear() + 1) {
      metadata.year = year;
    }
  }

  // Fallback: year in parentheses near title
  if (!metadata.year) {
    const h1Text = $('h1').first().text() || '';
    const parenYear = h1Text.match(/\((\d{4})\)/);
    if (parenYear) {
      metadata.year = parseInt(parenYear[1], 10);
    }
  }

  // Extract concentration
  const concPatterns = [
    /\b(Eau de Parfum)\b/i,
    /\b(Eau de Toilette)\b/i,
    /\b(Parfum)\b/i,
    /\b(Extrait de Parfum)\b/i,
    /\b(Eau de Cologne)\b/i,
    /\b(Eau Fraiche)\b/i,
  ];

  const concMap: Record<string, string> = {
    'eau de parfum': 'EDP',
    'eau de toilette': 'EDT',
    'parfum': 'Parfum',
    'extrait de parfum': 'Extrait',
    'eau de cologne': 'EDC',
    'eau fraiche': 'Eau Fraiche',
  };

  for (const pattern of concPatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      metadata.concentration = concMap[match[1].toLowerCase()] || match[1];
      break;
    }
  }

  // Extract perfumer
  const perfumers: string[] = [];
  const skipNames = ['perfumers', 'perfumer', 'noses', 'more', 'all'];
  $('a[href*="/noses/"]').each((_, el) => {
    const name = $(el).text().trim();
    const nameLower = name.toLowerCase();
    if (
      name.length > 2 &&
      name.length < 50 &&
      !skipNames.some(skip => nameLower === skip || nameLower.includes(skip)) &&
      !perfumers.includes(name)
    ) {
      perfumers.push(name);
    }
  });
  if (perfumers.length > 0) {
    metadata.perfumer = perfumers.slice(0, 2).join(', ');
  }

  // Extract description
  const descSelectors = [
    '[itemprop="description"]',
    '.fragrantica-blockquote',
    'blockquote',
    '.reviewstrigger',
  ];

  for (const selector of descSelectors) {
    const el = $(selector).first();
    if (el.length) {
      let text = el.text().trim().replace(/\s+/g, ' ');
      if (text.length > 20) {
        if (text.length > 150) {
          text = text.substring(0, 147) + '...';
        }
        metadata.description = text;
        break;
      }
    }
  }

  // Extract gender
  const mainText = bodyText.substring(0, 500).toLowerCase();
  if (/for (men and women|women and men)/i.test(mainText) || /\bunisex\b/i.test(mainText)) {
    metadata.gender = 'unisex';
  } else if (/fragrance for women/i.test(mainText) || /\bfor women\b/i.test(mainText)) {
    metadata.gender = 'feminine';
  } else if (/fragrance for men/i.test(mainText) || /\bfor men\b/i.test(mainText)) {
    metadata.gender = 'masculine';
  }

  // Extract accords
  const accords: string[] = [];
  
  // Find "main accords" section
  $('h4, h5, h6, .font-semibold').each((_, heading) => {
    const text = $(heading).text().trim().toLowerCase();
    if (text === 'main accords' || text === 'main accord') {
      const container = $(heading).parent();
      container.find('div.rounded-br-lg, div[class*="rounded"]').each((_, div) => {
        const accordText = $(div).text().trim().toLowerCase();
        if (
          accordText.length > 2 &&
          accordText.length < 30 &&
          !accordText.includes('main accord') &&
          !accords.includes(accordText)
        ) {
          accords.push(accordText);
        }
      });
    }
  });

  // Fallback: try old selector
  if (accords.length === 0) {
    $('[class*="accord"]').each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (
        text.length > 2 &&
        text.length < 30 &&
        !text.includes('(') &&
        !text.includes('%') &&
        !accords.includes(text)
      ) {
        accords.push(text);
      }
    });
  }

  if (accords.length > 0) {
    metadata.accords = accords.slice(0, 8);
  }

  // Extract notes pyramid
  const notes: { top?: string[]; middle?: string[]; base?: string[]; all?: string[] } = {};
  const uncategorizedNotes: string[] = [];

  $('a[href*="/notes/"]').each((_, link) => {
    const name = $(link).text().trim();
    if (name.length < 2 || name.length > 40 || name.toLowerCase() === 'notes') {
      return;
    }

    // Check ancestors for category text
    let categorized = false;
    $(link).parents().slice(0, 5).each((_, parent) => {
      const text = $(parent).text().toLowerCase().substring(0, 20);

      if (text.startsWith('top note')) {
        if (!notes.top) notes.top = [];
        if (!notes.top.includes(name) && notes.top.length < 6) {
          notes.top.push(name);
        }
        categorized = true;
        return false; // break
      }
      if (text.startsWith('middle note') || text.startsWith('heart note')) {
        if (!notes.middle) notes.middle = [];
        if (!notes.middle.includes(name) && notes.middle.length < 6) {
          notes.middle.push(name);
        }
        categorized = true;
        return false;
      }
      if (text.startsWith('base note')) {
        if (!notes.base) notes.base = [];
        if (!notes.base.includes(name) && notes.base.length < 6) {
          notes.base.push(name);
        }
        categorized = true;
        return false;
      }
    });

    if (!categorized && !uncategorizedNotes.includes(name) && uncategorizedNotes.length < 12) {
      uncategorizedNotes.push(name);
    }
  });

  if (notes.top || notes.middle || notes.base) {
    metadata.notes = notes;
  } else if (uncategorizedNotes.length > 0) {
    metadata.notes = { all: uncategorizedNotes };
  }

  return metadata;
}

export { getFirecrawlClient };
