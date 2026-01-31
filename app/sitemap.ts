import { MetadataRoute } from "next";
import { getAdminFirestore } from "@/lib/firebase/admin";

const BASE_URL = "https://fragrancebattles.com";
const URLS_PER_SITEMAP = 45000; // Stay under Google's 50k limit

// Rebuild sitemap once per day
export const revalidate = 86400;

/**
 * Generate sitemap index entries for dynamic sitemap generation
 * Next.js will create /sitemap/0.xml, /sitemap/1.xml, etc.
 * 
 * Hardcoded sitemap count to avoid Firestore reads on every request.
 * Update NUM_SITEMAPS when collection grows beyond current capacity.
 * Current: ~89k fragrances = 2 sitemaps (static pages + brands fit in first)
 */
export async function generateSitemaps() {
  const NUM_SITEMAPS = 2;
  return Array.from({ length: NUM_SITEMAPS }, (_, i) => ({ id: i }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const db = getAdminFirestore();
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
    
    // Fetch brands from dedicated collection (much smaller than fragrances)
    // If brands collection doesn't exist, skip brand URLs
    try {
      const brandsSnapshot = await db.collection("brands").orderBy("slug").get();
      for (const doc of brandsSnapshot.docs) {
        const data = doc.data();
        allUrls.push({
          url: `${BASE_URL}/brand/${data.slug}`,
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.7,
        });
      }
    } catch {
      // brands collection doesn't exist yet, skip
    }
  }
  
  // Paginate fragrances using offset/limit to avoid reading entire collection
  const offset = id === 0 ? 0 : (id - 1) * URLS_PER_SITEMAP + (URLS_PER_SITEMAP - allUrls.length);
  const limit = URLS_PER_SITEMAP - allUrls.length;
  
  if (limit > 0) {
    const fragrancesSnapshot = await db
      .collection("fragrances")
      .select("slug", "updatedAt")
      .orderBy("slug")
      .offset(offset)
      .limit(limit)
      .get();
    
    for (const doc of fragrancesSnapshot.docs) {
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
