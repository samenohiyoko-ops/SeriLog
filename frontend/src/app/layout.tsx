import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SeriLog | セリフ暗記サポートログ",
  description: "台本を覚えるための練習と自分の声を録音できるセリフ暗記サポートサイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="relative min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 w-full border-b glass">
            <div className="container flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="SeriLog" className="h-10 w-auto object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                </Link>
              </div>
              <div className="flex items-center">
                {/* 右上のメニュー選択ボタン */}
                <details className="relative group">
                  <summary className="list-none cursor-pointer flex items-center justify-center w-10 h-10 rounded-md hover:bg-white/10 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </summary>
                  <div className="absolute right-0 mt-2 w-56 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl glass overflow-hidden z-50 flex flex-col py-2">
                    <Link href="/" className="px-4 py-3 hover:bg-white/10 transition-colors text-sm font-bold flex items-center gap-3">
                      トップページ
                    </Link>
                    <Link href="/training" className="px-4 py-3 hover:bg-white/10 transition-colors text-sm font-bold flex items-center gap-3">
                      トレーニング
                    </Link>
                    <Link href="/workspace" className="px-4 py-3 hover:bg-white/10 transition-colors text-sm font-bold flex items-center gap-3">
                      演技練習
                    </Link>
                    <Link href="/reader" className="px-4 py-3 hover:bg-white/10 transition-colors text-sm font-bold flex items-center gap-3">
                      台本読み
                    </Link>
                    <Link href="/scripts" className="px-4 py-3 hover:bg-white/10 transition-colors text-sm font-bold opacity-70 flex items-center gap-3">
                      台本ライブラリ
                    </Link>
                  </div>
                </details>
              </div>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t py-6 md:px-8 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
              <p className="text-sm text-muted-foreground w-full text-center">
                &copy; 2026 SeriLog. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
