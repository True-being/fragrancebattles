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
  fragranticaId?: number;
  description?: string;
  notes?: {
    all?: string[];
  };
}

function generateSlug(brand: string, name: string): string {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generatePlaceholderImage(brand: string, name: string): string {
  const text = encodeURIComponent(`${brand} ${name}`.substring(0, 20));
  return `https://placehold.co/400x500/1a1a1a/666666?text=${text}`;
}

function getFragranticaImageUrl(fragranticaId: number): string {
  return `https://fimgs.net/mdimg/perfume/375x500.${fragranticaId}.jpg`;
}

const BATCH_SIZE = 500;
const DEFAULT_ELO = 1500;

async function seedFromCsv() {
  console.log("🚀 Starting Firestore seeding from CSV data...\n");

  // Check for --skip-duplicates flag (faster, use when collection is empty)
  const skipDuplicateCheck = process.argv.includes("--skip-duplicates");

  const db = getAdminFirestore();
  const fragrancesRef = db.collection("fragrances");

  // Load seed data
  const seedPath = path.join(process.cwd(), "data", "fragrances.from-csv.json");
  console.log(`📂 Loading ${seedPath}...`);

  const seedData: SeedFragrance[] = JSON.parse(
    fs.readFileSync(seedPath, "utf-8")
  );
  console.log(`📦 Found ${seedData.length} fragrances to potentially add\n`);

  let newFragrances: SeedFragrance[];

  if (skipDuplicateCheck) {
    console.log("⚡ Skipping duplicate check (--skip-duplicates flag)\n");
    newFragrances = seedData;
  } else {
    // Get existing slugs to avoid duplicates (expensive with large collections!)
    console.log("🔍 Fetching existing fragrances (use --skip-duplicates to skip)...");
    const existingSnapshot = await fragrancesRef.select("slug").get();
    const existingSlugs = new Set<string>();
    existingSnapshot.forEach((doc) => {
      const slug = doc.data().slug;
      if (slug) existingSlugs.add(slug);
    });
    console.log(`   Found ${existingSlugs.size} existing fragrances\n`);

    // Filter to only new fragrances
    newFragrances = seedData.filter((f) => {
      const slug = generateSlug(f.brand, f.name);
      return !existingSlugs.has(slug);
    });
  }

  console.log(`📝 ${newFragrances.length} fragrances to add\n`);

  if (newFragrances.length === 0) {
    console.log("✅ No new fragrances to add!");
    return;
  }

  const now = Timestamp.now();
  let added = 0;
  let batchNum = 0;

  // Process in batches
  for (let i = 0; i < newFragrances.length; i += BATCH_SIZE) {
    batchNum++;
    const chunk = newFragrances.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const fragrance of chunk) {
      const slug = generateSlug(fragrance.brand, fragrance.name);
      const docRef = fragrancesRef.doc();

      // Derive image URL: prefer existing, then fragrantica, then placeholder
      const imageUrl =
        fragrance.imageUrl ||
        (fragrance.fragranticaId
          ? getFragranticaImageUrl(fragrance.fragranticaId)
          : generatePlaceholderImage(fragrance.brand, fragrance.name));

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
          battles: { overall: 0, masculine: 0, feminine: 0, unisex: 0 },
          wins: { overall: 0, masculine: 0, feminine: 0, unisex: 0 },
        },
        // Random order for efficient random sampling in matchmaking
        randomOrder: Math.random(),
        createdAt: now,
        updatedAt: now,
      };

      // Add optional metadata
      if (fragrance.fragranticaId) {
        doc.fragranticaId = fragrance.fragranticaId;
      }
      if (fragrance.description) {
        doc.description = fragrance.description;
      }
      if (fragrance.notes) {
        doc.notes = fragrance.notes;
      }

      batch.set(docRef, doc);
    }

    console.log(
      `💾 Committing batch ${batchNum} (${chunk.length} fragrances)...`
    );
    await batch.commit();
    added += chunk.length;

    // Progress update
    const pct = Math.round((added / newFragrances.length) * 100);
    console.log(`   ✓ Progress: ${added}/${newFragrances.length} (${pct}%)\n`);

    // Small delay to avoid overwhelming Firestore
    if (i + BATCH_SIZE < newFragrances.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  console.log("\n✅ Seeding complete!");
  console.log(`   ${added} fragrances added to Firestore`);
}

seedFromCsv()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
