import React, { useState } from 'react';

const sections = [
    {
        id: "warmup", title: "ウォームアップ", content: (
            <>
                <p className="mb-4">まずは体をほぐします。体が固いと声も出にくくなります。</p>
                <div className="font-bold mb-2 text-primary">やること</div>
                <ul className="list-disc pl-5 space-y-1 mb-4 opacity-90">
                    <li>屈伸</li>
                    <li>震脚</li>
                    <li>深い震脚</li>
                    <li>アキレス腱ストレッチ</li>
                    <li>腕クロス</li>
                    <li>腕を後ろに回す</li>
                    <li>手首・足首を回す</li>
                </ul>
            </>
        )
    },
    {
        id: "breathing", title: "呼吸トレーニング", content: (
            <>
                <p className="mb-4">発声の基本は腹式呼吸です。</p>
                <div className="font-bold mb-2 text-primary">やり方</div>
                <ol className="list-decimal pl-5 space-y-1 mb-4 opacity-90">
                    <li>鼻で一気に息を吸う</li>
                    <li>音を出しながら息を吐く</li>
                    <li>限界まで吐ききる</li>
                </ol>
                <div className="bg-primary/10 border-l-4 border-primary p-3 rounded text-sm">
                    <div className="font-bold text-primary mb-1">💡 ポイント</div>
                    <ul className="list-disc pl-4">
                        <li>あごを上げない</li>
                        <li>お腹（丹田）を膨らませる<br /><span className="text-xs opacity-70">※丹田＝おへそより少し下</span></li>
                    </ul>
                </div>
            </>
        )
    },
    {
        id: "face", title: "顔の体操", content: (
            <>
                <p className="mb-4">顔の筋肉を動かして、発音しやすくします。</p>

                <h4 className="font-bold border-b border-white/10 pb-1 mb-3">①「あ」⇔「ん」</h4>
                <div className="bg-white/5 p-4 rounded-lg mb-4 text-center">
                    <p className="text-xl font-bold text-primary mb-2">顔を大きく広げる<br />↓<br />顔を中心に寄せる</p>
                    <p className="text-sm">これを繰り返します。</p>
                </div>
                <div className="bg-primary/10 border-l-4 border-primary p-3 rounded text-sm mb-6">
                    <div className="font-bold text-primary mb-1">💡 ポイント</div>
                    <ul className="list-disc pl-4">
                        <li>口を大きく開ける</li>
                        <li>眉を上げる</li>
                        <li>目も大きく開く</li>
                    </ul>
                </div>

                <h4 className="font-bold border-b border-white/10 pb-1 mb-3">②「い」⇔「う」</h4>
                <p className="mb-4">口だけではなく顔全体を動かすようにしましょう。</p>
            </>
        )
    },
    {
        id: "core", title: "体幹トレーニング", content: (
            <>
                <h4 className="font-bold mb-2">プランク</h4>
                <p className="mb-2">体幹を鍛えると声が安定します。</p>
                <p className="mb-4">姿勢をまっすぐにしてお腹に力を入れてキープ。</p>
            </>
        )
    },
    {
        id: "vowels", title: "母音発声", content: (
            <>
                <p className="mb-4">口の形を意識して発声します。</p>
                <div className="font-bold mb-2 text-primary">練習</div>
                <div className="bg-white/5 p-4 rounded-lg font-mono text-lg mb-4 tracking-widest leading-loose text-center">
                    あえいうえおあお<br />
                    かけきくけこかこ<br />
                    させしすせそさそ<br />
                    たてちつてとたと<br />
                    なねにぬねのなの
                </div>
                <div className="font-bold mb-2 text-primary">次に</div>
                <p className="text-center font-bold text-xl tracking-widest mb-4">あかさたな</p>
                <div className="font-bold mb-2 text-primary">そのあと</div>
                <p className="text-center font-bold text-xl tracking-widest mb-4">はまやらわ</p>
            </>
        )
    },
    {
        id: "longtone", title: "ロングトーン", content: (
            <>
                <p className="mb-4">声を長く伸ばす練習です。<br />息を安定させて、できるだけ長く声を出すことを意識します。<br />2分間声を出します。</p>
                <div className="font-bold mb-2 text-primary">ポイント</div>
                <ul className="list-disc pl-5 space-y-1 mb-4 opacity-90">
                    <li>目線を1点に決める</li>
                    <li>舌の力を抜く</li>
                    <li>のどを開く</li>
                </ul>
                <div className="bg-primary/10 border-l-4 border-primary p-3 rounded text-sm">
                    <div className="font-bold text-primary mb-1">💡 意識</div>
                    <p>声を前だけでなく後ろにも飛ばす。</p>
                </div>
            </>
        )
    },
    {
        id: "liproll", title: "リップロール", content: (
            <>
                <p className="mb-2">唇を震わせて</p>
                <p className="text-2xl font-bold text-primary text-center my-4">プルルルル</p>
                <p className="mb-4">と音を出します。</p>

                <div className="bg-white/5 p-4 rounded-lg text-center mb-4">
                    <p className="font-bold">音を</p>
                    <p className="text-lg my-2">低い → 高い<br />高い → 低い</p>
                    <p className="font-bold">に動かします。</p>
                </div>
            </>
        )
    },
    {
        id: "tongueroll", title: "タンロール", content: (
            <>
                <p className="mb-4">舌を震わせる練習です。<br />リップロールと同じように音を上下させます。</p>
                <div className="bg-white/5 p-4 rounded-lg mb-4">
                    <p className="font-bold mb-2 text-primary">できない人は</p>
                    <p className="text-2xl font-bold text-center my-4">ららららら</p>
                    <p className="text-sm">と細かく発音しましょう。</p>
                </div>
            </>
        )
    },
    {
        id: "articulation", title: "滑舌練習", content: (
            <>
                <p className="mb-4">顔全体を使って発音します。</p>
                <div className="bg-primary/10 border-l-4 border-primary p-3 rounded text-sm mb-4">
                    <div className="font-bold text-primary mb-1">💡 ポイント</div>
                    <ul className="list-disc pl-4">
                        <li>口だけ動かさない</li>
                        <li>顔の筋肉をしっかり使う</li>
                    </ul>
                </div>
            </>
        )
    }
];

export default function VocalTraining() {
    const [activeSection, setActiveSection] = useState(sections[0].id);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        let currentSectionId = activeSection;

        for (const section of sections) {
            const element = document.getElementById(section.id);
            if (element) {
                // コンテナの上から何ピクセルか
                const relativeTop = element.offsetTop - container.scrollTop;
                if (relativeTop >= 0 && relativeTop < 200) {
                    currentSectionId = section.id;
                }
            }
        }

        if (currentSectionId !== activeSection) {
            setActiveSection(currentSectionId);
        }
    };

    const scrollTo = (id: string) => {
        const element = document.getElementById(id);
        const container = document.getElementById('vocal-training-scroll-container');
        if (element && container) {
            container.scrollTo({
                top: element.offsetTop - 20, // slightly offset
                behavior: 'smooth'
            });
            setActiveSection(id);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-white/5 rounded-xl border border-white/5 overflow-hidden">
            {/* 左側：目次 */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 p-4 shrink-0 flex flex-col h-48 md:h-full overflow-y-auto">
                <h3 className="font-bold text-lg mb-4 sticky top-0 bg-[#162032] py-2 z-10">目次</h3>
                <nav className="flex flex-col gap-1 relative">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => scrollTo(s.id)}
                            className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === s.id
                                ? 'bg-primary/20 text-primary font-bold'
                                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                }`}
                        >
                            {s.title}
                        </button>
                    ))}
                </nav>
            </div>

            {/* 右側：コンテンツ */}
            <div
                id="vocal-training-scroll-container"
                className="flex-1 p-6 md:p-10 overflow-y-auto relative scroll-smooth"
                onScroll={handleScroll}
                style={{ height: '600px', maxHeight: '70vh' }}
            >
                <div className="max-w-2xl mx-auto pb-32">
                    <h2 className="text-3xl font-extrabold mb-8 premium-text border-b border-white/10 pb-4 tracking-wider">
                        発声トレーニング
                    </h2>

                    <div className="space-y-16">
                        {sections.map(section => (
                            <section key={section.id} id={section.id} className="scroll-mt-6">
                                <h3 className="text-2xl font-bold mb-6 flex items-center">
                                    {section.title}
                                </h3>
                                <div className="text-base leading-relaxed opacity-90">
                                    {section.content}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
