"use client";

import React, { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

export default function AccentTool() {
    const [searchText, setSearchText] = useState("");
    const [accentInfo, setAccentInfo] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchText.trim()) return;

        setIsSearching(true);
        try {
            const response = await fetch(`${API_BASE}/ai/accent`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: searchText }),
            });
            if (response.ok) {
                const data = await response.json();
                setAccentInfo(data.info);
            } else {
                setAccentInfo("アクセント情報の取得に失敗しました。");
            }
        } catch (err) {
            console.error(err);
            setAccentInfo("通信エラーが発生しました。");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="glass rounded-xl p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b pb-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <h3 className="text-lg font-bold">AIアクセント調査器</h3>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col gap-3">
                <label className="text-xs opacity-60">調べたい単語・文章を入力</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="例: あおぞら、こんにちは"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-sm"
                    />
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="premium-gradient px-4 py-2 rounded-lg text-white text-sm font-medium hover:scale-105 transition-all disabled:opacity-50"
                    >
                        {isSearching ? "調査中..." : "調べる"}
                    </button>
                </div>
            </form>

            <div className="flex-1 bg-white/5 rounded-lg p-4 min-h-[150px] overflow-auto border border-white/5">
                {accentInfo ? (
                    <div className="text-sm leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {accentInfo}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 gap-2">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs">単語を入力してボタンを押すと、<br />AIがアクセント（高低）を詳しく解説します。</p>
                    </div>
                )}
            </div>

            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <h4 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">ヒント</h4>
                <p className="text-[10px] opacity-60 leading-tight">
                    「箸（はし）」と「橋（はし）」のように、同じ読みでもアクセントが異なる単語の確認に便利です。
                </p>
            </div>
        </div>
    );
}
