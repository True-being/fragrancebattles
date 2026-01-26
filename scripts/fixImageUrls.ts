import { getAdminFirestore } from "../lib/firebase/admin";

const BATCH_SIZE = 500;

function getFragranticaImageUrl(fragranticaId: number): string {
  return `https://fimgs.net/mdimg/perfume/375x500.${fragranticaId}.jpg`;
}

async function fixImageUrls() {
  console.log("🔧 Fixing image URLs for fragrances with fragranticaId...\n");

  const db = getAdminFirestore();
  const fragrancesRef = db.collection("fragrances");

  // Find all fragrances with placeholder images that have fragranticaId
  const snapshot = await fragrancesRef
    .where("imageUrl", ">=", "https://placehold.co/")
    .where("imageUrl", "<", "https://placehold.cp")
    .get();

  console.log(`Found ${snapshot.size} fragrances with placeholder images\n`);

  const toUpdate = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return data.fragranticaId && typeof data.fragranticaId === "number";
  });

  console.log(`${toUpdate.length} have fragranticaId and can be fixed\n`);

  if (toUpdate.length === 0) {
    console.log("✅ Nothing to fix!");
    return;
  }

  let updated = 0;
  let batchNum = 0;

  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    batchNum++;
    const chunk = toUpdate.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const doc of chunk) {
      const data = doc.data();
      const newImageUrl = getFragranticaImageUrl(data.fragranticaId);
      batch.update(doc.ref, { imageUrl: newImageUrl });
    }

    console.log(`💾 Updating batch ${batchNum} (${chunk.length} docs)...`);
    await batch.commit();
    updated += chunk.length;

    const pct = Math.round((updated / toUpdate.length) * 100);
    console.log(`   ✓ Progress: ${updated}/${toUpdate.length} (${pct}%)\n`);

    if (i + BATCH_SIZE < toUpdate.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  console.log("\n✅ Done!");
  console.log(`   Updated ${updated} fragrance image URLs`);
}

fixImageUrls()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
