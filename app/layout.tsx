import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap"
});

export const metadata: Metadata = {
  title: "STRATUM | Neighborhood Intelligence",
  description:
    "Live neighborhood layers from anonymous resident reports, AI clustering, and B2B trend APIs."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} bg-night text-slate-50 antialiased`}>
        {children}
      </body>
    </html>
  );
}
