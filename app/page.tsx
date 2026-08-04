import type { Metadata } from "next";
import { TradeBinderPrototype } from "./components/TradeBinderPrototype";

export const metadata: Metadata = {
  title: "Trade Binder",
  description: "Browse exact official prints and complete Homebrew Forge cards, variants, and linked faces.",
};

export default function Home() {
  return <TradeBinderPrototype />;
}
