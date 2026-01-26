/**
 * Populates fragrance metadata (year, concentration, perfumer, description, fragranticaId)
 * 
 * Usage: npx tsx scripts/populateFragranceMetadata.ts
 * 
 * This script adds curated metadata to existing fragrances in Firestore.
 * Run after seeding fragrances with images.
 */

import { getAdminFirestore } from '../lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

const db = getAdminFirestore();

interface FragranceMetadata {
  year?: number;
  concentration?: string;
  perfumer?: string;
  description?: string;
  fragranticaId?: number;
}

// Curated metadata for each fragrance
// Key format: "Brand Name" (matching seed data)
const FRAGRANCE_METADATA: Record<string, FragranceMetadata> = {
  // === CREED ===
  "Creed Aventus": {
    year: 2010,
    concentration: "EDP",
    perfumer: "Olivier Creed",
    description: "A bold, fruity-smoky scent built on pineapple, birch, and musk. The fragrance that launched a thousand clones.",
    fragranticaId: 9828,
  },
  "Creed Green Irish Tweed": {
    year: 1985,
    concentration: "EDP",
    perfumer: "Olivier Creed",
    description: "Fresh, green, and timeless. A refined blend of iris, verbena, and sandalwood that set the template for countless sport fragrances.",
    fragranticaId: 474,
  },
  "Creed Virgin Island Water": {
    year: 2007,
    concentration: "EDP",
    perfumer: "Olivier Creed",
    description: "A tropical escape in a bottle. Coconut, lime, and white rum evoke Caribbean beaches.",
    fragranticaId: 111515,
  },
  "Creed Silver Mountain Water": {
    year: 1995,
    concentration: "EDP",
    perfumer: "Olivier Creed",
    description: "Crisp and invigorating, inspired by Alpine glaciers. Green tea, bergamot, and musks.",
    fragranticaId: 472,
  },
  "Creed Millesime Imperial": {
    year: 1995,
    concentration: "EDP",
    perfumer: "Olivier Creed",
    description: "Salty, aquatic elegance. Sea salt, iris, and musk create a refined marine fragrance.",
    fragranticaId: 467,
  },
  "Creed Royal Oud": {
    year: 2011,
    concentration: "EDP",
    perfumer: "Olivier Creed",
    description: "A regal blend of oud, pink pepper, and cedar. Smoky, spicy, and unmistakably luxurious.",
    fragranticaId: 12317,
  },

  // === CHANEL ===
  "Chanel Bleu de Chanel": {
    year: 2010,
    concentration: "EDP",
    perfumer: "Jacques Polge",
    description: "Woody-aromatic sophistication. Citrus, mint, and sandalwood in perfect balance.",
    fragranticaId: 9099,
  },
  "Chanel Chanel No. 5": {
    year: 1921,
    concentration: "Parfum",
    perfumer: "Ernest Beaux",
    description: "The most iconic fragrance ever created. Aldehydes, ylang-ylang, and sandalwood in revolutionary harmony.",
    fragranticaId: 40065,
  },
  "Chanel Coco Mademoiselle": {
    year: 2001,
    concentration: "EDP",
    perfumer: "Jacques Polge",
    description: "Fresh, oriental, and utterly seductive. Orange, rose, and patchouli in a modern classic.",
    fragranticaId: 611,
  },
  "Chanel Chance Eau Tendre": {
    year: 2010,
    concentration: "EDT",
    perfumer: "Jacques Polge",
    description: "Soft, fruity florals. Grapefruit, jasmine, and white musk in a gentle, feminine embrace.",
    fragranticaId: 8069,
  },

  // === DIOR ===
  "Dior Sauvage": {
    year: 2015,
    concentration: "EDT",
    perfumer: "François Demachy",
    description: "Raw, magnetic, and wildly popular. Bergamot and Ambroxan in a bold, unapologetic blend.",
    fragranticaId: 31861,
  },
  "Dior Miss Dior": {
    year: 2012,
    concentration: "EDP",
    perfumer: "François Demachy",
    description: "Chypre elegance reimagined. Rose, patchouli, and mandarin in sophisticated harmony.",
    fragranticaId: 223,
  },
  "Dior J'adore": {
    year: 1999,
    concentration: "EDP",
    perfumer: "Calice Becker",
    description: "Radiant, floral luxury. Ylang-ylang, rose, and jasmine in a golden embrace.",
    fragranticaId: 210,
  },

  // === YSL ===
  "Yves Saint Laurent La Nuit de L'Homme": {
    year: 2009,
    concentration: "EDT",
    perfumer: "Anne Flipo, Dominique Ropion, Pierre Wargnye",
    description: "Dark, spicy seduction. Cardamom, lavender, and cedar in a mysterious blend.",
    fragranticaId: 5521,
  },
  "Yves Saint Laurent Y Eau de Parfum": {
    year: 2018,
    concentration: "EDP",
    perfumer: "Dominique Ropion",
    description: "Fresh and powerful. Apple, ginger, and amberwood in a confident statement.",
    fragranticaId: 50757,
  },
  "Yves Saint Laurent Libre": {
    year: 2019,
    concentration: "EDP",
    perfumer: "Anne Flipo, Carlos Benaim",
    description: "Lavender and orange blossom in a feminine-masculine balance. Bold and free.",
    fragranticaId: 102207,
  },
  "Yves Saint Laurent Mon Paris": {
    year: 2016,
    concentration: "EDP",
    perfumer: "Olivier Cresp, Harry Fremont, Dora Baghriche",
    description: "Intensely romantic. Strawberry, peony, and patchouli in a passionate embrace.",
    fragranticaId: 38914,
  },

  // === TOM FORD ===
  "Tom Ford Tobacco Vanille": {
    year: 2007,
    concentration: "EDP",
    perfumer: "Olivier Gillotin",
    description: "Opulent, addictive warmth. Tobacco leaf, vanilla, and spices in decadent harmony.",
    fragranticaId: 1825,
  },
  "Tom Ford Oud Wood": {
    year: 2007,
    concentration: "EDP",
    perfumer: "Richard Herpin",
    description: "Sophisticated oud for the masses. Smoky, exotic, and endlessly refined.",
    fragranticaId: 1826,
  },
  "Tom Ford Black Orchid": {
    year: 2006,
    concentration: "EDP",
    perfumer: "David Apel, Givaudan",
    description: "Dark, lush, and intoxicating. Black truffle, ylang-ylang, and orchid in dramatic fusion.",
    fragranticaId: 1018,
  },
  "Tom Ford Lost Cherry": {
    year: 2018,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Provocative cherry-almond sweetness. Bitter almonds, cherry liqueur, and tonka bean.",
    fragranticaId: 51411,
  },
  "Tom Ford Tuscan Leather": {
    year: 2007,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Raw, animalic leather. Raspberry, saffron, and leather in uncompromising intensity.",
    fragranticaId: 1849,
  },
  "Tom Ford Fucking Fabulous": {
    year: 2017,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Provocative name, sophisticated scent. Lavender, leather, and tonka bean.",
    fragranticaId: 100810,
  },
  "Tom Ford Bitter Peach": {
    year: 2020,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Juicy, boozy decadence. Blood peach, rum, and cognac in sweet indulgence.",
    fragranticaId: 62707,
  },
  "Tom Ford Neroli Portofino": {
    year: 2011,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Mediterranean sunshine captured. Neroli, bergamot, and amber in elegant freshness.",
    fragranticaId: 12192,
  },
  "Tom Ford Rose Prick": {
    year: 2020,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Rose with thorns. Turkish rose, turmeric, and patchouli in a spiky floral.",
    fragranticaId: 58781,
  },
  "Tom Ford Ombre Leather": {
    year: 2018,
    concentration: "EDP",
    perfumer: "Sonia Constant",
    description: "Smooth, wearable leather. Cardamom, jasmine sambac, and leather in refined balance.",
    fragranticaId: 50239,
  },

  // === MAISON FRANCIS KURKDJIAN ===
  "Maison Francis Kurkdjian Baccarat Rouge 540": {
    year: 2015,
    concentration: "EDP",
    perfumer: "Francis Kurkdjian",
    description: "Crystal-inspired radiance. Saffron, jasmine, and amberwood in luminous sweetness.",
    fragranticaId: 33519,
  },
  "Maison Francis Kurkdjian BR540 Extrait": {
    year: 2017,
    concentration: "Extrait",
    perfumer: "Francis Kurkdjian",
    description: "The original intensified. Deeper, sweeter, more bitter almond-forward.",
    fragranticaId: 46066,
  },
  "Maison Francis Kurkdjian Grand Soir": {
    year: 2016,
    concentration: "EDP",
    perfumer: "Francis Kurkdjian",
    description: "Warm amber opulence. Benzoin, labdanum, and vanilla in evening elegance.",
    fragranticaId: 40816,
  },

  // === PARFUMS DE MARLY ===
  "Parfums de Marly Layton": {
    year: 2016,
    concentration: "EDP",
    perfumer: "Hamid Merati-Kashani",
    description: "Apple, vanilla, and cardamom in crowd-pleasing warmth. A modern classic.",
    fragranticaId: 39314,
  },
  "Parfums de Marly Pegasus": {
    year: 2012,
    concentration: "EDP",
    perfumer: "Hamid Merati-Kashani",
    description: "Almond, vanilla, and sandalwood in creamy, powdery elegance.",
    fragranticaId: 16938,
  },
  "Parfums de Marly Herod": {
    year: 2012,
    concentration: "EDP",
    perfumer: "Hamid Merati-Kashani",
    description: "Tobacco, cinnamon, and vanilla in cozy, masculine warmth.",
    fragranticaId: 16939,
  },
  "Parfums de Marly Percival": {
    year: 2018,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Fresh, ozonic, and modern. Bergamot, musk, and lavender for everyday wear.",
    fragranticaId: 51037,
  },
  "Parfums de Marly Delina": {
    year: 2017,
    concentration: "EDP",
    perfumer: "Quentin Bisch",
    description: "Turkish rose, lychee, and vanilla in sweet, feminine luxury.",
    fragranticaId: 43871,
  },

  // === NICHE HOUSES ===
  "Xerjoff Naxos": {
    year: 2015,
    concentration: "EDP",
    perfumer: "Christian Carbonnel",
    description: "Tobacco, honey, and lavender in baroque Italian luxury. Decadent and refined.",
    fragranticaId: 30529,
  },
  "Xerjoff Erba Pura": {
    year: 2019,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Citrus fruits, orange blossom, and musk. Bright, sweet, and universally loved.",
    fragranticaId: 55157,
  },
  "Nishane Hacivat": {
    year: 2017,
    concentration: "Extrait",
    perfumer: "Jorge Lee",
    description: "Pineapple, oakmoss, and woods. Often compared to Aventus but with its own identity.",
    fragranticaId: 44174,
  },
  "Nishane Ani": {
    year: 2019,
    concentration: "Extrait",
    perfumer: "Cecile Zarokian",
    description: "Vanilla, bergamot, and cardamom in warm, unisex sweetness.",
    fragranticaId: 54785,
  },

  // === LE LABO ===
  "Le Labo Santal 33": {
    year: 2011,
    concentration: "EDP",
    perfumer: "Frank Voelkl",
    description: "The NYC elevator scent. Sandalwood, cardamom, and leather in minimalist cool.",
    fragranticaId: 12201,
  },
  "Le Labo Another 13": {
    year: 2010,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Ambroxan, musk, and jasmine in synthetic-clean modernity.",
    fragranticaId: 10131,
  },
  "Le Labo Rose 31": {
    year: 2006,
    concentration: "EDP",
    perfumer: "Daphne Bugey, Annick Menardo",
    description: "Rose with cumin, cedar, and musk. A unisex rose that leans masculine.",
    fragranticaId: 3678,
  },
  "Le Labo Bergamote 22": {
    year: 2006,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Bergamot, vetiver, and musk. Fresh, clean, and effortlessly elegant.",
    fragranticaId: 6327,
  },

  // === MAISON MARGIELA ===
  "Maison Margiela Jazz Club": {
    year: 2013,
    concentration: "EDT",
    perfumer: "Marie Salamagne",
    description: "Rum, tobacco, and vanilla in a smoky jazz bar atmosphere.",
    fragranticaId: 20541,
  },
  "Maison Margiela By the Fireplace": {
    year: 2015,
    concentration: "EDT",
    perfumer: "Marie Salamagne",
    description: "Burning wood, chestnuts, and vanilla. Hygge in a bottle.",
    fragranticaId: 31623,
  },
  "Maison Margiela Whispers in the Library": {
    year: 2017,
    concentration: "EDT",
    perfumer: "Unknown",
    description: "Pepper, cedar, and vanilla. Dusty books and quiet contemplation.",
    fragranticaId: 53537,
  },
  "Maison Margiela Coffee Break": {
    year: 2018,
    concentration: "EDT",
    perfumer: "Unknown",
    description: "Coffee, lavender, and milk. A cozy café moment.",
    fragranticaId: 55927,
  },

  // === INITIO ===
  "Initio Initio Oud for Greatness": {
    year: 2018,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Oud, saffron, and musk in bold, synthetic luxury.",
    fragranticaId: 53641,
  },
  "Initio Side Effect": {
    year: 2016,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Rum, tobacco, and vanilla in addictive sweetness.",
    fragranticaId: 42260,
  },
  "Initio Atomic Rose": {
    year: 2019,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Rose, oud, and musk in intense, modern florals.",
    fragranticaId: 57587,
  },

  // === AMOUAGE ===
  "Amouage Interlude Man": {
    year: 2012,
    concentration: "EDP",
    perfumer: "Pierre Negrin",
    description: "Incense, oregano, and oud in smoky, Middle Eastern drama.",
    fragranticaId: 15294,
  },
  "Amouage Reflection Man": {
    year: 2007,
    concentration: "EDP",
    perfumer: "Lucas Sieuzac",
    description: "Jasmine, sandalwood, and vetiver in refined, soapy elegance.",
    fragranticaId: 920,
  },
  "Amouage Journey Man": {
    year: 2014,
    concentration: "EDP",
    perfumer: "Annick Menardo",
    description: "Cardamom, incense, and tobacco. Spicy, smoky, and adventurous.",
    fragranticaId: 25251,
  },
  "Amouage Memoir Man": {
    year: 2010,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Incense, wormwood, and labdanum in dark, gothic complexity.",
    fragranticaId: 10145,
  },

  // === DESIGNER CLASSICS ===
  "Giorgio Armani Acqua di Gio Profumo": {
    year: 2015,
    concentration: "EDP",
    perfumer: "Alberto Morillas",
    description: "The original elevated. Aquatic freshness meets amber depth.",
    fragranticaId: 29727,
  },
  "Jean Paul Gaultier Le Male": {
    year: 1995,
    concentration: "EDT",
    perfumer: "Francis Kurkdjian",
    description: "Lavender, mint, and vanilla in a cultural icon. The blue bottle legend.",
    fragranticaId: 430,
  },
  "Jean Paul Gaultier Ultra Male": {
    year: 2015,
    concentration: "EDT Intense",
    perfumer: "Francis Kurkdjian",
    description: "Sweeter, fruitier, more intense. Pear, vanilla, and black lavender.",
    fragranticaId: 30947,
  },
  "Jean Paul Gaultier Le Male Le Parfum": {
    year: 2020,
    concentration: "EDP",
    perfumer: "Quentin Bisch",
    description: "The warmest Le Male. Cardamom, lavender, and vanilla in oriental depth.",
    fragranticaId: 61856,
  },
  "Versace Versace Eros": {
    year: 2012,
    concentration: "EDT",
    perfumer: "Aurelien Guichard",
    description: "Mint, green apple, and vanilla. Fresh, sweet, and attention-grabbing.",
    fragranticaId: 16657,
  },
  "Versace Dylan Blue": {
    year: 2016,
    concentration: "EDT",
    perfumer: "Alberto Morillas",
    description: "Aquatic, citrus, and ambroxan. Clean, modern, and universally safe.",
    fragranticaId: 40031,
  },
  "Paco Rabanne 1 Million": {
    year: 2008,
    concentration: "EDT",
    perfumer: "Christophe Raynaud, Olivier Pescheux, Michel Girard",
    description: "Blood mandarin, cinnamon, and leather. Sweet, spicy, and unmistakably bold.",
    fragranticaId: 3747,
  },
  "Paco Rabanne Invictus": {
    year: 2013,
    concentration: "EDT",
    perfumer: "Anne Flipo, Dominique Ropion, Veronique Nyberg",
    description: "Grapefruit, sea salt, and ambergris. Fresh, sporty, and victorious.",
    fragranticaId: 18471,
  },
  "Viktor & Rolf Spicebomb Extreme": {
    year: 2015,
    concentration: "EDP",
    perfumer: "Nathalie Lorson",
    description: "The original amplified. Tobacco, lavender, and vanilla in winter warmth.",
    fragranticaId: 30499,
  },
  "Viktor & Rolf Flowerbomb": {
    year: 2005,
    concentration: "EDP",
    perfumer: "Olivier Polge, Carlos Benaim, Domitille Berthier",
    description: "A floral explosion. Jasmine, rose, and patchouli in feminine opulence.",
    fragranticaId: 1460,
  },
  "Dolce & Gabbana The One": {
    year: 2008,
    concentration: "EDP",
    perfumer: "Olivier Polge",
    description: "Ginger, tobacco, and amber. Warm, spicy, and undeniably sophisticated.",
    fragranticaId: 2056,
  },
  "Lancôme La Vie Est Belle": {
    year: 2012,
    concentration: "EDP",
    perfumer: "Olivier Polge, Dominique Ropion, Anne Flipo",
    description: "Iris, praline, and vanilla. Sweet, elegant, and life-affirming.",
    fragranticaId: 14982,
  },
  "Carolina Herrera Good Girl": {
    year: 2016,
    concentration: "EDP",
    perfumer: "Louise Turner",
    description: "Jasmine, tonka bean, and cocoa in duality. Good and bad in one bottle.",
    fragranticaId: 39681,
  },
  "Kilian Love, Don't Be Shy": {
    year: 2007,
    concentration: "EDP",
    perfumer: "Calice Becker",
    description: "Orange blossom, marshmallow, and musk. Sugary sweetness elevated.",
    fragranticaId: 4322,
  },

  // === FREDERIC MALLE ===
  "Frederic Malle Portrait of a Lady": {
    year: 2010,
    concentration: "EDP",
    perfumer: "Dominique Ropion",
    description: "Rose, patchouli, and incense. Dark, complex, and masterfully crafted.",
    fragranticaId: 10464,
  },
  "Frederic Malle The Night": {
    year: 2014,
    concentration: "EDP",
    perfumer: "Dominique Ropion",
    description: "Rose, cumin, and oud. An Arabian night in olfactory form.",
    fragranticaId: 28407,
  },

  // === PRADA ===
  "Prada Luna Rossa Carbon": {
    year: 2017,
    concentration: "EDT",
    perfumer: "Daniela Roche-Andrier",
    description: "Lavender, metallic notes, and ambroxan. Sauvage's sleek Italian cousin.",
    fragranticaId: 43402,
  },
  "Prada Luna Rossa Black": {
    year: 2018,
    concentration: "EDP",
    perfumer: "Daniela Andrier",
    description: "Iris, coumarin, and sandalwood. Darker, sweeter, more intense.",
    fragranticaId: 48682,
  },

  // === GUERLAIN ===
  "Guerlain L'Homme Ideal": {
    year: 2014,
    concentration: "EDT",
    perfumer: "Thierry Wasser",
    description: "Almond, cherry, and leather. The ideal gentleman, according to Guerlain.",
    fragranticaId: 37735,
  },

  // === AFNAN ===
  "Afnan 9 PM Night Out": {
    year: 2023,
    concentration: "EDP",
    perfumer: "Unknown",
    description: "Sweet, boozy, and unapologetically clone-inspired. Rum, vanilla, and praline at an accessible price.",
    fragranticaId: 82046,
  },

  // === AZZARO ===
  "Azzaro Wanted by Night": {
    year: 2018,
    concentration: "EDP",
    perfumer: "Fabrice Pellegrin",
    description: "Cinnamon, tobacco, and cedar. Nighttime warmth at a great value.",
    fragranticaId: 49144,
  },
  "Azzaro The Most Wanted": {
    year: 2021,
    concentration: "EDP",
    perfumer: "Michel Almairac, Nathalie Lorson",
    description: "Lavender, toffee, and woody notes. Intensely sweet and addictive.",
    fragranticaId: 73664,
  },
};

async function main() {
  console.log('\n🔄 Populating fragrance metadata...\n');

  const fragrancesRef = db.collection('fragrances');
  const snapshot = await fragrancesRef.get();

  if (snapshot.empty) {
    console.log('❌ No fragrances found in database. Run seed script first.');
    return;
  }

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const key = `${data.brand} ${data.name}`;
    const metadata = FRAGRANCE_METADATA[key];

    if (metadata) {
      // Check if already has metadata
      if (data.fragranticaId && data.year && data.description) {
        console.log(`⏭️  ${key} (already has metadata)`);
        skipped++;
        continue;
      }

      await doc.ref.update({
        ...metadata,
        updatedAt: Timestamp.now(),
      });
      console.log(`✅ ${key}`);
      updated++;
    } else {
      console.log(`❌ ${key} (no metadata defined)`);
      notFound++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   No metadata: ${notFound}`);
  console.log(`\n✅ Done!`);
}

main().catch(console.error);
