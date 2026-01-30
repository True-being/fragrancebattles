import { MetadataRoute } from "next";
import * as fs from "fs";
import * as path from "path";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { slugify } from "@/lib/seo";

const BASE_URL = "https://fragrancebattles.com";

/**
 * Get all available notes from the image directory
 */
function getAvailableNotes(): string[] {
  try {
    const notesDir = path.join(process.cwd(), "public", "note-images-optimized");
    const files = fs.readdirSync(notesDir);
    return files
      .filter((f) => f.endsWith(".webp"))
      .map((f) => f.replace(".webp", "").replace(/_/g, "-"));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = getAdminFirestore();

  // Fetch all fragrance data
  const fragrancesSnapshot = await db
    .collection("fragrances")
    .select("slug", "brand", "updatedAt")
    .get();

  // Fragrance pages
  const fragranceUrls: MetadataRoute.Sitemap = fragrancesSnapshot.docs.map(
    (doc) => {
      const data = doc.data();
      return {
        url: `${BASE_URL}/fragrance/${data.slug}`,
        lastModified: data.updatedAt?.toDate() || new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      };
    }
  );

  // Extract unique brands
  const brandSet = new Map<string, string>();
  for (const doc of fragrancesSnapshot.docs) {
    const brand = doc.data().brand as string;
    if (brand && !brandSet.has(brand)) {
      brandSet.set(brand, slugify(brand));
    }
  }

  // Brand pages
  const brandUrls: MetadataRoute.Sitemap = Array.from(brandSet.values()).map(
    (brandSlug) => ({
      url: `${BASE_URL}/brand/${brandSlug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })
  );

  // Note pages
  const notes = getAvailableNotes();
  const noteUrls: MetadataRoute.Sitemap = notes.map((noteSlug) => ({
    url: `${BASE_URL}/notes/${noteSlug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
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
    },
  ];

  return [...staticPages, ...brandUrls, ...noteUrls, ...fragranceUrls];
}
