import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ecotown-liard.vercel.app";
const title = "EcoTown — карта волонтёров Орала";
const description = "Отмечай загрязнённые места города и бери их в работу вместе с волонтёрами EcoTown.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "EcoTown",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} ${manrope.variable} font-body`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
