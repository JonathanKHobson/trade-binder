import type { Metadata } from "next";
import { TradeBinderPrototype } from "./components/TradeBinderPrototype";

export const metadata: Metadata = {
  title: "Trade Binder Prototype | Homebrew Forge",
  description: "A compact, Magic-native collection and trade-binder prototype.",
};

export default function Home() {
  return <TradeBinderPrototype />;
}
