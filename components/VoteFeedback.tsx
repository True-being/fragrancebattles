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

  const messages: { text: string; type: "upset" | "movement" | "info" }[] = [];

  // Upset message
  if (response.isUpset) {
    messages.push({ text: "Upset win!", type: "upset" });
  }

  // Rank movement
  if (response.rankMovement) {
    const movement = response.rankMovement.winner;
    if (movement > 0) {
      messages.push({ text: `${winnerName} +${movement} Elo`, type: "movement" });
    }
  }

  // Agreement percentage (if available)
  if (response.agreePercent !== undefined) {
    messages.push({ text: `${response.agreePercent}% agree`, type: "info" });
  }

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        glass-dark border border-arena-border rounded-xl
        px-6 py-4 shadow-2xl
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Success indicator */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        {/* Messages */}
        <div className="flex items-center gap-3">
          {messages.length > 0 ? (
            messages.map((msg, i) => (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-arena-border">·</span>}
                <span
                  className={`
                    font-modern text-sm font-medium whitespace-nowrap
                    ${msg.type === "upset" ? "text-orange-400" : ""}
                    ${msg.type === "movement" ? "text-green-400" : ""}
                    ${msg.type === "info" ? "text-arena-light" : ""}
                  `}
                >
                  {msg.type === "upset" && "🔥 "}
                  {msg.type === "movement" && "▲ "}
                  {msg.text}
                </span>
              </div>
            ))
          ) : (
            <span className="font-modern text-sm text-arena-light">Vote recorded</span>
          )}
        </div>
      </div>
    </div>
  );
}
