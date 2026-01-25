"use client";

import { VoteResponse } from "@/types";

interface VoteFeedbackProps {
  response: VoteResponse;
  winnerName: string;
  visible: boolean;
}

export default function VoteFeedback({
  response,
  winnerName,
  visible,
}: VoteFeedbackProps) {
  if (!visible) return null;

  const messages: string[] = [];

  // Upset message
  if (response.isUpset) {
    messages.push("🔥 Upset win!");
  }

  // Rank movement
  if (response.rankMovement) {
    const movement = response.rankMovement.winner;
    if (movement > 0) {
      messages.push(`${winnerName} ▲ +${movement} Elo`);
    }
  }

  // Agreement percentage (if available)
  if (response.agreePercent !== undefined) {
    messages.push(`You agreed with ${response.agreePercent}% of voters`);
  }

  return (
    <div
      className={`
        fixed bottom-8 left-1/2 -translate-x-1/2 z-50
        bg-arena-dark border border-arena-border rounded-lg
        px-6 py-4 shadow-2xl
        transition-all duration-300
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      <div className="flex flex-col items-center gap-2">
        {messages.map((msg, i) => (
          <p
            key={i}
            className={`
              text-sm font-medium
              ${i === 0 && response.isUpset ? "text-orange-400" : "text-arena-white"}
            `}
          >
            {msg}
          </p>
        ))}
        {messages.length === 0 && (
          <p className="text-sm text-arena-light">Vote recorded!</p>
        )}
      </div>
    </div>
  );
}
