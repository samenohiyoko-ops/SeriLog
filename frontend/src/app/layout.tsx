import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import NavMenu from "@/components/NavMenu";
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
                <NavMenu />
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
