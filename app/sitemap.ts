import { MetadataRoute } from "next";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { slugify } from "@/lib/seo";

const BASE_URL = "https://fragrancebattles.com";
const URLS_PER_SITEMAP = 45000; // Stay under Google's 50k limit

// Rebuild sitemap once per day - Google doesn't need real-time updates
// This reduces 89k reads per request to 89k reads per day
export const revalidate = 86400;

// Hardcoded notes list (avoids filesystem access issues in production)
const AVAILABLE_NOTES = [
  "almond", "amber", "ambergris", "anise", "apple", "apricot", "aquatic", "artemisia",
  "bamboo", "basil", "bay-leaf", "bay", "benzoin", "bergamot", "birch-tar", "birch",
  "black-currant", "black-pepper", "blackberry", "blackcurrant", "blood-orange", "bourbon",
  "caramel", "cardamom", "carnation", "cashmere", "cassis", "castoreum", "cedar", "champagne",
  "cherry", "chocolate", "cinnamon", "citron", "civet", "clove", "cocoa", "coconut", "coffee",
  "cognac", "copal", "coriander", "cotton", "cucumber", "cumin", "cypress", "elemi",
  "eucalyptus", "fig", "frangipani", "frankincense", "freesia", "galbanum", "gardenia",
  "geranium", "ginger", "grapefruit", "grass", "green-notes", "green-tea", "guaiac-wood",
  "heliotrope", "honey", "incense", "iris", "ivy", "jasmine", "labdanum", "lavender",
  "leather", "lemon", "lily-of-the-valley", "lily", "lime", "lychee", "magnolia", "mandarin",
  "mango", "maple", "marine", "melon", "mimosa", "mint", "musk", "myrrh", "neroli", "nutmeg",
  "oakmoss", "ocean", "opoponax", "orange-blossom", "orange", "orchid", "oud", "ozone",
  "passionfruit", "patchouli", "peach", "pear", "peony", "pepper", "peppermint", "petit-grain",
  "pine", "pineapple", "pink-pepper", "plum", "pomegranate", "powder", "powdery-notes",
  "praline", "raspberry", "rose", "rosemary", "rum", "saffron", "sage", "sandalwood",
  "sea-notes", "sea-salt", "seaweed", "smoke", "smoky-notes", "spearmint", "star-anise",
  "strawberry", "suede", "tangerine", "tarragon", "tea", "teak", "thyme", "tobacco", "toffee",
  "tonka-bean", "tonka", "tuberose", "vanilla", "vetiver", "violet", "water-notes",
  "watermelon", "whiskey", "white-musk", "wine", "ylang-ylang", "yuzu"
];

/**
 * Generate sitemap index entries for dynamic sitemap generation
 * Next.js will create /sitemap/0.xml, /sitemap/1.xml, etc.
 * 
 * Hardcoded sitemap count to avoid Firestore reads on every request.
 * Update NUM_SITEMAPS when collection grows beyond current capacity.
 * Current: ~89k fragrances + ~2k brands + 140 notes = ~91k URLs = 3 sitemaps
 */
export async function generateSitemaps() {
  const NUM_SITEMAPS = 3;
  return Array.from({ length: NUM_SITEMAPS }, (_, i) => ({ id: i }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const db = getAdminFirestore();
  const start = id * URLS_PER_SITEMAP;
  const end = start + URLS_PER_SITEMAP;
  
  // Build all URLs in order: static, brands, notes, fragrances
  const allUrls: MetadataRoute.Sitemap = [];
  
  // Static pages (always in first sitemap)
  if (id === 0) {
    allUrls.push(
      {
        url: BASE_URL,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${BASE_URL}/rankings`,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 0.9,
      },
      {
        url: `${BASE_URL}/rankings?arena=masculine`,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 0.9,
      },
      {
        url: `${BASE_URL}/rankings?arena=feminine`,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 0.9,
      },
      {
        url: `${BASE_URL}/rankings?arena=unisex`,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 0.9,
      },
      {
        url: `${BASE_URL}/notes`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      },
      {
        url: `${BASE_URL}/about`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        url: `${BASE_URL}/privacy`,
        lastModified: new Date(),
        changeFrequency: "yearly",
        priority: 0.3,
      }
    );
  }
  
  // Fetch all fragrance data (we need brands anyway)
  const fragrancesSnapshot = await db
    .collection("fragrances")
    .select("slug", "brand", "updatedAt")
    .orderBy("slug")
    .get();
  
  // Extract unique brands
  const brandSet = new Map<string, string>();
  for (const doc of fragrancesSnapshot.docs) {
    const brand = doc.data().brand as string;
    if (brand && !brandSet.has(brand)) {
      brandSet.set(brand, slugify(brand));
    }
  }
  const brandSlugs = Array.from(brandSet.values()).sort();
  
  // Calculate offsets for this sitemap chunk
  const staticCount = id === 0 ? 8 : 0;
  const brandsStart = id === 0 ? 0 : Math.max(0, start - 8);
  const brandsEnd = Math.min(brandSlugs.length, end - (id === 0 ? 8 : 0));
  
  // Add brands for this chunk
  if (brandsStart < brandSlugs.length && brandsEnd > brandsStart) {
    for (let i = brandsStart; i < brandsEnd && allUrls.length < URLS_PER_SITEMAP; i++) {
      allUrls.push({
        url: `${BASE_URL}/brand/${brandSlugs[i]}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7,
      });
    }
  }
  
  // Calculate notes offset
  const urlsBeforeNotes = 8 + brandSlugs.length;
  const notesStartGlobal = urlsBeforeNotes;
  
  if (start < notesStartGlobal + AVAILABLE_NOTES.length && end > notesStartGlobal) {
    const notesStart = Math.max(0, start - notesStartGlobal);
    const notesEnd = Math.min(AVAILABLE_NOTES.length, end - notesStartGlobal);
    
    for (let i = notesStart; i < notesEnd && allUrls.length < URLS_PER_SITEMAP; i++) {
      allUrls.push({
        url: `${BASE_URL}/notes/${AVAILABLE_NOTES[i]}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      });
    }
  }
  
  // Calculate fragrances offset
  const urlsBeforeFragrances = 8 + brandSlugs.length + AVAILABLE_NOTES.length;
  
  if (start < urlsBeforeFragrances + fragrancesSnapshot.docs.length && end > urlsBeforeFragrances) {
    const fragsStart = Math.max(0, start - urlsBeforeFragrances);
    const fragsEnd = Math.min(fragrancesSnapshot.docs.length, end - urlsBeforeFragrances);
    
    for (let i = fragsStart; i < fragsEnd && allUrls.length < URLS_PER_SITEMAP; i++) {
      const doc = fragrancesSnapshot.docs[i];
      const data = doc.data();
      allUrls.push({
        url: `${BASE_URL}/fragrance/${data.slug}`,
        lastModified: data.updatedAt?.toDate() || new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      });
    }
  }
  
  return allUrls;
}
