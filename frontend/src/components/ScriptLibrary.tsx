"use client";

import React, { useState, useEffect } from "react";

type LibraryPDF = {
    id: string;
    name: string;
    saved_at: string;
    path: string;
    note?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

export default function ScriptLibrary() {
    const [pdfs, setPdfs] = useState<LibraryPDF[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLibrary = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/scripts/library/list`);
            if (res.ok) {
                const data = await res.json();
                setPdfs(data);
            }
        } catch (err) {
            console.error("ライブラリ取得エラー:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("この台本をライブラリから削除しますか？")) return;
        try {
            const res = await fetch(`${API_BASE}/scripts/library/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                fetchLibrary();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRead = (id: string) => {
        // 台本読みページ（/reader）にライブラリIDを渡して遷移
        window.location.href = `/reader?library_id=${id}`;
    };

    useEffect(() => {
        fetchLibrary();
    }, []);

    return (
        <div className="container mx-auto p-6 max-w-5xl animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold premium-text tracking-tight mb-2">台本ライブラリ</h1>
                    <p className="text-muted-foreground">保存したPDF台本の一覧と管理を行います。</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-muted-foreground opacity-70">読み込み中...</div>
                </div>
            ) : pdfs.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center flex flex-col items-center gap-4">
                    <svg className="w-16 h-16 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    <p className="text-lg text-muted-foreground">保存された台本はありません。</p>
                    <a href="/reader" className="text-primary hover:text-accent transition-colors text-sm mt-2 underline underline-offset-4">
                        台本読みページでPDFをインポートして保存してください
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pdfs.map((pdf) => (
                        <div key={pdf.id} className="glass rounded-xl p-6 flex flex-col group hover:border-primary/50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-primary/20 rounded-lg text-primary">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <button
                                    onClick={() => handleDelete(pdf.id)}
                                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-2 -m-2"
                                    title="削除"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>

                            <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2" title={pdf.name}>
                                {pdf.name}
                            </h3>

                            <p className="text-xs text-muted-foreground mb-6">
                                保存日: {new Date(pdf.saved_at).toLocaleDateString()}
                            </p>

                            <div className="mt-auto pt-4 border-t border-white/5 flex gap-3">
                                <button
                                    onClick={() => handleRead(pdf.id)}
                                    className="flex-1 rounded-md bg-primary hover:bg-accent text-white py-2 text-sm font-bold transition-colors flex justify-center items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    開いて練習
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
