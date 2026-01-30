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

export default function ArenaClient() {
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
      {/* Hero Section */}
      <section className="relative py-16 md:py-20 text-center overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-arena-accent/5 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative z-10">
          {/* Expressive headline - mixed typography */}
          <h1 className="mb-6">
            <span className="block font-display text-5xl sm:text-6xl md:text-8xl text-arena-white tracking-wider text-glow-white">
              TWO ENTER.
            </span>
            <span className="block font-elegant italic text-4xl sm:text-5xl md:text-7xl text-arena-accent mt-2">
              One Wins.
            </span>
          </h1>
          <p className="font-editorial text-arena-light text-lg md:text-xl italic max-w-md mx-auto">
            Choose your favorite. Shape the rankings.
          </p>
        </div>
      </section>

      {/* Arena Selector */}
      <ArenaSelector selectedArena={arena} onSelect={handleArenaChange} />

      {/* Battle Area */}
      <section className="flex-1 flex items-center justify-center px-4 pb-20 md:pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-2 border-arena-border rounded-full" />
              <div className="absolute inset-0 border-2 border-arena-accent border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="font-modern text-arena-muted text-sm uppercase tracking-wider">Loading matchup...</p>
          </div>
        ) : error ? (
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-arena-gray border border-arena-border flex items-center justify-center">
              <svg className="w-8 h-8 text-arena-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="font-modern text-arena-light mb-6">{error}</p>
            <button onClick={fetchBattle} className="arena-btn arena-btn-primary">
              Try Again
            </button>
          </div>
        ) : battle ? (
          <div className="relative w-full max-w-5xl arena-glow">
            {/* Battle grid */}
            <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 md:gap-20">
              {/* Fragrance A */}
              <div className="w-full max-w-xs animate-fade-in">
                <FragranceCard
                  fragrance={battle.fragranceA}
                  onClick={() => handleVote(battle.fragranceA.id)}
                  disabled={voting}
                  isWinner={winnerId === battle.fragranceA.id}
                  isLoser={winnerId === battle.fragranceB.id}
                />
              </div>

              {/* VS Badge - Desktop */}
              <div className="hidden md:flex vs-badge">
                <span>VS</span>
              </div>

              {/* VS Badge - Mobile */}
              <div className="md:hidden flex items-center justify-center py-2">
                <div className="w-14 h-14 flex items-center justify-center bg-arena-black border-2 border-arena-accent rounded-full glow-accent-sm">
                  <span className="font-expressive font-bold text-lg text-arena-accent tracking-wider">VS</span>
                </div>
              </div>

              {/* Fragrance B */}
              <div className="w-full max-w-xs animate-fade-in" style={{ animationDelay: "50ms" }}>
                <FragranceCard
                  fragrance={battle.fragranceB}
                  onClick={() => handleVote(battle.fragranceB.id)}
                  disabled={voting}
                  isWinner={winnerId === battle.fragranceB.id}
                  isLoser={winnerId === battle.fragranceA.id}
                />
              </div>
            </div>
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
