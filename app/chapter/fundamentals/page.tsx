export default function Home() {
  return (
    <>
      {/* 指令エリア */}
      <section className="bg-panel border border-line rounded-xl px-4 py-3 flex gap-4 items-start">
        指令エリア
      </section>

      {/* 操作と可視化 */}
      <main className="flex-1 flex items-center justify-center">
        <h1 className="text-2xl font-semibold">
          fundamentals
        </h1>
      </main>

      {/* 解説 */}
      <footer className="bg-panel border border-line rounded-xl px-4 py-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-sm">⑤ 解説</h3>
          <span className="text-xs px-2 py-1 rounded-full border border-line text-slate-400">
            操作後に開示
          </span>
        </div>
        <div className="text-sm text-slate-400 leading-relaxed">
          ここに「なぜそうなるか」の説明を表示します。
        </div>
      </footer>
    </>
  );
}