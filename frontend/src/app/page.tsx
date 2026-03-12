export default function Home() {
  return (
    <div className="flex flex-col items-center animate-in fade-in duration-700">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-4">
              <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl premium-text">
                SeriLog
              </h1>
              <p className="text-xl md:text-2xl font-bold tracking-wide text-primary">
                セリフ暗記サポートログ
              </p>

              <h2 className="text-2xl md:text-4xl font-bold mt-12 mb-6">
                覚えられないを、覚えられるに。
              </h2>

              <div className="mx-auto max-w-[700px] text-muted-foreground md:text-lg leading-loose space-y-6">
                <p>
                  セリフを覚えるのが苦手。<br />
                  何度読んでも頭に入らない。<br />
                  覚えたはずなのに、いざ言おうとすると出てこない。
                </p>
                <p>
                  SeriLogは、そんな人のための<br />
                  セリフ暗記サポートサイトです。
                </p>
                <p>
                  台本を覚えるための練習機能と、<br />
                  自分の声を録音できるログ機能で、<br />
                  あなたの上達を静かに支えます。
                </p>
                <p className="font-bold text-foreground">
                  ひとりでも、<br />
                  少しずつ確実に。<br />
                  SeriLogで、セリフ練習をはじめましょう。
                </p>
              </div>
            </div>

            <div className="space-x-4 pt-10">
              <a href="/training" className="inline-flex h-14 items-center justify-center rounded-full premium-gradient px-10 text-base font-bold text-white transition-transform hover:scale-105 shadow-lg shadow-primary/25">
                練習をはじめる
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-28 border-t glass bg-white/5">
        <div className="container px-4 md:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center text-center space-y-4 rounded-2xl p-8 transition-transform hover:-translate-y-2 glass">
              <div className="rounded-full bg-primary/20 p-5">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="text-xl font-bold">セリフ暗記サポート</h3>
              <p className="text-muted-foreground leading-relaxed mt-2 text-sm md:text-base">
                台本を一行ずつ確認したり、<br />
                隠して練習したり。<br />
                覚えるための機能を用意しています。
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 rounded-2xl p-8 transition-transform hover:-translate-y-2 glass">
              <div className="rounded-full bg-primary/20 p-5">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <h3 className="text-xl font-bold">録音ログ</h3>
              <p className="text-muted-foreground leading-relaxed mt-2 text-sm md:text-base">
                自分の声を録音して、<br />
                練習の記録を残すことができます。<br />
                昨日の自分と比べてみましょう。
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4 rounded-2xl p-8 transition-transform hover:-translate-y-2 glass">
              <div className="rounded-full bg-primary/20 p-5">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <h3 className="text-xl font-bold">少しずつ上達</h3>
              <p className="text-muted-foreground leading-relaxed mt-2 text-sm md:text-base">
                練習の積み重ねが、<br />
                あなたの自信になります。<br />
                SeriLogはその過程を支えます。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
