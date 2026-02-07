"use client"
import Image from "next/image";

export default function Home() {
  return (
    <div className="h-full min-h-0 grid grid-rows-[auto_1fr_auto] gap-1 bg-inherit">
      {/* 指令エリア */}
      <section className="action-section">
        指令：ポケモン進化を作る
      </section>
      {/* 操作と可視化 */}
      <main className="flex bg-inherit">
        <div id="container" className="container-panel">

          {/* 上部パネル */}
          <div id="upper-panel" className="upper-panel">

            {/* パラメータ設定 */}
            <div id="parameter-control" className="left-panel">
            </div>

            {/* 個別のグラフ */}
            <div id="graph-area-top" className="right-panel">
            </div>

          </div>

          {/* 下部パネル */}
          <div id="lower-panel" className="lower-panel">

            {/* ニューラルネットワークの構造 */}
            <div id="drawing-area" className="left-panel relative">
            </div>

            {/* グラフの可算結果 */}
            <div id="graph-area-bottom" className="right-panel">

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
