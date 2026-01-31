/**
 * Populate brands collection from fragrances
 * 
 * This script creates a small "brands" collection with unique brand names and slugs.
 * Used by the sitemap to avoid reading 89k fragrance docs just to get brand URLs.
 * 
 * Run with: npx tsx scripts/populateBrands.ts
 */

import * as dotenv from "dotenv";
dotenv.config();

import { getAdminFirestore } from "../lib/firebase/admin";

const db = getAdminFirestore();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function populateBrands() {
  console.log("Fetching unique brands from fragrances collection...");
  
  // Use select() to only fetch brand field - reduces bandwidth
  const snapshot = await db.collection("fragrances").select("brand").get();
  
  const brandMap = new Map<string, string>();
  
  for (const doc of snapshot.docs) {
    const brand = doc.data().brand as string;
    if (brand && !brandMap.has(brand)) {
      brandMap.set(brand, slugify(brand));
    }
  }
  
  console.log(`Found ${brandMap.size} unique brands from ${snapshot.size} fragrances`);
  
  // Check existing brands
  const existingBrands = await db.collection("brands").get();
  const existingSlugs = new Set(existingBrands.docs.map(d => d.data().slug));
  
  // Find new brands to add
  const newBrands: { name: string; slug: string }[] = [];
  for (const [name, slug] of brandMap) {
    if (!existingSlugs.has(slug)) {
      newBrands.push({ name, slug });
    }
  }
  
  if (newBrands.length === 0) {
    console.log("All brands already exist in brands collection. Nothing to add.");
    return;
  }
  
  console.log(`Adding ${newBrands.length} new brands...`);
  
  // Batch write in groups of 500
  const batchSize = 500;
  for (let i = 0; i < newBrands.length; i += batchSize) {
    const batch = db.batch();
    const chunk = newBrands.slice(i, i + batchSize);
    
    for (const brand of chunk) {
      const docRef = db.collection("brands").doc(brand.slug);
      batch.set(docRef, {
        name: brand.name,
        slug: brand.slug,
        createdAt: new Date(),
      });
    }
    
    await batch.commit();
    console.log(`  Wrote batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newBrands.length / batchSize)}`);
  }
  
  console.log(`Done! Added ${newBrands.length} brands to brands collection.`);
}

populateBrands().catch(console.error);
