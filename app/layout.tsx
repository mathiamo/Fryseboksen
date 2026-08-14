import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-display", subsets: ["latin"] });
export const metadata: Metadata = { title: "Fryseboksen", description: "Husk hva du har i fryseren, og bruk maten før den blir for gammel.", other: { "codex-preview": "development" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="nb"><body className={`${dmSans.variable} ${playfair.variable}`}>{children}</body></html>; }
