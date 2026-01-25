import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Learning from AI Failures",
  description: "AIの失敗から学ぶニューラルネットワークの仕組み",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900 text-slate-100`}>
        <div className="w-full px-3 py-3 min-h-screen grid grid-rows-[auto_1fr] gap-1 bg-inherit">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
