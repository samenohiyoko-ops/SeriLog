"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

interface LibraryEntry {
    id: string;
    name: string;
    saved_at: string;
    path: string;
    note?: string;
}

export default function ScriptReader() {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [currentFile, setCurrentFile] = useState<File | null>(null);

    // ライブラリ
    const [library, setLibrary] = useState<LibraryEntry[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    // 現在開いているライブラリエントリのID（メモ保存用）
    const [currentLibraryId, setCurrentLibraryId] = useState<string | null>(null);

    // メモ
    const [memo, setMemo] = useState("");
    const [memoSaved, setMemoSaved] = useState(false);
    const memoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 録音状態
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ライブラリ一覧取得
    const fetchLibrary = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/scripts/library/list`);
            if (res.ok) setLibrary(await res.json());
        } catch { }
    }, []);

    useEffect(() => {
        fetchLibrary();
    }, [fetchLibrary]);

    // ローカルPDFファイル選択
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            if (pdfUrl && !pdfUrl.startsWith(API_BASE)) URL.revokeObjectURL(pdfUrl);
            const url = URL.createObjectURL(file);
            setPdfUrl(url);
            setFileName(file.name);
            setCurrentFile(file);
            setAudioUrl(null);
            setRecordingSeconds(0);
            setSaveSuccess(false);
        }
    };

    // ライブラリからPDFを選択
    const openFromLibrary = async (entry: LibraryEntry) => {
        const url = `${API_BASE}/scripts/library/${entry.id}`;
        setPdfUrl(url);
        setFileName(entry.name);
        setCurrentFile(null);
        setCurrentLibraryId(entry.id);
        setAudioUrl(null);
        setRecordingSeconds(0);
        setSaveSuccess(false);
        setShowLibrary(false);
        // メモを読み込む
        setMemo("");
        try {
            const res = await fetch(`${API_BASE}/scripts/library/${entry.id}/note`);
            if (res.ok) {
                const data = await res.json();
                setMemo(data.note || "");
            }
        } catch { }
    };

    // ライブラリに保存
    const saveToLibrary = async () => {
        if (!currentFile) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append("file", currentFile);
            const res = await fetch(`${API_BASE}/scripts/library/save`, {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setSaveSuccess(true);
                setCurrentFile(null);
                setCurrentLibraryId(data.id); // 保存後は自動でこのIDを使う
                fetchLibrary();
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch {
            alert("保存に失敗しました。");
        } finally {
            setIsSaving(false);
        }
    };

    // メモのデバウンス自動保存
    useEffect(() => {
        if (!currentLibraryId) return;
        if (memoDebounceRef.current) clearTimeout(memoDebounceRef.current);
        memoDebounceRef.current = setTimeout(async () => {
            try {
                await fetch(`${API_BASE}/scripts/library/${currentLibraryId}/note`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ note: memo }),
                });
                setMemoSaved(true);
                setTimeout(() => setMemoSaved(false), 2000);
            } catch { }
        }, 1500);
        return () => {
            if (memoDebounceRef.current) clearTimeout(memoDebounceRef.current);
        };
    }, [memo, currentLibraryId]);

    // ライブラリから削除
    const deleteFromLibrary = async (id: string) => {
        if (!confirm("このPDFをライブラリから削除しますか？")) return;
        await fetch(`${API_BASE}/scripts/library/${id}`, { method: "DELETE" });
        fetchLibrary();
    };

    // 録音タイマー
    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
        } else {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                setAudioUrl(URL.createObjectURL(blob));
            };
            mediaRecorder.start(300);
            setIsRecording(true);
            setRecordingSeconds(0);
            setAudioUrl(null);
        } catch {
            alert("マイクのアクセス許可が必要です。");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
            setIsRecording(false);
        }
    };

    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    const downloadAudio = () => {
        if (!audioUrl) return;
        const a = document.createElement("a");
        a.href = audioUrl;
        a.download = `${fileName.replace(".pdf", "") || "recording"}_録音.webm`;
        a.click();
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
    };

    return (
        <div className="container mx-auto p-6 flex flex-col gap-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold premium-text">台本読み練習</h1>
                    <p className="text-xs opacity-50 mt-1">PDFを表示しながら、ページをめくっても収録が継続されます</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* ライブラリ保存ボタン（ローカルから開いた場合のみ） */}
                    {currentFile && !saveSuccess && (
                        <button
                            onClick={saveToLibrary}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-lg text-sm border border-primary/40 text-primary hover:bg-primary/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            {isSaving ? "保存中..." : "ライブラリに保存"}
                        </button>
                    )}
                    {saveSuccess && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                            ✓ ライブラリに保存しました
                        </span>
                    )}
                    {/* ライブラリから選択 */}
                    <button
                        onClick={() => setShowLibrary(v => !v)}
                        className={`glass px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors flex items-center gap-2 ${showLibrary ? "ring-1 ring-primary/40" : ""}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        ライブラリ ({library.length})
                    </button>
                    {/* ローカルからPDFを開く */}
                    <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="glass px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        PDFを開く
                    </button>
                </div>
            </div>

            {/* ライブラリパネル（展開時） */}
            {showLibrary && (
                <div className="glass rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        保存済み台本
                    </h3>
                    {library.length === 0 ? (
                        <p className="text-sm opacity-40 py-4 text-center">保存済みの台本はありません。PDFを開いて「ライブラリに保存」してください。</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {library.map(entry => (
                                <div key={entry.id} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group">
                                    <button
                                        onClick={() => openFromLibrary(entry)}
                                        className="flex-1 text-left"
                                    >
                                        <p className="text-sm font-medium truncate">{entry.name}</p>
                                        <p className="text-[10px] opacity-40">{formatDate(entry.saved_at)}</p>
                                    </button>
                                    <button
                                        onClick={() => deleteFromLibrary(entry.id)}
                                        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1 text-red-400"
                                        title="削除"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {pdfUrl ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* PDF表示エリア */}
                    <div className="lg:col-span-8">
                        <div className="glass rounded-xl overflow-hidden" style={{ height: "80vh" }}>
                            {isRecording && (
                                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-red-500/10">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-xs text-red-400 font-mono font-bold">
                                        ● REC {formatTime(recordingSeconds)}
                                    </span>
                                    <span className="text-[10px] opacity-40 ml-2">ページをめくっても収録は継続中</span>
                                </div>
                            )}
                            <iframe
                                src={pdfUrl}
                                className="w-full"
                                style={{ height: isRecording ? "calc(100% - 37px)" : "100%" }}
                                title="台本PDF"
                            />
                        </div>
                    </div>

                    {/* 録音コントロール */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <div className="glass rounded-xl p-6 flex flex-col items-center gap-6">
                            <h3 className="text-lg font-bold w-full border-b pb-2">録音コントロール</h3>
                            <div className="text-center">
                                <p className="text-xs opacity-50 font-medium truncate max-w-[180px]">{fileName}</p>
                            </div>
                            <div className="flex flex-col items-center gap-4">
                                <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all ${isRecording ? "border-red-500/50" : "border-primary/30"}`}>
                                    <button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${isRecording ? "bg-red-500 animate-pulse hover:bg-red-600" : "premium-gradient hover:scale-105"}`}
                                    >
                                        {isRecording ? (
                                            <div className="w-8 h-8 bg-white rounded-sm" />
                                        ) : (
                                            <svg className="w-10 h-10 text-white fill-current" viewBox="0 0 24 24">
                                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <div className="text-center">
                                    {isRecording ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <p className="font-bold text-red-400">収録中</p>
                                            <p className="font-mono text-3xl font-bold text-red-300">{formatTime(recordingSeconds)}</p>
                                            <p className="text-[10px] opacity-40">ページをめくっても収録は続きます</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm opacity-60">{audioUrl ? "収録完了" : "待機中"}</p>
                                    )}
                                </div>
                            </div>

                            {audioUrl && !isRecording && (
                                <div className="w-full flex flex-col gap-3 animate-in fade-in duration-500">
                                    <div className="p-3 glass rounded-lg border border-primary/20">
                                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-2">収録した音声</p>
                                        <audio src={audioUrl} controls className="w-full h-8" />
                                    </div>
                                    <button onClick={downloadAudio} className="w-full py-2 text-xs glass rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        音声をダウンロード
                                    </button>
                                    <button onClick={() => { setAudioUrl(null); setRecordingSeconds(0); }} className="w-full py-2 text-xs opacity-40 hover:opacity-80 transition-opacity">
                                        クリアして再収録
                                    </button>
                                </div>
                            )}

                            <div className="w-full border-t pt-4 mt-auto flex flex-col gap-3">
                                {/* メモエリア（PDF表示中は常に表示） */}
                                {pdfUrl && (
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-[10px] uppercase tracking-wider text-primary font-bold">メモ</h4>
                                            {memoSaved && (
                                                <span className="text-[10px] text-green-400">✓ 保存済み</span>
                                            )}
                                        </div>
                                        <textarea
                                            value={memo}
                                            onChange={(e) => setMemo(e.target.value)}
                                            placeholder="気になったセリフ・演技のポイントなど自由にメモ…"
                                            rows={5}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs resize-none focus:ring-1 focus:ring-primary outline-none leading-relaxed"
                                        />
                                        <p className="text-[10px] opacity-30 mt-1">
                                            {currentLibraryId
                                                ? "入力後1.5秒で自動保存されます"
                                                : "ライブラリに保存するとメモも永続保存されます"}
                                        </p>
                                    </div>
                                )}
                                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                    <h4 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-2">使い方</h4>
                                    <ul className="text-[10px] opacity-60 space-y-1">
                                        <li>• PDFを開いたらマイクボタンで収録開始</li>
                                        <li>• PDF内でページを自由にめくれます</li>
                                        <li>• 「ライブラリに保存」で次回も使用可能</li>
                                        <li>• メモは台本ごとに自動保存されます</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass rounded-xl min-h-[70vh] flex flex-col items-center justify-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold mb-2">台本PDFを開いてください</h2>
                        <p className="text-sm opacity-50">「PDFを開く」からファイルを選択、または「ライブラリ」から保存済み台本を選べます。</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => fileInputRef.current?.click()} className="premium-gradient px-6 py-3 rounded-xl text-white font-bold hover:scale-105 transition-transform flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            PDFを開く
                        </button>
                        {library.length > 0 && (
                            <button onClick={() => setShowLibrary(true)} className="glass px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                ライブラリから選ぶ ({library.length})
                            </button>
                        )}
                    </div>
                    <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                </div>
            )}
        </div>
    );
}
