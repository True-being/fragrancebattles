import type { ArenaFlags } from "@/types";

export interface FragranticaData {
  id: number;
  name: string;
  brand: string;
  imageUrl: string;
  arenas: ArenaFlags;
}

export interface ParsedUrl {
  id: number;
  brand: string;
  name: string;
}

/**
 * Convert a URL slug to a readable name
 * e.g., "Tom-Ford" -> "Tom Ford", "L-Homme" -> "L'Homme"
 */
function slugToName(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    // Handle common patterns like "L Homme" -> "L'Homme"
    .replace(/\bL\s+/gi, "L'")
    .replace(/\bD\s+/gi, "D'");
}

/**
 * Parse a Fragrantica URL to extract the fragrance ID, brand, and name
 * URL format: https://www.fragrantica.com/perfume/Brand-Name/Fragrance-Name-12345.html
 */
export function parseFragranticaUrl(url: string): ParsedUrl | null {
  try {
    const urlObj = new URL(url);

    // Validate domain
    if (
      !urlObj.hostname.includes("fragrantica.com") &&
      !urlObj.hostname.includes("fragrantica.ru")
    ) {
      return null;
    }

    // Extract path: /perfume/Brand/Name-ID.html
    const match = urlObj.pathname.match(
      /\/perfume\/([^/]+)\/([^/]+)-(\d+)\.html$/i
    );

    if (!match) {
      return null;
    }

    const [, brandSlug, nameSlug, idStr] = match;
    const id = parseInt(idStr, 10);

    if (isNaN(id)) {
      return null;
    }

    return {
      id,
      brand: slugToName(brandSlug),
      name: slugToName(nameSlug),
    };
  } catch {
    return null;
  }
}

/**
 * Get the direct image URL for a fragrance by ID
 */
export function getFragranticaImageUrl(id: number): string {
  return `https://fimgs.net/mdimg/perfume/375x500.${id}.jpg`;
}

/**
 * Extract fragrance data from a Fragrantica URL (no scraping needed)
 */
export function extractFragranceFromUrl(
  url: string,
  arenas: ArenaFlags
): FragranticaData | null {
  const parsed = parseFragranticaUrl(url);

  if (!parsed) {
    return null;
  }

  return {
    id: parsed.id,
    name: parsed.name,
    brand: parsed.brand,
    imageUrl: getFragranticaImageUrl(parsed.id),
    arenas,
  };
}

/**
 * Generate a URL-safe slug from brand and name
 */
export function generateSlug(brand: string, name: string): string {
  return `${brand}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
