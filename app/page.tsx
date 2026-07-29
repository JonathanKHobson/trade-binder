import type { Metadata } from "next";
import { TradeBinderPrototype } from "./components/TradeBinderPrototype";

export const metadata: Metadata = {
  title: "Trade Binder | Homebrew Forge",
  description: "Browse exact prints, build a request, and start the right trade conversation.",
};

export default function Home() {
  return <TradeBinderPrototype />;
}
