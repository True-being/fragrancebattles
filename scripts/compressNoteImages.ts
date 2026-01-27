import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const INPUT_DIR = path.join(process.cwd(), "public/note-images");
const OUTPUT_DIR = path.join(process.cwd(), "public/note-images-optimized");

const TARGET_SIZE = 160; // 160x160 for retina displays at 80px
const QUALITY = 80;

async function compressImages() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(INPUT_DIR).filter((f) => f.endsWith(".png"));
  console.log(`Found ${files.length} PNG files to compress`);

  let totalOriginal = 0;
  let totalCompressed = 0;

  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const outputName = file.replace(".png", ".webp");
    const outputPath = path.join(OUTPUT_DIR, outputName);

    const originalSize = fs.statSync(inputPath).size;
    totalOriginal += originalSize;

    try {
      await sharp(inputPath)
        .resize(TARGET_SIZE, TARGET_SIZE, {
          fit: "cover",
          position: "center",
        })
        .webp({ quality: QUALITY })
        .toFile(outputPath);

      const compressedSize = fs.statSync(outputPath).size;
      totalCompressed += compressedSize;

      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      console.log(
        `✓ ${file} → ${outputName} (${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024).toFixed(1)}KB, -${ratio}%)`
      );
    } catch (error) {
      console.error(`✗ Failed to compress ${file}:`, error);
    }
  }

  console.log("\n--- Summary ---");
  console.log(
    `Original total: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(
    `Compressed total: ${(totalCompressed / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(
    `Reduction: ${((1 - totalCompressed / totalOriginal) * 100).toFixed(1)}%`
  );
  console.log(`\nOutput saved to: ${OUTPUT_DIR}`);
}

compressImages().catch(console.error);
