import { Metadata } from "next";
import ArenaClient from "./ArenaClient";

export const metadata: Metadata = {
  title: "Fragrance Battles — Two Enter. One Wins.",
  description:
    "Head-to-head fragrance battles. Vote for your favorites and see real-time rankings powered by Elo. The ultimate taste battleground for perfume enthusiasts.",
  keywords: [
    "fragrance",
    "perfume",
    "cologne",
    "rankings",
    "voting",
    "arena",
    "elo",
    "best perfume",
    "fragrance comparison",
    "perfume battle",
  ],
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <ArenaClient />;
}
