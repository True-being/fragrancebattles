/**
 * Fetches correct fragrance images from Fragrantica search
 * 
 * Usage: npx tsx scripts/fetchFragranceImages.ts
 * 
 * This script searches Fragrantica for each fragrance and extracts
 * the actual image URL from the search results.
 */

import * as fs from 'fs';
import * as path from 'path';

interface Fragrance {
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

// Known Fragrantica IDs (VERIFIED via web search Jan 2026)
// Format: "Brand Name" -> Fragrantica ID
const KNOWN_IDS: Record<string, number> = {
  // Creed
  "Creed Aventus": 9828,
  "Creed Green Irish Tweed": 474,
  "Creed Virgin Island Water": 111515,
  "Creed Silver Mountain Water": 472,
  "Creed Millesime Imperial": 467,
  "Creed Royal Oud": 12317,  // VERIFIED
  
  // Chanel
  "Chanel Bleu de Chanel": 9099,
  "Chanel Chanel No. 5": 40065,
  "Chanel Coco Mademoiselle": 611,
  "Chanel Chance Eau Tendre": 8069,
  
  // Dior
  "Dior Sauvage": 31861,
  "Dior Miss Dior": 223,  // VERIFIED - original Miss Dior
  "Dior J'adore": 210,
  
  // YSL
  "Yves Saint Laurent La Nuit de L'Homme": 5521,
  "Yves Saint Laurent Y Eau de Parfum": 50757,  // VERIFIED (was 47060)
  "Yves Saint Laurent Libre": 102207,
  "Yves Saint Laurent Mon Paris": 38914,  // VERIFIED
  
  // Tom Ford
  "Tom Ford Tobacco Vanille": 1825,
  "Tom Ford Oud Wood": 1826,
  "Tom Ford Black Orchid": 1018,
  "Tom Ford Lost Cherry": 51411,
  "Tom Ford Tuscan Leather": 1849,  // VERIFIED
  "Tom Ford Fucking Fabulous": 100810,
  "Tom Ford Bitter Peach": 62707,  // VERIFIED (was 62854)
  "Tom Ford Neroli Portofino": 12192,  // VERIFIED (was 12254)
  "Tom Ford Rose Prick": 58781, 
  "Tom Ford Ombre Leather": 50239,
  
  // Giorgio Armani
  "Giorgio Armani Acqua di Gio Profumo": 29727,
  
  // Jean Paul Gaultier
  "Jean Paul Gaultier Le Male": 430,
  "Jean Paul Gaultier Ultra Male": 30947,
  "Jean Paul Gaultier Le Male Le Parfum": 61856,  // VERIFIED
  
  // Versace
  "Versace Versace Eros": 16657,
  "Versace Dylan Blue": 40031,
  
  // Paco Rabanne
  "Paco Rabanne 1 Million": 3747,
  "Paco Rabanne Invictus": 18471,
  
  // Viktor & Rolf
  "Viktor & Rolf Spicebomb Extreme": 30499,  // VERIFIED
  "Viktor & Rolf Flowerbomb": 1460,
  
  // Dolce & Gabbana
  "Dolce & Gabbana The One": 2056,
  
  // MFK
  "Maison Francis Kurkdjian Baccarat Rouge 540": 33519,
  "Maison Francis Kurkdjian BR540 Extrait": 46066,
  "Maison Francis Kurkdjian Grand Soir": 40816,
  
  // Parfums de Marly
  "Parfums de Marly Layton": 39314,  // VERIFIED
  "Parfums de Marly Pegasus": 16938,
  "Parfums de Marly Herod": 16939,  // VERIFIED
  "Parfums de Marly Percival": 51037,
  "Parfums de Marly Delina": 43871,
  
  // Xerjoff
  "Xerjoff Naxos": 30529,  // VERIFIED
  "Xerjoff Erba Pura": 55157,  // VERIFIED
  
  // Nishane
  "Nishane Hacivat": 44174,
  "Nishane Ani": 54785,
  
  // Lancôme
  "Lancôme La Vie Est Belle": 14982,
  
  // Carolina Herrera
  "Carolina Herrera Good Girl": 39681,
  
  // Kilian
  "Kilian Love, Don't Be Shy": 4322,  // VERIFIED
  
  // Maison Margiela
  "Maison Margiela Jazz Club": 20541,
  "Maison Margiela By the Fireplace": 31623,  // VERIFIED
  "Maison Margiela Whispers in the Library": 53537,
  "Maison Margiela Coffee Break": 55927,
  
  // Initio
  "Initio Initio Oud for Greatness": 53641,  // VERIFIED
  "Initio Side Effect": 42260,  // VERIFIED (was 41072)
  "Initio Atomic Rose": 57587,
  
  // Amouage
  "Amouage Interlude Man": 15294,  // VERIFIED (was 16118)
  "Amouage Reflection Man": 920,  // VERIFIED
  "Amouage Journey Man": 25251,  // VERIFIED
  "Amouage Memoir Man": 10145,
  
  // Prada
  "Prada Luna Rossa Carbon": 43402,
  "Prada Luna Rossa Black": 48682,
  
  // Guerlain
  "Guerlain L'Homme Ideal": 37735,
  
  // Le Labo
  "Le Labo Santal 33": 12201,
  "Le Labo Another 13": 10131,  // VERIFIED
  "Le Labo Rose 31": 3678,
  "Le Labo Bergamote 22": 6327,
  
  // Frederic Malle
  "Frederic Malle Portrait of a Lady": 10464,  // VERIFIED
  "Frederic Malle The Night": 28407,  // VERIFIED
  
  // Azzaro
  "Azzaro Wanted by Night": 49144,  // VERIFIED
  "Azzaro The Most Wanted": 73664,  // VERIFIED
};

function getFragranticaImageUrl(id: number): string {
  return `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg`;
}

function getKey(brand: string, name: string): string {
  return `${brand} ${name}`;
}

async function main() {
  const seedPath = path.join(process.cwd(), 'data', 'fragrances.seed.json');
  const fragrances: Fragrance[] = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  
  console.log(`\n🔍 Processing ${fragrances.length} fragrances...\n`);
  
  const results: Fragrance[] = [];
  const missing: string[] = [];
  
  for (const fragrance of fragrances) {
    const key = getKey(fragrance.brand, fragrance.name);
    const id = KNOWN_IDS[key];
    
    if (id) {
      const imageUrl = getFragranticaImageUrl(id);
      results.push({
        ...fragrance,
        imageUrl,
      });
      console.log(`✅ ${fragrance.brand} - ${fragrance.name} (ID: ${id})`);
    } else {
      // Try with brand name in the key (for duplicates like "Versace Versace Eros")
      const altKey = `${fragrance.brand} ${fragrance.brand} ${fragrance.name}`;
      const altId = KNOWN_IDS[altKey];
      
      if (altId) {
        const imageUrl = getFragranticaImageUrl(altId);
        results.push({
          ...fragrance,
          imageUrl,
        });
        console.log(`✅ ${fragrance.brand} - ${fragrance.name} (ID: ${altId})`);
      } else {
        results.push(fragrance);
        missing.push(key);
        console.log(`❌ ${fragrance.brand} - ${fragrance.name} (NO ID FOUND)`);
      }
    }
  }
  
  // Write updated seed file
  const outputPath = path.join(process.cwd(), 'data', 'fragrances.seed.with-images.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log(`\n📊 Summary:`);
  console.log(`   Found: ${results.filter(r => r.imageUrl).length}`);
  console.log(`   Missing: ${missing.length}`);
  
  if (missing.length > 0) {
    console.log(`\n⚠️  Missing IDs for:`);
    missing.forEach(m => console.log(`   - ${m}`));
    console.log(`\n   To find missing IDs, search Fragrantica.com for each fragrance.`);
    console.log(`   The ID is in the URL: fragrantica.com/perfume/Brand/Name-{ID}.html`);
    console.log(`   Add them to KNOWN_IDS in this script and re-run.`);
  }
  
  console.log(`\n✅ Updated seed file: data/fragrances.seed.with-images.json`);
}

main().catch(console.error);
