/**
 * Updates imageUrl on existing Firestore fragrances by matching slug
 * 
 * Usage: npx tsx scripts/updateImageUrls.ts
 */

import { getAdminFirestore } from "../lib/firebase/admin";
import * as fs from "fs";
import * as path from "path";

interface SeedFragrance {
  name: string;
  brand: string;
  arenas: {
    overall: boolean;
    masculine: boolean;
    feminine: boolean;
    unisex: boolean;
  };
  imageUrl?: string;
}

function generateSlug(brand: string, name: string): string {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function updateImageUrls() {
  console.log("🔄 Updating fragrance image URLs in Firestore...\n");

  const db = getAdminFirestore();
  
  // Load the seed data with corrected images
  const seedPath = path.join(process.cwd(), "data", "fragrances.seed.with-images.json");
  
  if (!fs.existsSync(seedPath)) {
    console.error("❌ fragrances.seed.with-images.json not found!");
    console.log("   Run: npx tsx scripts/fetchFragranceImages.ts first");
    process.exit(1);
  }
  
  const seedData: SeedFragrance[] = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
  
  // Build a map of slug -> imageUrl
  const imageMap = new Map<string, string>();
  for (const frag of seedData) {
    const slug = generateSlug(frag.brand, frag.name);
    if (frag.imageUrl) {
      imageMap.set(slug, frag.imageUrl);
    }
  }
  
  console.log(`📦 Loaded ${imageMap.size} fragrances with image URLs\n`);
  
  // Get all existing fragrances from Firestore
  const fragrancesRef = db.collection("fragrances");
  const snapshot = await fragrancesRef.get();
  
  console.log(`📂 Found ${snapshot.size} fragrances in Firestore\n`);
  
  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  
  const batch = db.batch();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const slug = data.slug as string;
    const currentImageUrl = data.imageUrl as string;
    const newImageUrl = imageMap.get(slug);
    
    if (!newImageUrl) {
      console.log(`⚠️  No image found for: ${slug}`);
      notFound++;
      continue;
    }
    
    if (currentImageUrl === newImageUrl) {
      console.log(`⏭️  Already correct: ${slug}`);
      skipped++;
      continue;
    }
    
    batch.update(doc.ref, { imageUrl: newImageUrl });
    console.log(`✅ Updating: ${slug}`);
    console.log(`   Old: ${currentImageUrl}`);
    console.log(`   New: ${newImageUrl}`);
    updated++;
  }
  
  if (updated > 0) {
    console.log("\n💾 Committing batch update...");
    await batch.commit();
  }
  
  console.log("\n📊 Summary:");
  console.log(`   Updated: ${updated}`);
  console.log(`   Already correct: ${skipped}`);
  console.log(`   Not found in seed: ${notFound}`);
  console.log("\n✅ Done!");
}

updateImageUrls()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Update failed:", error);
    process.exit(1);
  });
