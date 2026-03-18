"use client";

import React, { useState, useEffect } from "react";
import VocalTraining from "./VocalTraining";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

export default function Training() {
    const [currentGenre, setCurrentGenre] = useState("発声の基本");
    const [practiceText, setPracticeText] = useState("");
    const [isFetching, setIsFetching] = useState(false);
    const [aiAdvice, setAiAdvice] = useState<string | null>(null);
    const [isFetchingAdvice, setIsFetchingAdvice] = useState(false);
    const [sampleAudioUrl, setSampleAudioUrl] = useState<string | null>(null);
    const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
    const [isVertical, setIsVertical] = useState(false);

    const trainingGenres = ["発声の基本", "あめんぼ", "滑舌", "外郎売"];

    const fetchRandomScript = async (genre: string) => {
        setIsFetching(true);
        try {
            const response = await fetch(`${API_BASE}/practice/random?genre=${encodeURIComponent(genre)}`);
            if (response.ok) {
                const data = await response.json();
                setPracticeText(data.text);
                setCurrentGenre(genre);
                setAiAdvice(null);
                setSampleAudioUrl(null);
                // 外郎売は自動で縦書きにする
                if (genre === "外郎売") {
                    setIsVertical(true);
                } else {
                    setIsVertical(false);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsFetching(false);
        }
    };

    const handleTTS = async () => {
        if (!practiceText) return;
        setIsGeneratingSpeech(true);
        try {
            const url = `${API_BASE}/ai/tts?text=${encodeURIComponent(practiceText)}&voice=shimmer`;
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

    const handleGetAdvice = async () => {
        if (!practiceText) return;
        setIsFetchingAdvice(true);
        try {
            const response = await fetch(`${API_BASE}/ai/advice`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: practiceText, genre: currentGenre }),
            });
            if (response.ok) {
                const data = await response.json();
                setAiAdvice(data.advice);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsFetchingAdvice(false);
        }
    };

    useEffect(() => {
        fetchRandomScript("発声の基本");
    }, []);

    return (
        <div className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="glass rounded-xl p-6 min-h-[70vh] flex flex-col gap-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h2 className="text-xl font-bold">基礎トレーニング</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsVertical(!isVertical)}
                                className={`px-3 py-1 rounded-full text-xs transition-colors ${isVertical ? 'bg-primary text-white' : 'glass hover:bg-white/10'}`}
                            >
                                {isVertical ? '横書きに戻す' : '縦書きにする'}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 py-2">
                        {trainingGenres.map(genre => (
                            <button
                                key={genre}
                                onClick={() => fetchRandomScript(genre)}
                                className={`px-4 py-2 rounded-lg text-sm transition-all border ${currentGenre === genre ? 'premium-gradient border-transparent text-white scale-105' : 'glass border-white/5 hover:border-primary/50 opacity-70'}`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>

                    {currentGenre === "発声の基本" ? (
                        <div className="flex-1 w-full h-[600px] max-h-[70vh]">
                            <VocalTraining />
                        </div>
                    ) : (
                        <div className={`flex-1 flex flex-col ${isVertical ? 'items-stretch justify-start overflow-x-auto' : 'items-center justify-center text-center'} p-8 gap-8 border border-white/5 rounded-xl bg-white/5 overflow-hidden`}>
                            <div className={`w-full flex flex-col ${isVertical ? 'items-end' : 'items-center max-w-2xl mx-auto'}`}>
                                <span className={`text-[10px] uppercase tracking-[0.2em] text-primary font-bold bg-primary/10 px-3 py-1 rounded-full mb-6 inline-block self-center`}>
                                    {currentGenre}
                                </span>

                                <div className={`${isVertical ? 'tategaki w-full h-[50vh] min-h-[400px] max-h-[600px] overflow-x-auto overflow-y-hidden text-left' : 'text-xl md:text-2xl whitespace-pre-wrap'} font-bold leading-relaxed transition-opacity duration-300 ${isFetching ? 'opacity-30' : 'opacity-100'}`}>
                                    {practiceText || "トレーニングをロード中..."}
                                </div>
                            </div>

                            <div className={`flex gap-4 mt-auto pt-8 ${isVertical ? 'justify-center w-full' : 'justify-center'}`}>
                                <button onClick={() => fetchRandomScript(currentGenre)} className="text-xs flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    別のパターン
                                </button>
                                <button onClick={handleTTS} disabled={isGeneratingSpeech} className="text-xs flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                    {isGeneratingSpeech ? "生成中..." : "お手本を聴く"}
                                </button>
                                <button onClick={handleGetAdvice} disabled={isFetchingAdvice} className="text-xs flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity text-primary">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                    {isFetchingAdvice ? "分析中..." : "練習のコツを確認"}
                                </button>
                            </div>

                            {sampleAudioUrl && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-300 self-center">
                                    <audio src={sampleAudioUrl} autoPlay controls className="h-8 w-48" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="glass rounded-xl p-6 min-h-[300px]">
                    <h3 className="text-lg font-bold border-b pb-2 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        トレーニングガイド
                    </h3>
                    {aiAdvice ? (
                        <div className="text-sm leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {aiAdvice}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">
                            「練習のコツを確認」ボタンを押すと、このトレーニングの効果的な進め方や意識するポイントをAIがアドバイスします。
                        </p>
                    )}
                </div>

                <div className="glass rounded-xl p-6">
                    <h4 className="font-bold text-sm mb-4">基礎練習の秘訣</h4>
                    <ul className="text-xs space-y-3 opacity-80">
                        <li className="flex gap-2">
                            <span className="text-primary">•</span>
                            <span>毎日15分、声を出す前にこのトレーニングを行うことで、演技の質が劇的に向上します。</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-primary">•</span>
                            <span>腹式呼吸は全ての基本です。姿勢を正し、リラックスして取り組みましょう。</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-primary">•</span>
                            <span>外郎売は「正確さ」を優先し、慣れてきたらスピードを上げてみてください。</span>
                        </li>
                    </ul>
                </div>

                <AccentTool />
            </div>
        </div>
    );
}

import AccentTool from "./AccentTool";
