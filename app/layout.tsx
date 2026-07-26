import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trade Binder Prototype | Homebrew Forge",
  description: "A compact, Magic-native collection and trade-binder prototype.",
  openGraph: {
    title: "Trade Binder",
    description: "A compact, Magic-native collection and trade-binder prototype.",
    images: [{ url: "/trade-binder-share.png", width: 1200, height: 630, alt: "Trade Binder abstract card collection" }],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
