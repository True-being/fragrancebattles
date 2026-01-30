/**
 * Scrapes trending fragrances from Fragrantica's "Pulse" page using Firecrawl
 * 
 * Usage: npx tsx scripts/scrapePulse.ts
 *        npx tsx scripts/scrapePulse.ts --limit=50
 * 
 * This script:
 * 1. Opens the Fragrantica Pulse page via Firecrawl
 * 2. Extracts all fragrance links from the page
 * 3. For each fragrance, checks if it already exists in Firestore
 * 4. If not, scrapes the fragrance page for full metadata and adds to DB
 * 
 * Options:
 *   --limit=N  Maximum number of new fragrances to add (default: no limit)
 * 
 * Requires FIRECRAWL_API_KEY in .env.local
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getAdminFirestore } from '../lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  parseFragranticaUrl,
  generateSlug,
  getFragranticaImageUrl,
  type FragranticaMetadata,
} from '../lib/fragrantica';
import {
  scrapePulsePageWithFirecrawl,
  scrapeFragranticaWithFirecrawl,
} from '../lib/firecrawlClient';
import { DEFAULT_ELO, type ArenaFlags } from '../types';

const db = getAdminFirestore();

// Parse CLI args
const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

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
    randomOrder: Math.random(),
    ...(metadata.year && { year: metadata.year }),
    ...(metadata.concentration && { concentration: metadata.concentration }),
    ...(metadata.perfumer && { perfumer: metadata.perfumer }),
    ...(metadata.description && { description: metadata.description }),
    ...(metadata.accords && metadata.accords.length > 0 && { accords: metadata.accords }),
    ...(metadata.notes && { notes: metadata.notes }),
    needsBackfill: !metadata.notes,
    createdAt: now,
    updatedAt: now,
  };
  
  await docRef.set(fragranceDoc);
  
  return docRef.id;
}

/**
 * Process a single fragrance
 */
async function processFragrance(
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
  
  // Scrape the fragrance page with Firecrawl
  try {
    const metadata = await scrapeFragranticaWithFirecrawl(frag.url);
    
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

async function main() {
  console.log('='.repeat(60));
  console.log('Fragrantica Pulse Scraper (Firecrawl)');
  console.log('='.repeat(60));
  
  // Step 1: Scrape the pulse page for fragrance links
  console.log('\nScraping Pulse page for fragrance links...');
  const links = await scrapePulsePageWithFirecrawl();
  
  console.log(`Found ${links.length} unique fragrance links`);
  
  // Parse each URL
  const allFragrances: ScrapedFragrance[] = [];
  for (const url of links) {
    const parsed = parseFragranticaUrl(url);
    if (parsed) {
      allFragrances.push({
        url,
        id: parsed.id,
        brand: parsed.brand,
        name: parsed.name,
      });
    }
  }
  
  console.log(`Parsed ${allFragrances.length} valid fragrance URLs`);
  
  if (allFragrances.length === 0) {
    console.log('\nNo fragrances found on pulse page. Exiting.');
    return;
  }
  
  // Step 2: Filter out existing fragrances
  console.log('\nChecking for existing fragrances...');
  const fragrancesToProcess: ScrapedFragrance[] = [];
  let preSkipped = 0;
  
  for (const frag of allFragrances) {
    const slug = generateSlug(frag.brand, frag.name);
    if (await fragranceExists(slug)) {
      preSkipped++;
    } else {
      fragrancesToProcess.push(frag);
      if (fragrancesToProcess.length >= LIMIT) {
        console.log(`  Reached limit of ${LIMIT} new fragrances`);
        break;
      }
    }
  }
  
  console.log(`  ${preSkipped} already exist, ${fragrancesToProcess.length} to process`);
  
  if (fragrancesToProcess.length === 0) {
    console.log('\nAll fragrances already exist. Nothing to do!');
    return;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Processing fragrances...');
  console.log('='.repeat(60) + '\n');
  
  // Step 3: Process each fragrance sequentially
  // Firecrawl handles rate limiting, but we add a small delay for safety
  let added = 0;
  let skipped = 0;
  let failed = 0;
  
  for (let i = 0; i < fragrancesToProcess.length; i++) {
    const result = await processFragrance(
      fragrancesToProcess[i],
      i,
      fragrancesToProcess.length
    );
    
    if (result === 'added') added++;
    else if (result === 'skipped') skipped++;
    else failed++;
    
    // Small delay between requests
    if (i < fragrancesToProcess.length - 1) {
      await sleep(1000);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`  Added:   ${added}`);
  console.log(`  Skipped: ${preSkipped + skipped} (already exist)`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Total:   ${allFragrances.length}`);
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
