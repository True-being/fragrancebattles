import { NextRequest, NextResponse } from "next/server";
import { getNextBattle } from "@/lib/matchmaking";
import { Arena, ARENAS, BattleResponse, FragrancePublic } from "@/types";
import { createHash } from "crypto";

/**
 * Generate a deterministic battle ID from the matchup
 * This allows us to defer battle document creation to the vote endpoint
 * and avoid creating orphaned documents for battles that never get voted on
 */
function generateBattleId(arena: Arena, aId: string, bId: string, timestamp: number): string {
  // Sort IDs to ensure consistency regardless of order
  const [id1, id2] = [aId, bId].sort();
  const data = `${arena}:${id1}:${id2}:${timestamp}`;
  return createHash("sha256").update(data).digest("hex").slice(0, 20);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const arena = searchParams.get("arena") as Arena;
    const sessionId = searchParams.get("sessionId");

    // Validate arena
    if (!arena || !ARENAS.includes(arena)) {
      return NextResponse.json(
        { error: "Invalid arena. Must be one of: " + ARENAS.join(", ") },
        { status: 400 }
      );
    }

    // Validate session ID
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get next matchup from matchmaking
    const matchup = await getNextBattle(arena, sessionId);

    if (!matchup) {
      return NextResponse.json(
        { error: "Not enough fragrances available for this arena" },
        { status: 503 }
      );
    }

    const { fragranceA, fragranceB } = matchup;

    // Generate a deterministic battle ID instead of creating a Firestore document
    // The battle document will be created lazily when the user actually votes
    // This avoids writes for battles that are shown but never voted on
    const battleId = generateBattleId(arena, fragranceA.id, fragranceB.id, Math.floor(Date.now() / 1000));

    // Format response
    const response: BattleResponse = {
      battleId,
      arena,
      fragranceA: {
        id: fragranceA.id,
        name: fragranceA.name,
        brand: fragranceA.brand,
        slug: fragranceA.slug,
        imageUrl: fragranceA.imageUrl,
        year: fragranceA.year,
        concentration: fragranceA.concentration,
        accords: fragranceA.accords,
        notes: fragranceA.notes,
      },
      fragranceB: {
        id: fragranceB.id,
        name: fragranceB.name,
        brand: fragranceB.brand,
        slug: fragranceB.slug,
        imageUrl: fragranceB.imageUrl,
        year: fragranceB.year,
        concentration: fragranceB.concentration,
        accords: fragranceB.accords,
        notes: fragranceB.notes,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting next battle:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
