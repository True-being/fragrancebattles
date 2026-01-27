/**
 * Backfills fragrance metadata (notes, year, perfumer, etc.) by scraping Fragrantica
 * 
 * Usage: npx tsx scripts/backfillMetadata.ts
 * 
 * This script:
 * 1. Finds all fragrances in Firestore that are missing notes
 * 2. Scrapes metadata from Fragrantica using their fragranticaId
 * 3. Updates the documents in Firestore
 * 
 * Run this locally after adding fragrances via the website.
 * Cloudflare blocks cloud-based browsers, so this must run on your machine.
 */

import { getAdminFirestore } from '../lib/firebase/admin';
import { scrapeFragranticaMetadata } from '../lib/fragrantica';

const db = getAdminFirestore();

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function backfillMetadata() {
  console.log('Fetching fragrances missing notes...\n');
  
  const fragrancesRef = db.collection('fragrances');
  
  // Query only fragrances that need backfill (have fragranticaId but needsBackfill=true)
  // This avoids reading all 80k documents
  const snapshot = await fragrancesRef
    .where('needsBackfill', '==', true)
    .limit(50) // Process in batches to avoid timeout
    .get();
  
  const fragrancesToUpdate: Array<{
    id: string;
    name: string;
    brand: string;
    fragranticaId: number;
  }> = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.fragranticaId) {
      fragrancesToUpdate.push({
        id: doc.id,
        name: data.name,
        brand: data.brand,
        fragranticaId: data.fragranticaId,
      });
    }
  });
  
  console.log(`Found ${fragrancesToUpdate.length} fragrances needing backfill (limited to 50 per run)\n`);
  
  if (fragrancesToUpdate.length === 0) {
    console.log('All fragrances have notes. Nothing to do!');
    return;
  }
  
  let updated = 0;
  let failed = 0;
  
  for (const frag of fragrancesToUpdate) {
    // Construct Fragrantica URL from ID
    // Format: https://www.fragrantica.com/perfume/Brand/Name-ID.html
    const brandSlug = frag.brand.replace(/\s+/g, '-').replace(/'/g, '');
    const nameSlug = frag.name.replace(/\s+/g, '-').replace(/'/g, '');
    const url = `https://www.fragrantica.com/perfume/${brandSlug}/${nameSlug}-${frag.fragranticaId}.html`;
    
    console.log(`[${updated + failed + 1}/${fragrancesToUpdate.length}] Scraping: ${frag.brand} ${frag.name}`);
    console.log(`  URL: ${url}`);
    
    try {
      const metadata = await scrapeFragranticaMetadata(url);
      
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
        
        console.log(`  ✓ Updated with ${noteCount} notes`);
        updated++;
      } else {
        console.log(`  ⚠ No notes found in scraped data`);
        failed++;
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error}`);
      failed++;
    }
    
    // Rate limit: wait between requests to avoid being blocked
    await sleep(3000);
  }
  
  console.log('\n=== Summary ===');
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${fragrancesToUpdate.length}`);
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
