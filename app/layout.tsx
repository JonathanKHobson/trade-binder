import type { Metadata } from "next";
import "./globals.css";

const siteOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://trade-binder-north-star-prototype.jkylehobson.chatgpt.site/";
const socialImage = new URL("og.png", siteOrigin).toString();
const favicon = new URL("favicon.svg", siteOrigin).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: "Trade Binder",
  description: "Browse exact prints, build a request, and start the right trade conversation.",
  openGraph: {
    title: "Trade Binder",
    description: "Browse exact prints, build a request, and start the right trade conversation.",
    images: [{ url: socialImage, width: 1731, height: 909, alt: "Trade Binder in a warm light collection interface" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trade Binder",
    description: "Browse exact prints, build a request, and start the right trade conversation.",
    images: [socialImage],
  },
  icons: {
    icon: favicon,
    shortcut: favicon,
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
