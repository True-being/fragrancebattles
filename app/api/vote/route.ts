import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { updateRatings, isUpset } from "@/lib/elo";
import { VoteRequest, VoteResponse, Arena, Battle, Fragrance } from "@/types";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { invalidateFragranceCache } from "@/app/api/rankings/search/route";

export async function POST(request: NextRequest) {
  try {
    const body: VoteRequest = await request.json();
    const { battleId, winnerId, sessionId } = body;

    // Validate input
    if (!battleId || !winnerId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: battleId, winnerId, sessionId" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    // Use a transaction to ensure consistency
    const result = await db.runTransaction(async (transaction) => {
      // 1. Read battle document
      const battleRef = db.collection("battles").doc(battleId);
      const battleDoc = await transaction.get(battleRef);

      if (!battleDoc.exists) {
        throw new Error("Battle not found");
      }

      const battle = { id: battleDoc.id, ...battleDoc.data() } as Battle;

      // 2. Check if already voted (idempotency)
      if (battle.winnerId !== null) {
        throw new Error("Battle already decided");
      }

      // 3. Validate winner is part of this battle
      if (winnerId !== battle.aId && winnerId !== battle.bId) {
        throw new Error("Invalid winner - not part of this battle");
      }

      const loserId = winnerId === battle.aId ? battle.bId : battle.aId;
      const arena = battle.arena as Arena;

      // 4. Read both fragrance documents
      const winnerRef = db.collection("fragrances").doc(winnerId);
      const loserRef = db.collection("fragrances").doc(loserId);

      // Also read session document (all reads must happen before writes)
      const sessionRef = db.collection("sessions").doc(sessionId);

      const [winnerDoc, loserDoc, sessionDoc] = await Promise.all([
        transaction.get(winnerRef),
        transaction.get(loserRef),
        transaction.get(sessionRef),
      ]);

      if (!winnerDoc.exists || !loserDoc.exists) {
        throw new Error("Fragrance not found");
      }

      const winner = { id: winnerDoc.id, ...winnerDoc.data() } as Fragrance;
      const loser = { id: loserDoc.id, ...loserDoc.data() } as Fragrance;

      const winnerEloBefore = winner.elo[arena];
      const loserEloBefore = loser.elo[arena];

      // 5. Compute Elo updates
      const { newRatingA: winnerNewElo, newRatingB: loserNewElo } =
        updateRatings(winnerEloBefore, loserEloBefore, true);

      // 6. Update battle document
      transaction.update(battleRef, {
        winnerId,
        aEloAfter: winnerId === battle.aId ? winnerNewElo : loserNewElo,
        bEloAfter: winnerId === battle.bId ? winnerNewElo : loserNewElo,
      });

      // 7. Update winner fragrance
      transaction.update(winnerRef, {
        [`elo.${arena}`]: winnerNewElo,
        [`stats.battles.${arena}`]: FieldValue.increment(1),
        [`stats.wins.${arena}`]: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      });

      // 8. Update loser fragrance
      transaction.update(loserRef, {
        [`elo.${arena}`]: loserNewElo,
        [`stats.battles.${arena}`]: FieldValue.increment(1),
        updatedAt: Timestamp.now(),
      });

      // 9. Write vote document
      const voteRef = db.collection("votes").doc();
      transaction.set(voteRef, {
        battleId,
        arena,
        winnerId,
        loserId,
        sessionId,
        createdAt: Timestamp.now(),
      });

      // 10. Update session vote counters
      if (sessionDoc.exists) {
        transaction.update(sessionRef, {
          lastSeenAt: Timestamp.now(),
          votesLastHour: FieldValue.increment(1),
          votesLastDay: FieldValue.increment(1),
        });
      } else {
        transaction.set(sessionRef, {
          createdAt: Timestamp.now(),
          lastSeenAt: Timestamp.now(),
          recentPairKeys: [],
          votesLastHour: 1,
          votesLastDay: 1,
        });
      }

      // Return data for response
      return {
        isUpset: isUpset(winnerEloBefore, loserEloBefore),
        winnerNewElo,
        loserNewElo,
        winnerEloBefore,
        loserEloBefore,
        winnerName: winner.name,
      };
    });

    // Invalidate fragrance cache after vote
    invalidateFragranceCache();

    const response: VoteResponse = {
      success: true,
      isUpset: result.isUpset,
      winnerNewElo: result.winnerNewElo,
      loserNewElo: result.loserNewElo,
      rankMovement: {
        winner: result.winnerNewElo - result.winnerEloBefore,
        loser: result.loserNewElo - result.loserEloBefore,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing vote:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "Battle not found" || message === "Fragrance not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (
      message === "Battle already decided" ||
      message === "Invalid winner - not part of this battle"
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
