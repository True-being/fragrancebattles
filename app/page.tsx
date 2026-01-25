"use client";

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import ArenaSelector from "@/components/ArenaSelector";
import FragranceCard from "@/components/FragranceCard";
import VoteFeedback from "@/components/VoteFeedback";
import {
  Arena,
  BattleResponse,
  VoteResponse,
  FragrancePublic,
} from "@/types";

const SESSION_KEY = "fragrance_arena_session";

function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export default function ArenaPage() {
  const [arena, setArena] = useState<Arena>("overall");
  const [battle, setBattle] = useState<BattleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vote feedback state
  const [voteResponse, setVoteResponse] = useState<VoteResponse | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const fetchBattle = useCallback(async () => {
    setLoading(true);
    setError(null);
    setWinnerId(null);
    setVoteResponse(null);
    setShowFeedback(false);

    try {
      const sessionId = getSessionId();
      const res = await fetch(
        `/api/battle/next?arena=${arena}&sessionId=${sessionId}`
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load battle");
      }

      const data: BattleResponse = await res.json();
      setBattle(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [arena]);

  // Fetch initial battle
  useEffect(() => {
    fetchBattle();
  }, [fetchBattle]);

  const handleVote = async (selectedWinnerId: string) => {
    if (!battle || voting) return;

    setVoting(true);
    setWinnerId(selectedWinnerId);

    try {
      const sessionId = getSessionId();
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battleId: battle.battleId,
          winnerId: selectedWinnerId,
          sessionId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record vote");
      }

      const data: VoteResponse = await res.json();
      setVoteResponse(data);
      setShowFeedback(true);

      // Show feedback for 1.2s then load next battle
      setTimeout(() => {
        setShowFeedback(false);
        setVoting(false);
        fetchBattle();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to vote");
      setVoting(false);
      setWinnerId(null);
    }
  };

  const handleArenaChange = (newArena: Arena) => {
    setArena(newArena);
  };

  const getWinnerName = (): string => {
    if (!battle || !winnerId) return "";
    if (winnerId === battle.fragranceA.id) return battle.fragranceA.name;
    return battle.fragranceB.name;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="py-12 text-center">
        <h1 className="font-display text-5xl md:text-7xl text-arena-white tracking-wider mb-4">
          TWO ENTER. ONE WINS.
        </h1>
        <p className="text-arena-light text-lg">
          Choose your favorite. Rankings update in real time.
        </p>
      </section>

      {/* Arena Selector */}
      <ArenaSelector selectedArena={arena} onSelect={handleArenaChange} />

      {/* Battle Area */}
      <section className="flex-1 flex items-center justify-center px-4 pb-16">
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-arena-border border-t-arena-accent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-arena-accent mb-4">{error}</p>
            <button onClick={fetchBattle} className="arena-btn">
              Try Again
            </button>
          </div>
        ) : battle ? (
          <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 w-full max-w-4xl">
            {/* Fragrance A */}
            <FragranceCard
              fragrance={battle.fragranceA}
              onClick={() => handleVote(battle.fragranceA.id)}
              disabled={voting}
              isWinner={winnerId === battle.fragranceA.id}
              isLoser={winnerId === battle.fragranceB.id}
            />

            {/* VS Badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex">
              <div className="w-20 h-20 flex items-center justify-center bg-arena-black border-2 border-arena-border rounded-full">
                <span className="font-display text-3xl text-arena-accent">
                  VS
                </span>
              </div>
            </div>

            {/* Mobile VS */}
            <div className="md:hidden flex items-center justify-center">
              <span className="font-display text-2xl text-arena-accent">
                VS
              </span>
            </div>

            {/* Fragrance B */}
            <FragranceCard
              fragrance={battle.fragranceB}
              onClick={() => handleVote(battle.fragranceB.id)}
              disabled={voting}
              isWinner={winnerId === battle.fragranceB.id}
              isLoser={winnerId === battle.fragranceA.id}
            />
          </div>
        ) : null}
      </section>

      {/* Vote Feedback */}
      {voteResponse && (
        <VoteFeedback
          response={voteResponse}
          winnerName={getWinnerName()}
          visible={showFeedback}
        />
      )}
    </div>
  );
}
