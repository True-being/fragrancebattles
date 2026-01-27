import { getAdminFirestore } from "../lib/firebase/admin";

/**
 * Migration script to add randomOrder field to all existing fragrances
 * This enables efficient random sampling in matchmaking queries
 * 
 * Run with: npx tsx scripts/addRandomOrder.ts
 */

const BATCH_SIZE = 500;

async function addRandomOrder() {
  console.log("🎲 Adding randomOrder field to all fragrances...\n");

  const db = getAdminFirestore();
  const fragrancesRef = db.collection("fragrances");

  // Count docs missing randomOrder
  console.log("🔍 Counting fragrances without randomOrder...");
  
  // We need to fetch all docs without randomOrder
  // Firestore doesn't support "where field doesn't exist" directly,
  // so we'll process all docs and skip those that already have it
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let totalProcessed = 0;
  let totalUpdated = 0;
  let batchNum = 0;

  while (true) {
    // Build query with pagination
    let query = fragrancesRef.orderBy("__name__").limit(BATCH_SIZE);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    
    if (snapshot.empty) {
      break;
    }

    // Filter to docs missing randomOrder
    const docsToUpdate = snapshot.docs.filter(
      (doc) => doc.data().randomOrder === undefined
    );

    if (docsToUpdate.length > 0) {
      batchNum++;
      const batch = db.batch();

      for (const doc of docsToUpdate) {
        batch.update(doc.ref, {
          randomOrder: Math.random(),
        });
      }

      console.log(
        `💾 Batch ${batchNum}: Updating ${docsToUpdate.length} fragrances...`
      );
      await batch.commit();
      totalUpdated += docsToUpdate.length;
    }

    totalProcessed += snapshot.size;
    lastDoc = snapshot.docs[snapshot.docs.length - 1];

    // Progress update
    console.log(`   ✓ Processed ${totalProcessed} docs, updated ${totalUpdated}`);

    // Small delay to avoid overwhelming Firestore
    await new Promise((r) => setTimeout(r, 50));
  }

  console.log("\n✅ Migration complete!");
  console.log(`   Total processed: ${totalProcessed}`);
  console.log(`   Total updated: ${totalUpdated}`);
  console.log(
    `   Skipped (already had randomOrder): ${totalProcessed - totalUpdated}`
  );
}

addRandomOrder()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
