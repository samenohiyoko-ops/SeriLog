"use client";

import React, { useState } from "react";

export default function AccentTool() {
    const [searchText, setSearchText] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchText.trim()) return;

        // OJAD（オンライン日本語アクセント辞書）へ遷移
        const url = `https://www.gavo.t.u-tokyo.ac.jp/ojad/search/index/word:${encodeURIComponent(searchText)}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="glass rounded-xl p-6 flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b pb-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <h3 className="text-lg font-bold">無料アクセント辞典（OJAD）</h3>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col gap-3">
                <label className="text-xs opacity-60">調べたい単語を入力</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="例: はし、こんにちは"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-sm"
                    />
                    <button
                        type="submit"
                        className="premium-gradient px-4 py-2 rounded-lg text-white text-sm font-medium hover:scale-105 transition-all"
                    >
                        辞書を開く
                    </button>
                </div>
            </form>

            <div className="flex-1 bg-white/5 rounded-lg p-4 flex flex-col items-center justify-center text-center opacity-70 gap-3 border border-white/5">
                <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <p className="text-xs leading-relaxed">
                    ボタンを押すと、東京大学が公開している完全無料のアクセント辞典<br />
                    「OJAD (オンライン日本語アクセント辞典)」を<br />
                    新しいタブで開いて検索します。
                </p>
            </div>

            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                <h4 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">ヒント</h4>
                <p className="text-[10px] opacity-60 leading-tight">
                    API制限を気にせずに何度でも利用できます。「箸（はし）」と「橋（はし）」などの高低グラフを視覚的・音声で確認するのに最適です。
                </p>
            </div>
        </div>
    );
}
