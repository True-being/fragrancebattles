import { getAdminFirestore } from "../lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
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

function generatePlaceholderImage(brand: string, name: string): string {
  // Using a placeholder service - can be replaced with real images later
  const text = encodeURIComponent(`${brand} ${name}`.substring(0, 20));
  return `https://placehold.co/400x500/1a1a1a/666666?text=${text}`;
}

function extractFragranticaId(imageUrl: string): number | null {
  // Extract ID from URLs like https://fimgs.net/mdimg/perfume/375x500.9828.jpg
  const match = imageUrl.match(/\.(\d+)\.jpg$/);
  return match ? parseInt(match[1], 10) : null;
}

async function seedFirestore() {
  console.log("🚀 Starting Firestore seeding...\n");

  const db = getAdminFirestore();
  
  // Load seed data - use version with images if available
  const seedPathWithImages = path.join(process.cwd(), "data", "fragrances.seed.with-images.json");
  const seedPathOriginal = path.join(process.cwd(), "data", "fragrances.seed.json");
  const seedPath = fs.existsSync(seedPathWithImages) ? seedPathWithImages : seedPathOriginal;
  
  console.log(`📂 Using seed file: ${path.basename(seedPath)}`);
  
  const seedData: SeedFragrance[] = JSON.parse(
    fs.readFileSync(seedPath, "utf-8")
  );

  console.log(`📦 Found ${seedData.length} fragrances to seed\n`);

  const batch = db.batch();
  const fragrancesRef = db.collection("fragrances");
  
  const now = Timestamp.now();
  const DEFAULT_ELO = 1500;

  for (const fragrance of seedData) {
    const slug = generateSlug(fragrance.brand, fragrance.name);
    const docRef = fragrancesRef.doc();
    const imageUrl = fragrance.imageUrl || generatePlaceholderImage(fragrance.brand, fragrance.name);
    const fragranticaId = fragrance.imageUrl ? extractFragranticaId(fragrance.imageUrl) : null;

    const doc: Record<string, unknown> = {
      name: fragrance.name,
      brand: fragrance.brand,
      slug,
      imageUrl,
      arenas: fragrance.arenas,
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
      // Random order for efficient random sampling in matchmaking
      randomOrder: Math.random(),
      // Flag for backfill script to scrape metadata from Fragrantica
      needsBackfill: true,
      createdAt: now,
      updatedAt: now,
    };
    
    // Add fragranticaId if we could extract it from imageUrl
    if (fragranticaId) {
      doc.fragranticaId = fragranticaId;
    }

    batch.set(docRef, doc);
    console.log(`  ✓ ${fragrance.brand} - ${fragrance.name} (${slug})`);
  }

  console.log("\n💾 Committing batch write...");
  await batch.commit();
  
  console.log("\n✅ Seeding complete!");
  console.log(`   ${seedData.length} fragrances added to Firestore`);
  console.log("\n🎯 Next steps:");
  console.log("   1. Verify data in Firebase Console");
  console.log("   2. Replace placeholder images with real bottle images");
  console.log("   3. Run `npm run dev` to start the application");
}

// Run the seeder
seedFirestore()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
