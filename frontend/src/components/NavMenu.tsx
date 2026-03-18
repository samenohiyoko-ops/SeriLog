"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const menuRef = useRef<HTMLDivElement>(null);

    // ページ遷移時にメニューを閉じる
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // メニューの外側をクリックした時に閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative group" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-white/10 transition-colors"
                aria-label="メニュー"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl glass overflow-hidden z-50 flex flex-col py-2 animate-in fade-in zoom-in-95 duration-200">
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
            )}
        </div>
    );
}
