/**
 * Fixes missing sourceUrl for fragrances by constructing from brand/name/id
 * 
 * Usage: npx tsx scripts/fixSourceUrls.ts
 *        npx tsx scripts/fixSourceUrls.ts --limit=50
 *        npx tsx scripts/fixSourceUrls.ts --dry-run
 * 
 * This script:
 * 1. Finds fragrances with needsBackfill=true but no sourceUrl
 * 2. Constructs the Fragrantica URL from brand/name/id
 * 3. Updates the sourceUrl field (no API calls needed!)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getAdminFirestore } from '../lib/firebase/admin';

const db = getAdminFirestore();

// Parse CLI args
const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : 500;
const DRY_RUN = args.includes('--dry-run');

interface FragranceToFix {
  id: string;
  name: string;
  brand: string;
  fragranticaId: number;
}

function constructFragranticaUrl(brand: string, name: string, fragranticaId: number): string {
  // Pattern: https://www.fragrantica.com/perfume/Brand-Name/Fragrance-Name-ID.html
  const brandSlug = brand.replace(/\s+/g, '-').replace(/'/g, '');
  const nameSlug = name.replace(/\s+/g, '-').replace(/'/g, '');
  return `https://www.fragrantica.com/perfume/${brandSlug}/${nameSlug}-${fragranticaId}.html`;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Fix Missing sourceUrl (No API calls needed!)');
  console.log('='.repeat(60));
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN - no changes will be made\n');
  }
  
  // Find fragrances with needsBackfill but no sourceUrl
  console.log(`\nFetching fragrances without sourceUrl (limit: ${LIMIT})...\n`);
  
  const snapshot = await db.collection('fragrances')
    .where('needsBackfill', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(LIMIT * 2) // Fetch more since we'll filter
    .get();
  
  const fragrancesToFix: FragranceToFix[] = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    // Only include ones without sourceUrl
    if (data.fragranticaId && !data.sourceUrl) {
      fragrancesToFix.push({
        id: doc.id,
        name: data.name,
        brand: data.brand,
        fragranticaId: data.fragranticaId,
      });
    }
  });
  
  // Limit to requested amount
  const toProcess = fragrancesToFix.slice(0, LIMIT);
  
  console.log(`Found ${fragrancesToFix.length} fragrances without sourceUrl`);
  console.log(`Processing ${toProcess.length}\n`);
  
  if (toProcess.length === 0) {
    console.log('Nothing to fix!');
    return;
  }
  
  // Use batch writes for efficiency
  const batch = db.batch();
  
  for (const frag of toProcess) {
    const sourceUrl = constructFragranticaUrl(frag.brand, frag.name, frag.fragranticaId);
    console.log(`${frag.brand} - ${frag.name}`);
    console.log(`  → ${sourceUrl}`);
    
    if (!DRY_RUN) {
      const docRef = db.collection('fragrances').doc(frag.id);
      batch.update(docRef, { sourceUrl });
    }
  }
  
  if (!DRY_RUN) {
    console.log('\nCommitting batch update...');
    await batch.commit();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`  Updated: ${toProcess.length}`);
  
  if (DRY_RUN) {
    console.log('\n(Dry run - no changes were made)');
  } else {
    console.log('\nRun npx tsx scripts/backfillMetadata.ts to scrape notes.');
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
