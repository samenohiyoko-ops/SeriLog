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

// ライブラリのPDFを画像ビューアーで表示するコンポーネント
function PdfImageViewer({ fileId, fileName }: { fileId: string; fileName: string }) {
    const [totalPages, setTotalPages] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [imgSrc, setImgSrc] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setError(null);
        setIsLoading(true);
        fetch(`${API_BASE}/scripts/library/${fileId}/pages`)
            .then(res => {
                if (!res.ok) throw new Error(`ページ数取得失敗: ${res.status}`);
                return res.json();
            })
            .then(data => {
                setTotalPages(data.page_count);
                setCurrentPage(1);
            })
            .catch(e => {
                console.error(e);
                setError("PDFの読み込みに失敗しました。バックエンドが起動しているか確認してください。");
                setIsLoading(false);
            });
    }, [fileId]);

    useEffect(() => {
        if (!fileId || totalPages === 0) return;
        setIsLoading(true);
        setError(null);
        setImgSrc(`${API_BASE}/scripts/library/${fileId}/page/${currentPage}?t=${Date.now()}`);
    }, [fileId, currentPage, totalPages]);

    const goTo = (p: number) => {
        if (p < 1 || p > totalPages) return;
        setCurrentPage(p);
    };

    return (
        <div className="flex flex-col gap-3" style={{ height: "100%" }}>
            {/* ページコントロール */}
            <div className="flex items-center justify-between px-1 shrink-0">
                <span className="text-xs opacity-50 truncate max-w-[150px]">{fileName}</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => goTo(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-3 py-1 rounded glass text-sm disabled:opacity-30 hover:bg-white/10 transition-colors"
                    >
                        ‹ 前
                    </button>
                    <span className="text-sm font-mono tabular-nums">
                        {currentPage} / {totalPages || "…"}
                    </span>
                    <button
                        onClick={() => goTo(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-1 rounded glass text-sm disabled:opacity-30 hover:bg-white/10 transition-colors"
                    >
                        次 ›
                    </button>
                </div>
            </div>

            {/* ページ画像 */}
            <div className="flex-1 overflow-auto rounded-lg bg-white/5 flex items-start justify-center p-2 relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    </div>
                )}
                {imgSrc && !error && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imgSrc}
                        alt={`ページ ${currentPage}`}
                        className="max-w-full rounded shadow-lg"
                        style={{ display: isLoading ? "none" : "block" }}
                        onLoad={() => setIsLoading(false)}
                        onError={() => {
                            setIsLoading(false);
                            setError("ページ画像の取得に失敗しました。");
                        }}
                    />
                )}
            </div>
        </div>
    );
}

export default function ScriptReader() {
    const [currentLibraryEntry, setCurrentLibraryEntry] = useState<LibraryEntry | null>(null);
    const [localFile, setLocalFile] = useState<File | null>(null);
    const [localPdfUrl, setLocalPdfUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");

    // ライブラリ
    const [library, setLibrary] = useState<LibraryEntry[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
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

    const fetchLibrary = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/scripts/library/list`);
            if (res.ok) setLibrary(await res.json());
        } catch { }
    }, []);

    useEffect(() => { fetchLibrary(); }, [fetchLibrary]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            if (localPdfUrl) URL.revokeObjectURL(localPdfUrl);
            setLocalFile(file);
            setLocalPdfUrl(URL.createObjectURL(file));
            setFileName(file.name);
            setCurrentLibraryEntry(null);
            setCurrentLibraryId(null);
            setAudioUrl(null);
            setRecordingSeconds(0);
            setSaveSuccess(false);
        }
    };

    const openFromLibrary = async (entry: LibraryEntry) => {
        if (localPdfUrl) URL.revokeObjectURL(localPdfUrl);
        setCurrentLibraryEntry(entry);
        setLocalFile(null);
        setLocalPdfUrl(null);
        setFileName(entry.name);
        setCurrentLibraryId(entry.id);
        setAudioUrl(null);
        setRecordingSeconds(0);
        setSaveSuccess(false);
        setShowLibrary(false);
        setMemo("");
        try {
            const res = await fetch(`${API_BASE}/scripts/library/${entry.id}/note`);
            if (res.ok) {
                const data = await res.json();
                setMemo(data.note || "");
            }
        } catch { }
    };

    const saveToLibrary = async () => {
        if (!localFile) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append("file", localFile);
            const res = await fetch(`${API_BASE}/scripts/library/save`, {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setSaveSuccess(true);
                setCurrentLibraryId(data.id);
                fetchLibrary();
                // ライブラリ保存後は画像ビューアーに切り替え
                setCurrentLibraryEntry({ id: data.id, name: data.name, saved_at: data.saved_at, path: "" });
                setLocalFile(null);
                if (localPdfUrl) URL.revokeObjectURL(localPdfUrl);
                setLocalPdfUrl(null);
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch {
            alert("保存に失敗しました。");
        } finally {
            setIsSaving(false);
        }
    };

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
        return () => { if (memoDebounceRef.current) clearTimeout(memoDebounceRef.current); };
    }, [memo, currentLibraryId]);

    const deleteFromLibrary = async (id: string) => {
        if (!confirm("このPDFをライブラリから削除しますか？")) return;
        await fetch(`${API_BASE}/scripts/library/${id}`, { method: "DELETE" });
        fetchLibrary();
        if (currentLibraryId === id) {
            setCurrentLibraryEntry(null);
            setCurrentLibraryId(null);
            setFileName("");
        }
    };

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
            const mr = new MediaRecorder(stream);
            mediaRecorderRef.current = mr;
            audioChunksRef.current = [];
            mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mr.onstop = () => setAudioUrl(URL.createObjectURL(new Blob(audioChunksRef.current, { type: "audio/webm" })));
            mr.start(300);
            setIsRecording(true);
            setRecordingSeconds(0);
            setAudioUrl(null);
        } catch { alert("マイクのアクセス許可が必要です。"); }
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

    const hasPdf = currentLibraryEntry !== null || localFile !== null;

    return (
        <div className="container mx-auto p-4 flex flex-col gap-4">
            {/* ヘッダー */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h1 className="text-xl font-bold premium-text">台本読み練習</h1>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {localFile && !saveSuccess && (
                        <button
                            onClick={saveToLibrary}
                            disabled={isSaving}
                            className="px-3 py-1.5 rounded-lg text-sm border border-primary/40 text-primary hover:bg-primary/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? "保存中..." : "ライブラリに保存"}
                        </button>
                    )}
                    {saveSuccess && <span className="text-xs text-green-400">✓ 保存しました</span>}
                    <button
                        onClick={() => setShowLibrary(v => !v)}
                        className={`glass px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors flex items-center gap-1.5 ${showLibrary ? "ring-1 ring-primary/40" : ""}`}
                    >
                        ライブラリ ({library.length})
                    </button>
                    <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="glass px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
                    >
                        PDFを開く
                    </button>
                </div>
            </div>

            {/* ライブラリパネル */}
            {showLibrary && (
                <div className="glass rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
                    <h3 className="text-sm font-bold mb-3">保存済み台本</h3>
                    {library.length === 0 ? (
                        <p className="text-sm opacity-40 py-4 text-center">保存済みの台本はありません。PDFを開いて「ライブラリに保存」してください。</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {library.map(entry => (
                                <div key={entry.id} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg hover:bg-white/10 group">
                                    <button onClick={() => openFromLibrary(entry)} className="flex-1 text-left">
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

            {hasPdf ? (
                /* ===== PDF表示中レイアウト ===== */
                /* PC: 左側PDF(横広) + 右側コントロール(縦長)。スマホ: 縦積み */
                <div className="flex flex-col lg:flex-row gap-4">

                    {/* PDF表示エリア：スマホは画面高さの60%、PCはビューポートいっぱい */}
                    <div className="w-full lg:flex-1 flex flex-col gap-2"
                        style={{ height: "60svh" }}
                    >
                        <div className="glass rounded-xl p-3 flex flex-col h-full overflow-hidden">
                            {isRecording && (
                                <div className="flex items-center gap-2 px-2 py-1 mb-2 rounded bg-red-500/10 border border-red-500/20 shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-xs text-red-400 font-mono font-bold">● REC {formatTime(recordingSeconds)}</span>
                                </div>
                            )}
                            {/* ライブラリのPDFは画像ビューアー（スマホ対応） */}
                            {currentLibraryEntry ? (
                                <PdfImageViewer fileId={currentLibraryEntry.id} fileName={currentLibraryEntry.name} />
                            ) : localPdfUrl ? (
                                /* ローカルPDFはiframe（PC）+ スマホ向けダウンロードリンク */
                                <div className="flex flex-col gap-2 h-full">
                                    <span className="text-xs opacity-40 truncate shrink-0">{fileName}（ローカルファイル）</span>
                                    <iframe src={localPdfUrl} className="flex-1 rounded w-full" title="台本PDF" />
                                    <a href={localPdfUrl} download={fileName} className="text-center text-xs text-primary hover:underline shrink-0">
                                        ↓ スマホで表示されない場合はダウンロード
                                    </a>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* 録音コントロール：PC横並び、スマホ縦並び */}
                    <div className="w-full lg:w-72 xl:w-80 flex flex-col gap-3">
                        <div className="glass rounded-xl p-5 flex flex-col items-center gap-4">
                            <h3 className="text-base font-bold w-full border-b pb-2">録音コントロール</h3>
                            <p className="text-xs opacity-40 truncate w-full text-center">{fileName}</p>

                            {/* 録音ボタン */}
                            <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center ${isRecording ? "border-red-500/50" : "border-primary/30"}`}>
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${isRecording ? "bg-red-500 animate-pulse" : "premium-gradient hover:scale-105"}`}
                                >
                                    {isRecording ? (
                                        <div className="w-7 h-7 bg-white rounded-sm" />
                                    ) : (
                                        <svg className="w-9 h-9 text-white fill-current" viewBox="0 0 24 24">
                                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {isRecording ? (
                                <div className="text-center">
                                    <p className="font-bold text-red-400 text-sm">収録中</p>
                                    <p className="font-mono text-2xl font-bold text-red-300">{formatTime(recordingSeconds)}</p>
                                </div>
                            ) : (
                                <p className="text-sm opacity-50">{audioUrl ? "収録完了" : "待機中"}</p>
                            )}

                            {audioUrl && !isRecording && (
                                <div className="w-full flex flex-col gap-2">
                                    <audio src={audioUrl} controls className="w-full h-8" />
                                    <button onClick={downloadAudio} className="w-full py-2 text-xs glass rounded-lg hover:bg-white/10 text-center">
                                        ↓ 音声をダウンロード
                                    </button>
                                    <button onClick={() => { setAudioUrl(null); setRecordingSeconds(0); }} className="w-full py-1 text-xs opacity-40 hover:opacity-80">
                                        クリアして再収録
                                    </button>
                                </div>
                            )}

                            {/* メモエリア */}
                            <div className="w-full border-t pt-3 flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] uppercase tracking-wider text-primary font-bold">メモ</h4>
                                    {memoSaved && <span className="text-[10px] text-green-400">✓ 保存済み</span>}
                                </div>
                                <textarea
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    placeholder="演技のポイントなど…"
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs resize-none focus:ring-1 focus:ring-primary outline-none"
                                />
                                <p className="text-[10px] opacity-30">
                                    {currentLibraryId ? "自動保存されます" : "ライブラリに保存するとメモも保持されます"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ===== PDF未選択の初期画面 ===== */
                <div className="glass rounded-xl flex flex-col items-center justify-center gap-6 py-20">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold mb-1">台本PDFを開いてください</h2>
                        <p className="text-sm opacity-50">「PDFを開く」からファイルを選択、または保存済み台本をライブラリから選べます。</p>
                        <p className="text-xs opacity-30 mt-1">ライブラリに保存したPDFはスマホでもページを画像で閲覧できます。</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap justify-center">
                        <button onClick={() => fileInputRef.current?.click()} className="premium-gradient px-6 py-3 rounded-xl text-white font-bold hover:scale-105 transition-transform">
                            PDFを開く
                        </button>
                        {library.length > 0 && (
                            <button onClick={() => setShowLibrary(true)} className="glass px-6 py-3 rounded-xl font-bold hover:bg-white/10">
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
