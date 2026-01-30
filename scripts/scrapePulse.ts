/**
 * Scrapes trending fragrances from Fragrantica's "Pulse" page
 * 
 * Usage: npx tsx scripts/scrapePulse.ts
 *        npx tsx scripts/scrapePulse.ts --concurrency=5
 * 
 * This script:
 * 1. Opens the Fragrantica Pulse page (https://www.fragrantica.com/pulse/)
 * 2. Extracts all fragrance links from the page
 * 3. For each fragrance, checks if it already exists in Firestore
 * 4. If not, scrapes the fragrance page for full metadata and adds to DB
 * 
 * Options:
 *   --concurrency=N  Number of concurrent pages (default: 3, max recommended: 5)
 * 
 * Must run locally - Cloudflare blocks cloud-based browsers.
 */

import { getAdminFirestore } from '../lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  parseFragranticaUrl,
  generateSlug,
  getFragranticaImageUrl,
  type FragranticaMetadata,
} from '../lib/fragrantica';
import { DEFAULT_ELO, type ArenaFlags } from '../types';
import type { Browser, Page } from 'puppeteer';

const db = getAdminFirestore();

const PULSE_URL = 'https://www.fragrantica.com/pulse/';

// Parse CLI args
const args = process.argv.slice(2);
const concurrencyArg = args.find(a => a.startsWith('--concurrency='));
const CONCURRENCY = concurrencyArg 
  ? Math.min(Math.max(parseInt(concurrencyArg.split('=')[1], 10) || 3, 1), 10)
  : 3;

interface ScrapedFragrance {
  url: string;
  id: number;
  brand: string;
  name: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Launch a Puppeteer browser with anti-detection settings
 */
async function launchBrowser(): Promise<Browser> {
  const puppeteer = await import('puppeteer');
  
  console.log('Launching browser...');
  
  // Use headless mode (new headless is now the default in Puppeteer)
  return puppeteer.default.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--disable-blink-features=AutomationControlled',
    ],
  });
}

/**
 * Set up a page with realistic browser fingerprint
 */
async function setupPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  
  // Remove webdriver detection
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    // @ts-ignore
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });
  
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  
  await page.setViewport({ width: 1920, height: 1080 });
  
  return page;
}

/**
 * Scroll to bottom of page to load all lazy-loaded content
 */
async function scrollToLoadAll(page: Page, maxScrolls = 50): Promise<void> {
  let previousHeight = 0;
  let scrollCount = 0;
  let noChangeCount = 0;
  
  while (scrollCount < maxScrolls && noChangeCount < 3) {
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    
    if (currentHeight === previousHeight) {
      noChangeCount++;
    } else {
      noChangeCount = 0;
    }
    
    previousHeight = currentHeight;
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Wait for new content to load
    await sleep(1000);
    scrollCount++;
    
    // Log progress every 10 scrolls
    if (scrollCount % 10 === 0) {
      const linkCount = await page.evaluate(() => 
        document.querySelectorAll('a[href*="/perfume/"]').length
      );
      console.log(`  Scrolled ${scrollCount}x, found ${linkCount} links so far...`);
    }
  }
}

/**
 * Scrape the pulse page for all fragrance links
 */
async function scrapePulsePage(page: Page): Promise<ScrapedFragrance[]> {
  console.log(`\nNavigating to ${PULSE_URL}...`);
  
  await page.goto(PULSE_URL, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });
  
  // Wait for fragrance links to load
  await page.waitForSelector('a[href*="/perfume/"]', { timeout: 15000 }).catch(() => {
    console.log('Warning: Fragrance links selector timeout, continuing anyway...');
  });
  
  console.log('Page loaded, scrolling to load all content...');
  
  // Scroll to load all lazy-loaded content
  await scrollToLoadAll(page);
  
  console.log('Extracting fragrance links...');
  
  // Extract all fragrance URLs from the page
  const links = await page.evaluate(() => {
    const anchors = document.querySelectorAll('a[href*="/perfume/"]');
    const urls: string[] = [];
    
    anchors.forEach(anchor => {
      const href = anchor.getAttribute('href');
      if (href && href.match(/\/perfume\/[^/]+\/[^/]+-\d+\.html$/)) {
        // Make absolute URL if needed
        const fullUrl = href.startsWith('http') 
          ? href 
          : `https://www.fragrantica.com${href}`;
        
        if (!urls.includes(fullUrl)) {
          urls.push(fullUrl);
        }
      }
    });
    
    return urls;
  });
  
  console.log(`Found ${links.length} unique fragrance links`);
  
  // Parse each URL
  const fragrances: ScrapedFragrance[] = [];
  
  for (const url of links) {
    const parsed = parseFragranticaUrl(url);
    if (parsed) {
      fragrances.push({
        url,
        id: parsed.id,
        brand: parsed.brand,
        name: parsed.name,
      });
    }
  }
  
  console.log(`Parsed ${fragrances.length} valid fragrance URLs`);
  
  return fragrances;
}

/**
 * Wait for Cloudflare challenge to resolve
 */
async function waitForCloudflare(page: Page, timeout = 30000): Promise<boolean> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const title = await page.title();
    const isChallenge = title.toLowerCase().includes('just a moment') || 
                        title.toLowerCase().includes('checking');
    
    if (!isChallenge) {
      return true; // Passed the challenge
    }
    
    await sleep(2000);
  }
  
  return false; // Timeout
}

/**
 * Scrape full metadata from a fragrance page
 */
async function scrapeFragrancePage(page: Page, url: string): Promise<FragranticaMetadata> {
  const response = await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });
  
  // Check for Cloudflare challenge
  const pageTitle = await page.title();
  if (pageTitle.toLowerCase().includes('just a moment') || response?.status() === 403) {
    const passed = await waitForCloudflare(page, 30000);
    if (!passed) {
      throw new Error('Cloudflare challenge timeout');
    }
  }
  
  // Wait for notes to load
  await page.waitForSelector('a[href*="/notes/"]', { timeout: 10000 }).catch(() => {
    // Notes may not exist for all fragrances
  });
  
  const metadata = await page.evaluate(() => {
    const result: {
      year?: number;
      concentration?: string;
      perfumer?: string;
      description?: string;
      accords?: string[];
      notes?: {
        top?: string[];
        middle?: string[];
        base?: string[];
        all?: string[];
      };
      gender?: 'masculine' | 'feminine' | 'unisex';
    } = {};

    const bodyText = document.body.innerText || '';

    // Extract year
    const yearMatch = bodyText.match(
      /(?:launched|introduced|released|created)\s+(?:in\s+)?(\d{4})/i
    );
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      if (year >= 1900 && year <= new Date().getFullYear() + 1) {
        result.year = year;
      }
    }

    // Fallback: year in parentheses near title
    if (!result.year) {
      const h1 = document.querySelector('h1');
      if (h1) {
        const h1Text = h1.textContent || '';
        const parenYear = h1Text.match(/\((\d{4})\)/);
        if (parenYear) {
          result.year = parseInt(parenYear[1], 10);
        }
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
        result.concentration = concMap[match[1].toLowerCase()] || match[1];
        break;
      }
    }

    // Extract perfumer
    const noseLinks = document.querySelectorAll('a[href*="/noses/"]');
    const perfumers: string[] = [];
    const skipNames = ['perfumers', 'perfumer', 'noses', 'more', 'all'];
    noseLinks.forEach(link => {
      const name = (link.textContent || '').trim();
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
      result.perfumer = perfumers.slice(0, 2).join(', ');
    }

    // Extract description
    const descSelectors = [
      '[itemprop="description"]',
      '.fragrantica-blockquote',
      'blockquote',
      '.reviewstrigger',
    ];

    for (const selector of descSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        let text = (el.textContent || '').trim().replace(/\s+/g, ' ');
        if (text.length > 20) {
          if (text.length > 150) {
            text = text.substring(0, 147) + '...';
          }
          result.description = text;
          break;
        }
      }
    }

    // Extract gender
    const mainText = bodyText.substring(0, 500).toLowerCase();
    if (/for (men and women|women and men)/i.test(mainText) || /\bunisex\b/i.test(mainText)) {
      result.gender = 'unisex';
    } else if (/fragrance for women/i.test(mainText) || /\bfor women\b/i.test(mainText)) {
      result.gender = 'feminine';
    } else if (/fragrance for men/i.test(mainText) || /\bfor men\b/i.test(mainText)) {
      result.gender = 'masculine';
    }

    // Extract accords - find "main accords" heading and extract from child divs
    const accords: string[] = [];
    
    // Find the "main accords" heading (usually h6 or similar)
    const headings = document.querySelectorAll('h4, h5, h6, .font-semibold');
    let accordContainer: Element | null = null;
    
    headings.forEach(h => {
      const text = (h.textContent || '').trim().toLowerCase();
      if (text === 'main accords' || text === 'main accord') {
        accordContainer = h.parentElement;
      }
    });
    
    if (accordContainer) {
      // Find accord names in child divs with the rounded styling
      const accordDivs = (accordContainer as Element).querySelectorAll('div.rounded-br-lg, div[class*="rounded"]');
      accordDivs.forEach(div => {
        const text = (div.textContent || '').trim().toLowerCase();
        if (
          text.length > 2 &&
          text.length < 30 &&
          !text.includes('main accord') &&
          !accords.includes(text)
        ) {
          accords.push(text);
        }
      });
    }
    
    // Fallback: try old selector
    if (accords.length === 0) {
      const accordElements = document.querySelectorAll('[class*="accord"]');
      accordElements.forEach(el => {
        const text = (el.textContent || '').trim().toLowerCase();
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
      result.accords = accords.slice(0, 8);
    }

    // Extract notes pyramid
    const notes: { top?: string[]; middle?: string[]; base?: string[]; all?: string[] } = {};
    const uncategorizedNotes: string[] = [];
    
    const allNoteLinks = document.querySelectorAll('a[href*="/notes/"]');
    
    allNoteLinks.forEach(link => {
      const name = (link.textContent || '').trim();
      if (name.length < 2 || name.length > 40 || name.toLowerCase() === 'notes') {
        return;
      }
      
      let el: Element | null = link;
      for (let depth = 0; depth < 5 && el; depth++) {
        el = el.parentElement;
        if (!el) break;
        
        const text = (el.textContent || '').toLowerCase().substring(0, 20);
        
        if (text.startsWith('top note')) {
          if (!notes.top) notes.top = [];
          if (!notes.top.includes(name) && notes.top.length < 6) {
            notes.top.push(name);
          }
          return;
        }
        if (text.startsWith('middle note') || text.startsWith('heart note')) {
          if (!notes.middle) notes.middle = [];
          if (!notes.middle.includes(name) && notes.middle.length < 6) {
            notes.middle.push(name);
          }
          return;
        }
        if (text.startsWith('base note')) {
          if (!notes.base) notes.base = [];
          if (!notes.base.includes(name) && notes.base.length < 6) {
            notes.base.push(name);
          }
          return;
        }
      }
      
      if (!uncategorizedNotes.includes(name) && uncategorizedNotes.length < 12) {
        uncategorizedNotes.push(name);
      }
    });
    
    if (notes.top || notes.middle || notes.base) {
      result.notes = notes;
    } else if (uncategorizedNotes.length > 0) {
      result.notes = { all: uncategorizedNotes };
    }

    return result;
  });
  
  return metadata;
}

/**
 * Check if a fragrance already exists in Firestore by slug
 */
async function fragranceExists(slug: string): Promise<boolean> {
  const snapshot = await db.collection('fragrances')
    .where('slug', '==', slug)
    .limit(1)
    .get();
  
  return !snapshot.empty;
}

/**
 * Add a fragrance to Firestore
 */
async function addFragrance(
  fragrance: ScrapedFragrance,
  metadata: FragranticaMetadata
): Promise<string> {
  const slug = generateSlug(fragrance.brand, fragrance.name);
  
  // Build arenas based on gender
  const arenas: ArenaFlags = {
    overall: true,
    masculine: metadata.gender === 'masculine' || metadata.gender === 'unisex',
    feminine: metadata.gender === 'feminine' || metadata.gender === 'unisex',
    unisex: metadata.gender === 'unisex',
  };
  
  // If no gender detected, default to overall only
  if (!metadata.gender) {
    arenas.masculine = false;
    arenas.feminine = false;
    arenas.unisex = false;
  }
  
  const now = Timestamp.now();
  const docRef = db.collection('fragrances').doc();
  
  const fragranceDoc = {
    name: fragrance.name,
    brand: fragrance.brand,
    slug,
    imageUrl: getFragranticaImageUrl(fragrance.id),
    arenas,
    elo: {
      overall: DEFAULT_ELO,
      masculine: DEFAULT_ELO,
      feminine: DEFAULT_ELO,
      unisex: DEFAULT_ELO,
    },
    stats: {
      battles: {
        overall: 0,
        masculine: 0,
        feminine: 0,
        unisex: 0,
      },
      wins: {
        overall: 0,
        masculine: 0,
        feminine: 0,
        unisex: 0,
      },
    },
    fragranticaId: fragrance.id,
    // Random order for efficient random sampling in matchmaking
    randomOrder: Math.random(),
    ...(metadata.year && { year: metadata.year }),
    ...(metadata.concentration && { concentration: metadata.concentration }),
    ...(metadata.perfumer && { perfumer: metadata.perfumer }),
    ...(metadata.description && { description: metadata.description }),
    ...(metadata.accords && metadata.accords.length > 0 && { accords: metadata.accords }),
    ...(metadata.notes && { notes: metadata.notes }),
    needsBackfill: !metadata.notes, // Flag if notes weren't scraped
    createdAt: now,
    updatedAt: now,
  };
  
  await docRef.set(fragranceDoc);
  
  return docRef.id;
}

/**
 * Process a single fragrance with a given page
 */
async function processFragrance(
  page: Page,
  frag: ScrapedFragrance,
  index: number,
  total: number
): Promise<'added' | 'skipped' | 'failed'> {
  const slug = generateSlug(frag.brand, frag.name);
  const prefix = `[${index + 1}/${total}]`;
  
  console.log(`${prefix} ${frag.brand} - ${frag.name}`);
  
  // Check if already exists
  const exists = await fragranceExists(slug);
  if (exists) {
    console.log(`${prefix}   ⏭️  Already exists`);
    return 'skipped';
  }
  
  // Scrape the fragrance page
  try {
    const metadata = await scrapeFragrancePage(page, frag.url);
    
    // Add to Firestore
    const docId = await addFragrance(frag, metadata);
    
    const noteCount = metadata.notes 
      ? (metadata.notes.top?.length || 0) + 
        (metadata.notes.middle?.length || 0) + 
        (metadata.notes.base?.length || 0) +
        (metadata.notes.all?.length || 0)
      : 0;
    
    console.log(`${prefix}   ✅ Added (${noteCount} notes, year: ${metadata.year || '?'})`);
    return 'added';
  } catch (error) {
    console.log(`${prefix}   ❌ Failed: ${error}`);
    return 'failed';
  }
}

/**
 * Simple concurrency limiter
 */
async function processConcurrently<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let currentIndex = 0;
  
  async function worker(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];
      const result = await processor(item, index);
      results[index] = result;
      
      // Random delay between requests to appear more human-like (2-4 seconds)
      await sleep(2000 + Math.random() * 2000);
    }
  }
  
  // Launch workers
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  
  return results;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Fragrantica Pulse Scraper');
  console.log(`Concurrency: ${CONCURRENCY} pages`);
  console.log('='.repeat(60));
  
  let browser: Browser | null = null;
  
  try {
    browser = await launchBrowser();
    
    // Create initial page for pulse scraping
    const mainPage = await setupPage(browser);
    
    // Step 1: Scrape the pulse page for fragrance links
    const allFragrances = await scrapePulsePage(mainPage);
    
    if (allFragrances.length === 0) {
      console.log('\nNo fragrances found on pulse page. Exiting.');
      return;
    }
    
    // Step 2: Filter out existing fragrances first (bulk check is faster)
    console.log('\nChecking for existing fragrances...');
    const fragrancesToProcess: ScrapedFragrance[] = [];
    let preSkipped = 0;
    
    for (const frag of allFragrances) {
      const slug = generateSlug(frag.brand, frag.name);
      if (await fragranceExists(slug)) {
        preSkipped++;
      } else {
        fragrancesToProcess.push(frag);
      }
    }
    
    console.log(`  ${preSkipped} already exist, ${fragrancesToProcess.length} to process`);
    
    if (fragrancesToProcess.length === 0) {
      console.log('\nAll fragrances already exist. Nothing to do!');
      return;
    }
    
    // Step 3: Create page pool
    console.log(`\nCreating ${CONCURRENCY} browser pages...`);
    const pages: Page[] = [mainPage];
    for (let i = 1; i < CONCURRENCY; i++) {
      pages.push(await setupPage(browser));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Processing fragrances...');
    console.log('='.repeat(60) + '\n');
    
    // Step 4: Process concurrently using page pool
    let pageIndex = 0;
    const total = fragrancesToProcess.length;
    
    const results = await processConcurrently(
      fragrancesToProcess,
      CONCURRENCY,
      async (frag, index) => {
        // Round-robin page assignment
        const page = pages[pageIndex % pages.length];
        pageIndex++;
        return processFragrance(page, frag, index, total);
      }
    );
    
    // Tally results
    const added = results.filter(r => r === 'added').length;
    const failed = results.filter(r => r === 'failed').length;
    
    console.log('\n' + '='.repeat(60));
    console.log('Summary');
    console.log('='.repeat(60));
    console.log(`  Added:   ${added}`);
    console.log(`  Skipped: ${preSkipped} (already exist)`);
    console.log(`  Failed:  ${failed}`);
    console.log(`  Total:   ${allFragrances.length}`);
    
  } finally {
    if (browser) {
      await browser.close();
      console.log('\nBrowser closed');
    }
  }
}

main()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
