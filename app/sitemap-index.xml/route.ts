import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

const BASE_URL = "https://fragrancebattles.com";
const URLS_PER_SITEMAP = 45000;

export async function GET() {
  const db = getAdminFirestore();
  
  // Get total fragrance count
  const countSnapshot = await db.collection("fragrances").count().get();
  const fragranceCount = countSnapshot.data().count;
  
  // Estimate total URLs
  const estimatedBrandCount = 2000;
  const staticCount = 8;
  const notesCount = 140;
  const totalUrls = staticCount + estimatedBrandCount + notesCount + fragranceCount;
  
  // Calculate number of sitemaps needed
  const numSitemaps = Math.ceil(totalUrls / URLS_PER_SITEMAP);
  
  const sitemapEntries = Array.from({ length: numSitemaps }, (_, i) => {
    return `  <sitemap>
    <loc>${BASE_URL}/sitemap/${i}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`;
  }).join("\n");
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
