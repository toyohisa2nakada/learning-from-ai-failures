import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import TranslationProvider from "@/components/TranslationProvider";

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
        {/* opencv.jsが読み込むwasmの影響?でnode moduleではなくscript srcで読み込む */}
        <Script src="/opencv/opencv.4.13.0.js" strategy="beforeInteractive" />
        {/* JsEditorの中で使用するtfjsはiframeで実行されるため、キャッシュされるようにnode moduleではなくscript srcで読み込む */}
        <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js" strategy="beforeInteractive" />
        <div className="w-full px-3 py-3 h-screen grid grid-rows-[auto_1fr] gap-1 bg-inherit">
          <TranslationProvider>
            <Header />
            {children}
          </TranslationProvider>
        </div>
      </body>
    </html>
  );
}
