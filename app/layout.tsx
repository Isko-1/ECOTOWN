import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "EcoTown — карта волонтёров Орала",
  description: "Отмечай загрязнённые места города и бери их в работу вместе с волонтёрами EcoTown.",
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
