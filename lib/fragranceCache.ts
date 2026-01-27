import type { Fragrance, Arena } from "@/types";

// Simple in-memory cache for fragrance list
let fragranceCache: Map<Arena, Fragrance[]> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute TTL

export function invalidateFragranceCache() {
  fragranceCache = null;
  cacheTimestamp = 0;
}

export function isCacheValid(): boolean {
  return fragranceCache !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

export function getCachedFragrances(arena: Arena): Fragrance[] | null {
  if (isCacheValid() && fragranceCache?.has(arena)) {
    return fragranceCache.get(arena)!;
  }
  return null;
}

export function setCachedFragrances(arena: Arena, fragrances: Fragrance[]) {
  if (!fragranceCache) {
    fragranceCache = new Map();
  }
  fragranceCache.set(arena, fragrances);
  cacheTimestamp = Date.now();
}
