import { MetadataRoute } from "next";
import { getAdminFirestore } from "@/lib/firebase/admin";

const BASE_URL = "https://fragrancebattles.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = getAdminFirestore();

  // Fetch all fragrance slugs and updatedAt timestamps
  const fragrancesSnapshot = await db
    .collection("fragrances")
    .select("slug", "updatedAt")
    .get();

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

  return [...staticPages, ...fragranceUrls];
}
