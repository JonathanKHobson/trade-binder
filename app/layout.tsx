import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://trade-binder-north-star-prototype.jkylehobson.chatgpt.site"),
  title: "Trade Binder | Homebrew Forge",
  description: "Browse exact prints, build a request, and start the right trade conversation.",
  openGraph: {
    title: "Trade Binder",
    description: "Browse exact prints, build a request, and start the right trade conversation.",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Trade Binder in a warm light collection interface" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trade Binder",
    description: "Browse exact prints, build a request, and start the right trade conversation.",
    images: ["/og.png"],
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
