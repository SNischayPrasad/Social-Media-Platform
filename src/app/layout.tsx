import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";
import { SessionProvider } from "@/components/SessionProvider";
import { TopBar } from "@/components/TopBar";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Commons — a small public square",
  description:
    "A social platform where people post, reply, and keep one shared timeline.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${bricolage.variable} ${instrument.variable} ${jetbrains.variable}`}>
      <body>
        <SessionProvider user={user}>
          <TopBar />
          <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
