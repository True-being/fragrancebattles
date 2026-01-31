import { NextResponse } from "next/server";

const BASE_URL = "https://fragrancebattles.com";

// Known sitemap count - update when collection grows significantly
// With 89k fragrances + 2k brands + 140 notes = ~91k URLs = 3 sitemaps at 45k each
// This avoids a Firestore count query on every request
const NUM_SITEMAPS = 3;

export async function GET() {
  const sitemapEntries = Array.from({ length: NUM_SITEMAPS }, (_, i) => {
    return `  <sitemap>
    <loc>${BASE_URL}/sitemap/${i}.xml</loc>
  </sitemap>`;
  }).join("\n");
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      // Cache for 24 hours - sitemap index rarely changes
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
