import { Fragrance, RankedFragrance } from "@/types";

const BASE_URL = "https://fragrancebattles.com";

/**
 * Slugify a string for URL use
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Format a note name for display (capitalize, handle underscores)
 */
export function formatNoteName(note: string): string {
  return note
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get the image path for a note
 */
export function getNoteImagePath(note: string): string {
  const slug = note.toLowerCase().replace(/\s+/g, "_");
  return `/note-images-optimized/${slug}.webp`;
}

/**
 * Generate Brand Organization JSON-LD
 */
export function generateBrandJsonLd(
  brand: string,
  brandSlug: string,
  fragrances: RankedFragrance[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: brand,
    url: `${BASE_URL}/brand/${brandSlug}`,
    ...(fragrances.length > 0 && {
      hasProduct: fragrances.slice(0, 10).map((f) => ({
        "@type": "Product",
        name: f.name,
        url: `${BASE_URL}/fragrance/${f.slug}`,
        image: f.imageUrl,
      })),
    }),
  };
}

/**
 * Generate ItemList JSON-LD for ranked fragrances
 */
export function generateItemListJsonLd(
  listName: string,
  fragrances: RankedFragrance[],
  listUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    url: `${BASE_URL}${listUrl}`,
    numberOfItems: fragrances.length,
    itemListElement: fragrances.slice(0, 20).map((f, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: `${f.name} by ${f.brand}`,
        url: `${BASE_URL}/fragrance/${f.slug}`,
        image: f.imageUrl,
      },
    })),
  };
}

/**
 * Generate BreadcrumbList JSON-LD
 */
export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

/**
 * Extract all unique notes from fragrances
 */
export function extractAllNotes(fragrances: Fragrance[]): string[] {
  const noteSet = new Set<string>();

  for (const f of fragrances) {
    if (f.notes?.top) f.notes.top.forEach((n) => noteSet.add(n.toLowerCase()));
    if (f.notes?.middle)
      f.notes.middle.forEach((n) => noteSet.add(n.toLowerCase()));
    if (f.notes?.base) f.notes.base.forEach((n) => noteSet.add(n.toLowerCase()));
    if (f.notes?.all) f.notes.all.forEach((n) => noteSet.add(n.toLowerCase()));
  }

  return Array.from(noteSet).sort();
}

/**
 * Extract all unique brands from fragrances
 */
export function extractAllBrands(
  fragrances: Fragrance[]
): { name: string; slug: string; count: number }[] {
  const brandMap = new Map<string, number>();

  for (const f of fragrances) {
    const count = brandMap.get(f.brand) || 0;
    brandMap.set(f.brand, count + 1);
  }

  return Array.from(brandMap.entries())
    .map(([name, count]) => ({
      name,
      slug: slugify(name),
      count,
    }))
    .sort((a, b) => b.count - a.count);
}
