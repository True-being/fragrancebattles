/**
 * Backfill brandSlug field for all fragrances
 * Run with: npx tsx scripts/backfillBrandSlug.ts
 */

import * as dotenv from "dotenv";
dotenv.config();

import { getAdminFirestore } from "../lib/firebase/admin";
import { slugify } from "../lib/seo";

const BATCH_SIZE = 500;

async function backfillBrandSlug() {
  const db = getAdminFirestore();
  
  console.log("Fetching all fragrances...");
  const snapshot = await db.collection("fragrances").get();
  console.log(`Found ${snapshot.size} fragrances`);
  
  let updated = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchCount = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Skip if already has brandSlug
    if (data.brandSlug) {
      skipped++;
      continue;
    }
    
    const brandSlug = slugify(data.brand);
    batch.update(doc.ref, { brandSlug });
    batchCount++;
    updated++;
    
    if (batchCount >= BATCH_SIZE) {
      console.log(`Committing batch of ${batchCount} updates...`);
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  
  // Commit remaining
  if (batchCount > 0) {
    console.log(`Committing final batch of ${batchCount} updates...`);
    await batch.commit();
  }
  
  console.log(`\nDone!`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already had brandSlug): ${skipped}`);
}

backfillBrandSlug().catch(console.error);
