"use client";

import React, { useState, useRef, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

interface ScriptLine {
    id: string;
    role: string;
    text: string;
    isMyRole: boolean;
}

export default function Workspace() {
    const [lines, setLines] = useState<ScriptLine[]>([]);
    const [inputText, setInputText] = useState("");
    const [scriptTitle, setScriptTitle] = useState("無題の台本");
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [memoMode, setMemoMode] = useState(false);
    const [maskedIndices, setMaskedIndices] = useState<Set<number>>(new Set());
    const [isUploading, setIsUploading] = useState(false);
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);

    // 短いセリフ練習モード用
    const [viewMode, setViewMode] = useState<"script" | "short">("script");
    const [currentGenre, setCurrentGenre] = useState("女性");
    const [shortPracticeText, setShortPracticeText] = useState("");
    const [isFetchingShort, setIsFetchingShort] = useState(false);
    const [sampleAudioUrl, setSampleAudioUrl] = useState<string | null>(null);
    const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);

    const actingGenres = ["女性", "男性", "少女", "少年", "悪役", "老人", "ナレーション", "朗読"];

    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleImport = () => {
        const newLines = inputText.split("\n").filter(l => l.trim()).map((line, index) => {
            const parts = line.split(":");
            const role = parts.length > 1 ? parts[0].trim() : "不明";
            const text = parts.length > 1 ? parts.slice(1).join(":").trim() : line.trim();
            return {
                id: `line-${index}`,
                role,
                text,
                isMyRole: false,
            };
        });
        setLines(newLines);
        updateAvailableRoles(newLines);
        setInputText("");
    };

    const updateAvailableRoles = (newLines: ScriptLine[]) => {
        const roles = Array.from(new Set(newLines.map(l => l.role))).filter(r => r !== "ト書き/ナレーション" && r !== "不明");
        setAvailableRoles(roles);
    };

    const setMyRoleBulk = (roleName: string) => {
        const newLines = lines.map(line => ({
            ...line,
            isMyRole: line.role === roleName
        }));
        setLines(newLines);
    };

    const fetchRandomShortScript = async (genre: string) => {
        setIsFetchingShort(true);
        try {
            const response = await fetch(`${API_BASE}/practice/random?genre=${encodeURIComponent(genre)}`);
            if (response.ok) {
                const data = await response.json();
                setShortPracticeText(data.text);
                setCurrentGenre(genre);
                setSampleAudioUrl(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsFetchingShort(false);
        }
    };

    const handleTTS = async () => {
        if (!shortPracticeText) return;
        setIsGeneratingSpeech(true);
        try {
            const url = `${API_BASE}/ai/tts?text=${encodeURIComponent(shortPracticeText)}&voice=${currentGenre === "男性" || currentGenre === "老人" || currentGenre === "悪役" ? "onyx" : "shimmer"}`;
            const response = await fetch(url);
            if (response.ok) {
                const blob = await response.blob();
                setSampleAudioUrl(URL.createObjectURL(blob));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsGeneratingSpeech(false);
        }
    };



    useEffect(() => {
        if (viewMode === "short" && !shortPracticeText) {
            fetchRandomShortScript("女性");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.name.endsWith(".pdf")) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${API_BASE}/scripts/upload-pdf`, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                const newLines = data.map((item: {role: string, text: string}, index: number) => ({
                    id: `pdf-line-${index}`,
                    role: item.role,
                    text: item.text,
                    isMyRole: false,
                }));
                setLines(newLines);
                updateAvailableRoles(newLines);
                alert("AIによるPDF解析が完了しました！役名とセリフを自動抽出しました。");
            } else {
                alert("PDFの解析に失敗しました。");
            }
        } catch (err) {
            console.error(err);
            alert("通信エラーが発生しました。");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };



    const toggleRole = (index: number) => {
        const newLines = [...lines];
        newLines[index].isMyRole = !newLines[index].isMyRole;
        setLines(newLines);
    };

    const toggleMask = (index: number) => {
        const newMasked = new Set(maskedIndices);
        if (newMasked.has(index)) {
            newMasked.delete(index);
        } else {
            newMasked.add(index);
        }
        setMaskedIndices(newMasked);
    };

    const updateLine = (index: number, updates: Partial<ScriptLine>) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], ...updates };
        setLines(newLines);
    };

    const addLine = (index: number) => {
        const newLines = [...lines];
        const newLine: ScriptLine = {
            id: `line-${Date.now()}`,
            role: "新役名",
            text: "セリフを入力してください",
            isMyRole: false,
        };
        newLines.splice(index + 1, 0, newLine);
        setLines(newLines);
    };

    const deleteLine = (index: number) => {
        const newLines = lines.filter((_, i) => i !== index);
        setLines(newLines);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("録音の開始に失敗しました:", err);
            alert("マイクの使用を許可してください。");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
    };

    return (
        <div className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="glass rounded-xl p-6 min-h-[60vh] flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b pb-4">
                        <div className="flex flex-col gap-1">
                            {viewMode === "script" && lines.length > 0 ? (
                                <input
                                    value={scriptTitle}
                                    onChange={(e) => setScriptTitle(e.target.value)}
                                    className="text-xl font-bold bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded px-1"
                                />
                            ) : (
                                <h2 className="text-xl font-bold">{viewMode === "script" ? "台本エディタ" : "短文練習モード"}</h2>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <div className="flex bg-white/5 rounded-full p-1 border border-white/10 mr-4">
                                <button
                                    onClick={() => setViewMode("script")}
                                    className={`px-4 py-1 rounded-full text-xs transition-all ${viewMode === 'script' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 opacity-60'}`}
                                >
                                    台本練習
                                </button>
                                <button
                                    onClick={() => setViewMode("short")}
                                    className={`px-4 py-1 rounded-full text-xs transition-all ${viewMode === 'short' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 opacity-60'}`}
                                >
                                    短文練習
                                </button>
                            </div>
                            <button
                                onClick={() => setMemoMode(!memoMode)}
                                className={`px-4 py-1 rounded-full text-sm transition-colors ${memoMode ? 'premium-gradient text-white' : 'glass hover:bg-white/10'}`}
                            >
                                暗記モード: {memoMode ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>

                    {viewMode === "short" ? (
                        <div className="flex-1 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">
                            <div className="flex flex-col gap-4 py-2">
                                <section>
                                    <h4 className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2 px-1 opacity-80">演技カテゴリー</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {actingGenres.map(genre => (
                                            <button
                                                key={genre}
                                                onClick={() => fetchRandomShortScript(genre)}
                                                className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${currentGenre === genre ? 'premium-gradient border-transparent text-white scale-105' : 'glass border-white/5 hover:border-primary/50 opacity-70'}`}
                                            >
                                                {genre}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-8 border border-white/5 rounded-xl bg-white/5">
                                <div className="max-w-xl w-full">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold bg-primary/10 px-3 py-1 rounded-full mb-4 inline-block">
                                        {currentGenre} の練習
                                    </span>
                                    {memoMode ? (
                                        <div className="bg-white/5 p-4 rounded-lg cursor-pointer select-none" onClick={() => setMemoMode(false)}>
                                            <div className="text-xl md:text-2xl font-bold leading-relaxed blur-lg whitespace-pre-wrap">
                                                {shortPracticeText}
                                            </div>
                                            <p className="mt-2 text-xs opacity-40">クリックしてセリフを表示</p>
                                        </div>
                                    ) : (
                                        <div className={`text-xl md:text-2xl font-bold leading-relaxed whitespace-pre-wrap transition-opacity duration-300 ${isFetchingShort ? 'opacity-30' : 'opacity-100'}`}>
                                            {shortPracticeText || "セリフをロード中..."}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => fetchRandomShortScript(currentGenre)}
                                        className="text-xs flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        別のセリフ
                                    </button>
                                    <button
                                        onClick={handleTTS}
                                        disabled={isGeneratingSpeech}
                                        className="text-xs flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                        {isGeneratingSpeech ? "生成中..." : "お手本を聴く"}
                                    </button>

                                </div>
                                {sampleAudioUrl && (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                        <audio src={sampleAudioUrl} autoPlay controls className="h-8 w-48" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-4">
                            {availableRoles.length > 0 && (
                                <div className="flex flex-wrap gap-2 items-center py-3 px-1 border-b border-white/5 animate-in fade-in slide-in-from-top-2 duration-500">
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">自分の役をクイック選択:</span>
                                    {availableRoles.map(role => (
                                        <button
                                            key={role}
                                            onClick={() => setMyRoleBulk(role)}
                                            className="text-xs px-3 py-1 rounded-full glass hover:bg-primary/20 hover:border-primary transition-all border border-transparent flex items-center gap-1"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {lines.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                                    <div className="text-center space-y-2">
                                        <p>台本をインポートして練習を始めましょう。</p>
                                        <p className="text-xs opacity-50">例: 「役名: セリフ」を一行ずつ入力</p>
                                    </div>
                                    <textarea
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="佐藤: こんにちは。&#10;鈴木: お疲れ様です。"
                                        className="w-full max-w-lg h-40 bg-white/5 border rounded-lg p-4 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                    <div className="flex flex-col gap-2">
                                        <button onClick={handleImport} className="premium-gradient px-8 py-2 rounded-lg text-white font-medium hover:scale-105 transition-transform">
                                            インポート
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <div className="h-[1px] flex-1 bg-white/10"></div>
                                            <span className="text-xs opacity-40">または</span>
                                            <div className="h-[1px] flex-1 bg-white/10"></div>
                                        </div>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileUpload}
                                            ref={fileInputRef}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="glass px-8 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                                        >
                                            {isUploading ? "PDFを解析中..." : "PDFから読み込む"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {lines.map((line, index) => (
                                        <React.Fragment key={line.id}>
                                            <div className={`p-4 rounded-lg flex flex-col gap-2 group transition-all ${line.isMyRole ? 'bg-primary/10 border-l-4 border-primary' : 'bg-white/5'}`}>
                                                <div className="flex justify-between items-center">
                                                    <input
                                                        value={line.role}
                                                        onChange={(e) => updateLine(index, { role: e.target.value })}
                                                        className="bg-transparent border-none outline-none font-bold text-sm text-primary w-24 focus:ring-1 focus:ring-primary rounded"
                                                    />
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => toggleRole(index)} className={`text-[10px] px-2 py-0.5 rounded ${line.isMyRole ? 'bg-primary text-white' : 'glass'}`}>
                                                            {line.isMyRole ? '自分の役' : '他の役'}
                                                        </button>
                                                        <button onClick={() => deleteLine(index)} className="text-[10px] px-2 py-0.5 rounded bg-destructive/20 hover:bg-destructive text-destructive-foreground">
                                                            削除
                                                        </button>
                                                    </div>
                                                </div>
                                                {memoMode && line.isMyRole && maskedIndices.has(index) ? (
                                                    <p className="cursor-pointer bg-white/20 text-transparent rounded select-none p-1" onClick={() => toggleMask(index)}>
                                                        {line.text}
                                                    </p>
                                                ) : (
                                                    <textarea
                                                        rows={1}
                                                        value={line.text}
                                                        onChange={(e) => updateLine(index, { text: e.target.value })}
                                                        className="bg-transparent border-none outline-none w-full text-base resize-none focus:ring-1 focus:ring-primary rounded p-1"
                                                    />
                                                )}
                                            </div>
                                        </React.Fragment>
                                    ))}
                                    <button onClick={() => addLine(lines.length - 1)} className="w-full py-2 border-2 border-dashed border-white/10 rounded-lg text-xs opacity-50 hover:opacity-100">
                                        ＋ セリフを追加
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="glass rounded-xl p-6 flex flex-col gap-6 items-center">
                    <h3 className="text-lg font-bold w-full text-center border-b pb-2">練習コントロール</h3>
                    <div className="w-32 h-32 rounded-full border-4 border-primary/30 flex items-center justify-center relative">
                        <button
                            onClick={() => isRecording ? stopRecording() : startRecording()}
                            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-destructive animate-pulse' : 'premium-gradient shadow-lg'}`}
                        >
                            {isRecording ? (
                                <div className="w-8 h-8 bg-white rounded-sm" />
                            ) : (
                                <svg className="w-10 h-10 text-white fill-current" viewBox="0 0 24 24">
                                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="text-center space-y-1">
                        <p className="font-medium">{isRecording ? '録音中...' : '待機中'}</p>
                        {audioUrl && !isRecording && (
                            <div className="pt-2 flex flex-col items-center gap-2">
                                <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
                                <button className="text-xs text-primary hover:underline">この音声をAI分析する</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="glass rounded-xl p-6 min-h-[200px]">
                    <h3 className="text-lg font-bold border-b pb-2 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                         ツールガイド
                    </h3>
                    <p className="text-sm text-muted-foreground italic">
                        マイクボタンを押して録音を開始します。自分の声を客観的に聴くことで、演技の改善点が明確になります。
                    </p>
                </div>

                <AccentTool />
            </div>
        </div>
    );
}

import AccentTool from "./AccentTool";
