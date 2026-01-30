/**
 * Backfills fragrance metadata (notes, year, perfumer, etc.) using Firecrawl
 * 
 * Usage: npx tsx scripts/backfillMetadata.ts
 *        npx tsx scripts/backfillMetadata.ts --limit=100
 *        npx tsx scripts/backfillMetadata.ts --concurrency=10
 * 
 * This script:
 * 1. Finds all fragrances in Firestore that need backfill (needsBackfill=true)
 * 2. Scrapes metadata from Fragrantica using Firecrawl (parallel)
 * 3. Updates the documents in Firestore
 * 
 * Options:
 *   --limit=N        Maximum number of fragrances to process (default: 50)
 *   --concurrency=N  Number of parallel requests (default: 20, max: 50)
 * 
 * Requires FIRECRAWL_API_KEY in .env.local
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getAdminFirestore } from '../lib/firebase/admin';
import { scrapeFragranticaWithFirecrawl } from '../lib/firecrawlClient';

const db = getAdminFirestore();

// Parse CLI args
const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const concurrencyArg = args.find(a => a.startsWith('--concurrency='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 50;
const CONCURRENCY = Math.min(
  concurrencyArg ? parseInt(concurrencyArg.split('=')[1], 10) : 5,
  20 // Cap at 20 to avoid timeouts
);

interface FragranceToUpdate {
  id: string;
  name: string;
  brand: string;
  fragranticaId: number;
  sourceUrl?: string;
}

interface ProcessResult {
  status: 'updated' | 'no_notes' | 'not_found' | 'error';
  noteCount?: number;
  error?: string;
}

// Counters for progress
let completed = 0;
let updated = 0;
let failed = 0;
let notFound = 0;

const MAX_RETRIES = 2;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeWithRetry(url: string, retries = 0): Promise<Awaited<ReturnType<typeof scrapeFragranticaWithFirecrawl>>> {
  try {
    return await scrapeFragranticaWithFirecrawl(url);
  } catch (error) {
    const errorMsg = String(error);
    // Retry on timeout errors
    if (errorMsg.includes('timed out') && retries < MAX_RETRIES) {
      await sleep(2000 * (retries + 1)); // Exponential backoff
      return scrapeWithRetry(url, retries + 1);
    }
    throw error;
  }
}

async function processFragrance(
  frag: FragranceToUpdate,
  total: number
): Promise<ProcessResult> {
  const fragrancesRef = db.collection('fragrances');
  
  // Use stored sourceUrl if available, otherwise construct from parts
  let url: string;
  if (frag.sourceUrl) {
    url = frag.sourceUrl;
  } else {
    const brandSlug = frag.brand.replace(/\s+/g, '-').replace(/'/g, '');
    const nameSlug = frag.name.replace(/\s+/g, '-').replace(/'/g, '');
    url = `https://www.fragrantica.com/perfume/${brandSlug}/${nameSlug}-${frag.fragranticaId}.html`;
  }
  
  try {
    const metadata = await scrapeWithRetry(url);
    
    if (metadata.notes) {
      // Update Firestore
      const updateData: Record<string, unknown> = {};
      
      if (metadata.notes) updateData.notes = metadata.notes;
      if (metadata.year) updateData.year = metadata.year;
      if (metadata.concentration) updateData.concentration = metadata.concentration;
      if (metadata.perfumer) updateData.perfumer = metadata.perfumer;
      if (metadata.description) updateData.description = metadata.description;
      if (metadata.gender) updateData.gender = metadata.gender;
      if (metadata.accords) updateData.accords = metadata.accords;
      
      // Clear the backfill flag
      updateData.needsBackfill = false;
      
      await fragrancesRef.doc(frag.id).update(updateData);
      
      const noteCount = 
        (metadata.notes.top?.length || 0) + 
        (metadata.notes.middle?.length || 0) + 
        (metadata.notes.base?.length || 0) +
        (metadata.notes.all?.length || 0);
      
      updated++;
      completed++;
      console.log(`[${completed}/${total}] ✅ ${frag.brand} - ${frag.name} (${noteCount} notes)`);
      
      return { status: 'updated', noteCount };
    } else {
      failed++;
      completed++;
      console.log(`[${completed}/${total}] ⚠️  ${frag.brand} - ${frag.name} (no notes found)`);
      return { status: 'no_notes' };
    }
  } catch (error) {
    const errorMsg = String(error);
    completed++;
    
    if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      notFound++;
      console.log(`[${completed}/${total}] ❌ ${frag.brand} - ${frag.name} (URL not found)`);
      return { status: 'not_found' };
    } else {
      failed++;
      console.log(`[${completed}/${total}] ❌ ${frag.brand} - ${frag.name} (${errorMsg.slice(0, 50)})`);
      return { status: 'error', error: errorMsg };
    }
  }
}

/**
 * Process items with limited concurrency
 */
async function processWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  
  async function worker(): Promise<void> {
    while (index < items.length) {
      const currentIndex = index++;
      const item = items[currentIndex];
      results[currentIndex] = await processor(item);
    }
  }
  
  // Start workers
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  
  await Promise.all(workers);
  return results;
}

async function backfillMetadata() {
  console.log('='.repeat(60));
  console.log('Fragrance Metadata Backfill (Firecrawl)');
  console.log('='.repeat(60));
  console.log(`\nSettings: limit=${LIMIT}, concurrency=${CONCURRENCY}`);
  console.log(`\nFetching fragrances needing backfill...\n`);
  
  const fragrancesRef = db.collection('fragrances');
  
  // Query only fragrances that need backfill
  const snapshot = await fragrancesRef
    .where('needsBackfill', '==', true)
    .limit(LIMIT)
    .get();
  
  const fragrancesToUpdate: FragranceToUpdate[] = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.fragranticaId) {
      fragrancesToUpdate.push({
        id: doc.id,
        name: data.name,
        brand: data.brand,
        fragranticaId: data.fragranticaId,
        sourceUrl: data.sourceUrl,
      });
    }
  });
  
  console.log(`Found ${fragrancesToUpdate.length} fragrances needing backfill\n`);
  
  if (fragrancesToUpdate.length === 0) {
    console.log('All fragrances have notes. Nothing to do!');
    return;
  }
  
  const total = fragrancesToUpdate.length;
  const startTime = Date.now();
  
  // Process with concurrency
  await processWithConcurrency(
    fragrancesToUpdate,
    CONCURRENCY,
    (frag) => processFragrance(frag, total)
  );
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`  Updated:   ${updated}`);
  console.log(`  Not Found: ${notFound}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Total:     ${fragrancesToUpdate.length}`);
  console.log(`  Time:      ${elapsed}s`);
  
  if (notFound > 0) {
    console.log(`\nNote: ${notFound} fragrances couldn't be found. Run fixSourceUrls.ts first.`);
  }
}

backfillMetadata()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
