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
          <div id="upper-panel" className="upper-panel items-start">

            {/* パラメータ設定 */}
            <div id="parameter-control" className="left-panel h-[200px] overflow-y-auto">
              {Array(4).fill(({ borderColor: "border-gray-800", sliderColor: "accent-gray-400" })).map((e, i) => (
                <div className={`${e.borderColor} mb-2 p-2 border-1 rounded-lg`} key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold">{`グラフ${i + 1}: `}<span className="text-gray-300">y =
                      w2 * tanh(w1 * x + b)</span></h3>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-1/3 pr-1">
                      <input type="range" id={`wIn${i}`} min="-10.0" max="10.0" step="0.001"
                        className={`w-full h-[6px] cursor-pointer my-[3px] ${e.sliderColor}`}
                        onChange={e => onChangeWeight(e.target.id, e.target.value)} />
                    </div>

                    <div className="w-1/3 pr-1">
                      <input type="range" id={`b${i}`} min="-10.0" max="10.0" step="0.001"
                        className={`w-full h-[6px] cursor-pointer my-[3px] ${e.sliderColor}`}
                        onChange={e => onChangeWeight(e.target.id, e.target.value)} />
                    </div>

                    <div className="w-1/3 pr-1">
                      <input type="range" id={`wOut${i}`} min="-10.0" max="10.0" step="0.001"
                        className={`w-full h-[6px] cursor-pointer my-[3px] ${e.sliderColor}`}
                        onChange={e => onChangeWeight(e.target.id, e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

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
