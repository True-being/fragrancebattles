import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getNextBattle } from "@/lib/matchmaking";
import { Arena, ARENAS, BattleResponse, FragrancePublic } from "@/types";
import { Timestamp } from "firebase-admin/firestore";

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

    // Create battle document
    const db = getAdminFirestore();
    const battleRef = db.collection("battles").doc();

    const battleDoc = {
      arena,
      aId: fragranceA.id,
      bId: fragranceB.id,
      aEloBefore: fragranceA.elo[arena],
      bEloBefore: fragranceB.elo[arena],
      aEloAfter: null,
      bEloAfter: null,
      winnerId: null,
      createdAt: Timestamp.now(),
    };

    await battleRef.set(battleDoc);

    // Format response
    const response: BattleResponse = {
      battleId: battleRef.id,
      arena,
      fragranceA: {
        id: fragranceA.id,
        name: fragranceA.name,
        brand: fragranceA.brand,
        slug: fragranceA.slug,
        imageUrl: fragranceA.imageUrl,
        year: fragranceA.year,
      } as FragrancePublic,
      fragranceB: {
        id: fragranceB.id,
        name: fragranceB.name,
        brand: fragranceB.brand,
        slug: fragranceB.slug,
        imageUrl: fragranceB.imageUrl,
        year: fragranceB.year,
      } as FragrancePublic,
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
