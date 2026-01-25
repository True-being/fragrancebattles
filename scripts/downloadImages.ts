/**
 * Script to download fragrance images from Fragrantica
 * 
 * Usage: npx ts-node scripts/downloadImages.ts
 * 
 * Note: These images are copyrighted. For production use, consider:
 * - Affiliate relationships with brands
 * - Licensing through image agencies
 * - Using as placeholders during development only
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const imageData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/fragrance-images.json'), 'utf-8')
);

const OUTPUT_DIR = path.join(__dirname, '../public/fragrances');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
          return;
        }
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

async function main() {
  const fragrances = imageData.fragrances;
  console.log(`Downloading ${fragrances.length} fragrance images...`);

  const results: { name: string; slug: string; path: string; success: boolean }[] = [];

  for (const fragrance of fragrances) {
    const slug = slugify(`${fragrance.brand}-${fragrance.name}`);
    const filename = `${slug}.jpg`;
    const filepath = path.join(OUTPUT_DIR, filename);
    const relativePath = `/fragrances/${filename}`;

    // Use Fragrantica URL as primary source
    const imageUrl = fragrance.image_sources.fragrantica;

    if (!imageUrl) {
      console.log(`⚠️  No image URL for ${fragrance.name}`);
      results.push({ name: fragrance.name, slug, path: relativePath, success: false });
      continue;
    }

    try {
      console.log(`📥 Downloading: ${fragrance.brand} ${fragrance.name}`);
      await downloadImage(imageUrl, filepath);
      console.log(`✅ Saved: ${filename}`);
      results.push({ name: fragrance.name, slug, path: relativePath, success: true });
    } catch (error) {
      console.log(`❌ Failed: ${fragrance.name} - ${error}`);
      results.push({ name: fragrance.name, slug, path: relativePath, success: false });
    }

    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Generate updated seed file with image paths
  const updatedSeed = fragrances.map((f: any) => {
    const slug = slugify(`${f.brand}-${f.name}`);
    const result = results.find(r => r.slug === slug);
    
    // Get original data from seed file
    const originalSeed = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/fragrances.seed.json'), 'utf-8')
    );
    const original = originalSeed.find((o: any) => o.name === f.name && o.brand === f.brand);
    
    return {
      ...original,
      imageUrl: result?.success ? result.path : null,
      fragranticaImage: f.image_sources.fragrantica,
      officialUrl: f.image_sources.official
    };
  });

  fs.writeFileSync(
    path.join(__dirname, '../data/fragrances.seed.with-images.json'),
    JSON.stringify(updatedSeed, null, 2)
  );

  console.log('\n📊 Summary:');
  console.log(`   Successful: ${results.filter(r => r.success).length}`);
  console.log(`   Failed: ${results.filter(r => !r.success).length}`);
  console.log(`\n📁 Images saved to: ${OUTPUT_DIR}`);
  console.log(`📄 Updated seed file: data/fragrances.seed.with-images.json`);
}

main().catch(console.error);
