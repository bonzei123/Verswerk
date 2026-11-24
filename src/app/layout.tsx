import type { Metadata } from "next";
import { Figtree, Geist_Mono, Literata, Syne } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const literata = Literata({
  variable: "--font-lyric",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Verswerk — Songs & Rap-Texte",
  description:
    "Songwriting-Werkstatt: Lines anlegen, zu Strophen puzzeln, nach Reimen und Silben suchen, MIDI-Rhythmen und Basslines hören.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${figtree.variable} ${syne.variable} ${literata.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
