import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  Arena,
  Fragrance,
  generatePairKey,
  DEFAULT_ELO,
} from "@/types";
import { eloDifference } from "./elo";

const POOL_SIZE = 30;
const MAX_RECENT_PAIRS = 30;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute cache - reduces reads significantly

interface MatchmakingResult {
  fragranceA: Fragrance;
  fragranceB: Fragrance;
}

// In-memory cache for fragrance pools (reduces reads significantly)
const poolCache = new Map<string, { fragrances: Fragrance[]; expires: number }>();

/**
 * Get recent pair keys for a session to avoid repeats
 */
async function getRecentPairs(sessionId: string): Promise<string[]> {
  const db = getAdminFirestore();
  const sessionRef = db.collection("sessions").doc(sessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    return [];
  }

  return sessionDoc.data()?.recentPairKeys || [];
}

/**
 * Update session with new pair key
 */
async function addRecentPair(
  sessionId: string,
  pairKey: string
): Promise<void> {
  const db = getAdminFirestore();
  const sessionRef = db.collection("sessions").doc(sessionId);
  const { Timestamp, FieldValue } = await import("firebase-admin/firestore");

  await db.runTransaction(async (transaction) => {
    const sessionDoc = await transaction.get(sessionRef);

    if (!sessionDoc.exists) {
      // Create new session
      transaction.set(sessionRef, {
        createdAt: Timestamp.now(),
        lastSeenAt: Timestamp.now(),
        recentPairKeys: [pairKey],
        votesLastHour: 0,
        votesLastDay: 0,
      });
    } else {
      const recentPairs: string[] =
        sessionDoc.data()?.recentPairKeys || [];
      
      // Add new pair and cap at MAX_RECENT_PAIRS
      const updatedPairs = [pairKey, ...recentPairs].slice(
        0,
        MAX_RECENT_PAIRS
      );

      transaction.update(sessionRef, {
        lastSeenAt: Timestamp.now(),
        recentPairKeys: updatedPairs,
      });
    }
  });
}

/**
 * Fetch a random pool of fragrances for an arena using randomOrder field
 * Uses random start point with wrap-around for sampling across entire collection
 * 
 * Each cache expiration picks a NEW random slice of the collection.
 * Within a cache window (1 min), battles come from that slice for efficiency.
 */
async function fetchFragrancePool(
  arena: Arena,
  limit: number = POOL_SIZE
): Promise<Fragrance[]> {
  const cacheKey = arena;
  const cached = poolCache.get(cacheKey);
  
  // Return cached pool if still valid
  if (cached && cached.expires > Date.now()) {
    const shuffled = [...cached.fragrances].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  // Cache expired or doesn't exist - pick a NEW random start point
  const randomStart = Math.random();
  
  const db = getAdminFirestore();
  const fragrancesRef = db.collection("fragrances");
  const targetSize = 200; // Pool size to cache

  // Query starting from random point in randomOrder
  const snapshot = await fragrancesRef
    .where(`arenas.${arena}`, "==", true)
    .orderBy("randomOrder")
    .startAt(randomStart)
    .limit(targetSize)
    .get();

  let fragrances: Fragrance[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Fragrance[];

  // Wrap around if we didn't get enough (hit end of collection)
  if (fragrances.length < targetSize) {
    const remaining = targetSize - fragrances.length;
    const wrapSnapshot = await fragrancesRef
      .where(`arenas.${arena}`, "==", true)
      .orderBy("randomOrder")
      .limit(remaining)
      .get();

    const wrapFragrances: Fragrance[] = wrapSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Fragrance[];

    // Dedupe in case of overlap
    const existingIds = new Set(fragrances.map((f) => f.id));
    for (const f of wrapFragrances) {
      if (!existingIds.has(f.id)) {
        fragrances.push(f);
      }
    }
  }

  if (fragrances.length === 0) {
    return [];
  }

  // Cache the pool - when this expires, we'll pick a new random slice
  poolCache.set(cacheKey, {
    fragrances,
    expires: Date.now() + CACHE_TTL_MS,
  });

  // Shuffle and take the pool size
  const shuffled = fragrances.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

/**
 * Select two fragrances from the pool using weighted heuristics:
 * - 60%: Similar Elo (within 100 points)
 * - 25%: Upset potential (lower vs higher Elo)
 * - 15%: Popular vs obscure (high battles vs low battles)
 */
function selectPair(
  pool: Fragrance[],
  arena: Arena,
  recentPairKeys: string[]
): MatchmakingResult | null {
  if (pool.length < 2) return null;

  const rand = Math.random();
  let candidates: [Fragrance, Fragrance][] = [];

  if (rand < 0.6) {
    // Similar Elo matchup (60% of the time)
    candidates = findSimilarEloPairs(pool, arena);
  } else if (rand < 0.85) {
    // Upset potential (25% of the time)
    candidates = findUpsetPotentialPairs(pool, arena);
  } else {
    // Popular vs obscure (15% of the time)
    candidates = findPopularObscurePairs(pool, arena);
  }

  // Filter out recent pairs
  const validCandidates = candidates.filter(([a, b]) => {
    const pairKey = generatePairKey(arena, a.id, b.id);
    return !recentPairKeys.includes(pairKey);
  });

  // If no valid candidates, fall back to random selection
  if (validCandidates.length === 0) {
    return selectRandomPair(pool, arena, recentPairKeys);
  }

  // Pick random from valid candidates
  const [fragranceA, fragranceB] =
    validCandidates[Math.floor(Math.random() * validCandidates.length)];

  return { fragranceA, fragranceB };
}

/**
 * Find pairs with similar Elo ratings
 */
function findSimilarEloPairs(
  pool: Fragrance[],
  arena: Arena
): [Fragrance, Fragrance][] {
  const pairs: [Fragrance, Fragrance][] = [];
  const threshold = 100;

  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const eloA = pool[i].elo[arena] || DEFAULT_ELO;
      const eloB = pool[j].elo[arena] || DEFAULT_ELO;

      if (eloDifference(eloA, eloB) <= threshold) {
        pairs.push([pool[i], pool[j]]);
      }
    }
  }

  return pairs;
}

/**
 * Find pairs with upset potential (significant Elo gap)
 */
function findUpsetPotentialPairs(
  pool: Fragrance[],
  arena: Arena
): [Fragrance, Fragrance][] {
  const pairs: [Fragrance, Fragrance][] = [];
  const minGap = 100;
  const maxGap = 300;

  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const eloA = pool[i].elo[arena] || DEFAULT_ELO;
      const eloB = pool[j].elo[arena] || DEFAULT_ELO;
      const gap = eloDifference(eloA, eloB);

      if (gap >= minGap && gap <= maxGap) {
        pairs.push([pool[i], pool[j]]);
      }
    }
  }

  return pairs;
}

/**
 * Find pairs where one has many battles and one has few
 */
function findPopularObscurePairs(
  pool: Fragrance[],
  arena: Arena
): [Fragrance, Fragrance][] {
  const sorted = [...pool].sort((a, b) => {
    const battlesA = a.stats?.battles?.[arena] || 0;
    const battlesB = b.stats?.battles?.[arena] || 0;
    return battlesB - battlesA;
  });

  const pairs: [Fragrance, Fragrance][] = [];
  const topThird = Math.floor(sorted.length / 3);
  const bottomThird = sorted.length - topThird;

  for (let i = 0; i < topThird; i++) {
    for (let j = bottomThird; j < sorted.length; j++) {
      pairs.push([sorted[i], sorted[j]]);
    }
  }

  return pairs;
}

/**
 * Fallback: select a random pair avoiding recent matchups
 */
function selectRandomPair(
  pool: Fragrance[],
  arena: Arena,
  recentPairKeys: string[]
): MatchmakingResult | null {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i++) {
    for (let j = i + 1; j < shuffled.length; j++) {
      const pairKey = generatePairKey(arena, shuffled[i].id, shuffled[j].id);
      if (!recentPairKeys.includes(pairKey)) {
        return { fragranceA: shuffled[i], fragranceB: shuffled[j] };
      }
    }
  }

  // Last resort: just pick any two different fragrances
  if (shuffled.length >= 2) {
    return { fragranceA: shuffled[0], fragranceB: shuffled[1] };
  }

  return null;
}

/**
 * Main matchmaking function - get next battle for a session
 */
export async function getNextBattle(
  arena: Arena,
  sessionId: string
): Promise<MatchmakingResult | null> {
  // Fetch pool of fragrances
  const pool = await fetchFragrancePool(arena);

  if (pool.length < 2) {
    console.warn(`Not enough fragrances in arena ${arena}`);
    return null;
  }

  // Get recent pairs to avoid
  const recentPairKeys = await getRecentPairs(sessionId);

  // Select pair using weighted heuristics
  const result = selectPair(pool, arena, recentPairKeys);

  if (result) {
    // Record this pair in session
    const pairKey = generatePairKey(
      arena,
      result.fragranceA.id,
      result.fragranceB.id
    );
    await addRecentPair(sessionId, pairKey);
  }

  return result;
}

export { getRecentPairs, addRecentPair };
