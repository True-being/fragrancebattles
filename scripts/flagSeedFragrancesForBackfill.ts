/**
 * Flags the 76 seed fragrances for backfill (to get accurate data from Fragrantica)
 * Does NOT touch the 80k CSV fragrances
 * 
 * Usage: npx tsx scripts/flagSeedFragrancesForBackfill.ts
 * 
 * After running this, run: npx tsx scripts/backfillMetadata.ts
 */

import { getAdminFirestore } from '../lib/firebase/admin';
import * as fs from 'fs';
import * as path from 'path';

const db = getAdminFirestore();

interface SeedFragrance {
  name: string;
  brand: string;
  imageUrl?: string;
}

function extractFragranticaId(imageUrl: string): number | null {
  const match = imageUrl.match(/\.(\d+)\.jpg$/);
  return match ? parseInt(match[1], 10) : null;
}

async function main() {
  console.log('🔍 Loading seed fragrances...\n');
  
  // Load the 76 seed fragrances
  const seedPath = path.join(process.cwd(), 'data', 'fragrances.seed.with-images.json');
  const seedData: SeedFragrance[] = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  
  console.log(`Found ${seedData.length} seed fragrances\n`);
  
  // Build a lookup map: "Brand Name" -> fragranticaId
  const seedLookup = new Map<string, number>();
  for (const frag of seedData) {
    const key = `${frag.brand} ${frag.name}`.toLowerCase();
    if (frag.imageUrl) {
      const id = extractFragranticaId(frag.imageUrl);
      if (id) {
        seedLookup.set(key, id);
      }
    }
  }
  
  console.log(`🔄 Searching Firestore for matching fragrances...\n`);
  
  const fragrancesRef = db.collection('fragrances');
  let updated = 0;
  let notFound = 0;
  let alreadyFlagged = 0;
  
  for (const frag of seedData) {
    const key = `${frag.brand} ${frag.name}`.toLowerCase();
    const fragranticaId = seedLookup.get(key);
    
    // Find this fragrance in Firestore by brand + name
    const snapshot = await fragrancesRef
      .where('brand', '==', frag.brand)
      .where('name', '==', frag.name)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.log(`❌ Not found: ${frag.brand} ${frag.name}`);
      notFound++;
      continue;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    // Skip if already flagged and has fragranticaId
    if (data.needsBackfill === true && data.fragranticaId) {
      console.log(`⏭️  Already flagged: ${frag.brand} ${frag.name}`);
      alreadyFlagged++;
      continue;
    }
    
    // Update with fragranticaId and backfill flag
    const updateData: Record<string, unknown> = {
      needsBackfill: true,
    };
    
    if (fragranticaId && !data.fragranticaId) {
      updateData.fragranticaId = fragranticaId;
    }
    
    await doc.ref.update(updateData);
    console.log(`✅ Flagged: ${frag.brand} ${frag.name} (ID: ${fragranticaId || data.fragranticaId})`);
    updated++;
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Flagged for backfill: ${updated}`);
  console.log(`   Already flagged: ${alreadyFlagged}`);
  console.log(`   Not found in DB: ${notFound}`);
  console.log(`\n🎯 Next step: npx tsx scripts/backfillMetadata.ts`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
