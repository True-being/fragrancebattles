import { ELO_K } from "@/types";

/**
 * Calculate expected score for player A against player B
 * Using standard Elo formula: Ea = 1 / (1 + 10^((Rb - Ra)/400))
 */
export function calculateExpected(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Update ratings after a match
 * @param ratingA - Current rating of player A
 * @param ratingB - Current rating of player B
 * @param aWins - True if A won, false if B won
 * @returns Object with new ratings for both players
 */
export function updateRatings(
  ratingA: number,
  ratingB: number,
  aWins: boolean
): { newRatingA: number; newRatingB: number } {
  const expectedA = calculateExpected(ratingA, ratingB);
  const expectedB = 1 - expectedA;

  const scoreA = aWins ? 1 : 0;
  const scoreB = aWins ? 0 : 1;

  const newRatingA = Math.round(ratingA + ELO_K * (scoreA - expectedA));
  const newRatingB = Math.round(ratingB + ELO_K * (scoreB - expectedB));

  return { newRatingA, newRatingB };
}

/**
 * Check if a result is an upset (lower-rated player won)
 */
export function isUpset(
  winnerEloBefore: number,
  loserEloBefore: number
): boolean {
  return winnerEloBefore < loserEloBefore;
}

/**
 * Calculate the magnitude of an upset
 * Returns a value from 0 (no upset) to 1+ (major upset)
 */
export function upsetMagnitude(
  winnerEloBefore: number,
  loserEloBefore: number
): number {
  if (winnerEloBefore >= loserEloBefore) return 0;
  return (loserEloBefore - winnerEloBefore) / 200;
}

/**
 * Get Elo difference between two ratings
 */
export function eloDifference(ratingA: number, ratingB: number): number {
  return Math.abs(ratingA - ratingB);
}
