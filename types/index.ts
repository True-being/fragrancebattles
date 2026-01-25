import { Timestamp } from "firebase-admin/firestore";

// Arena types
export type Arena = "overall" | "masculine" | "feminine" | "unisex";

export const ARENAS: Arena[] = ["overall", "masculine", "feminine", "unisex"];

export const ARENA_LABELS: Record<Arena, string> = {
  overall: "Overall",
  masculine: "Masculine",
  feminine: "Feminine",
  unisex: "Unisex",
};

// Elo per arena
export interface ArenaElo {
  overall: number;
  masculine: number;
  feminine: number;
  unisex: number;
}

// Arena membership flags
export interface ArenaFlags {
  overall: boolean;
  masculine: boolean;
  feminine: boolean;
  unisex: boolean;
}

// Stats counters per arena
export interface ArenaStats {
  battles: ArenaElo;
  wins: ArenaElo;
}

// Main Fragrance document
export interface Fragrance {
  id: string;
  name: string;
  brand: string;
  slug: string;
  imageUrl: string;
  arenas: ArenaFlags;
  elo: ArenaElo;
  stats: ArenaStats;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Fragrance without id (for creation)
export type FragranceInput = Omit<Fragrance, "id">;

// Battle document
export interface Battle {
  id: string;
  arena: Arena;
  aId: string;
  bId: string;
  aEloBefore: number;
  bEloBefore: number;
  aEloAfter: number | null;
  bEloAfter: number | null;
  winnerId: string | null;
  createdAt: Timestamp;
}

export type BattleInput = Omit<Battle, "id">;

// Vote document
export interface Vote {
  id: string;
  battleId: string;
  arena: Arena;
  winnerId: string;
  loserId: string;
  sessionId: string;
  createdAt: Timestamp;
}

export type VoteInput = Omit<Vote, "id">;

// Session document (for rate limiting and anti-repeat)
export interface Session {
  id: string;
  createdAt: Timestamp;
  lastSeenAt: Timestamp;
  recentPairKeys: string[]; // e.g. ["overall|idA|idB", ...]
  votesLastHour: number;
  votesLastDay: number;
}

// API Response types
export interface BattleResponse {
  battleId: string;
  arena: Arena;
  fragranceA: FragrancePublic;
  fragranceB: FragrancePublic;
}

export interface FragrancePublic {
  id: string;
  name: string;
  brand: string;
  slug: string;
  imageUrl: string;
}

export interface VoteRequest {
  battleId: string;
  winnerId: string;
  sessionId: string;
}

export interface VoteResponse {
  success: boolean;
  isUpset: boolean;
  winnerNewElo: number;
  loserNewElo: number;
  rankMovement?: {
    winner: number;
    loser: number;
  };
  agreePercent?: number;
  streak?: {
    fragrance: string;
    type: "win" | "loss";
    count: number;
  };
}

// Rankings display
export interface RankedFragrance {
  rank: number;
  id: string;
  name: string;
  brand: string;
  slug: string;
  imageUrl: string;
  elo: number;
  winRate: number;
  battles: number;
  movement?: "up" | "down" | "stable";
}

// Fragrance detail stats
export interface FragranceDetail extends FragrancePublic {
  arenas: ArenaFlags;
  stats: {
    arena: Arena;
    elo: number;
    rank: number;
    battles: number;
    wins: number;
    winRate: number;
  }[];
  oftenBeats: FragrancePublic[];
  oftenLosesTo: FragrancePublic[];
}

// Utility function to generate pair key for anti-repeat
export function generatePairKey(
  arena: Arena,
  idA: string,
  idB: string
): string {
  const [first, second] = [idA, idB].sort();
  return `${arena}|${first}|${second}`;
}

// Default Elo for new fragrances
export const DEFAULT_ELO = 1500;

// Elo K-factor
export const ELO_K = 24;
