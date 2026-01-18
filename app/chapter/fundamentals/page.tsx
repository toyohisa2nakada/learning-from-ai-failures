"use client"
import { useEffect } from "react";

export default function Home() {
  useEffect(() => { }, []);
  return (
    <>
      {/* 指令エリア */}
      <section className="bg-panel border border-line rounded-xl px-4 py-3 flex gap-4 items-start">
        指令エリア
      </section>

      {/* 操作と可視化 */}
      <main className="flex-1 flex items-center justify-center">
        <div id="container" className="max-w-7xl mx-auto shadow-2xl rounded-xl border border-slate-800/80">
          <h1 className="text-gray-800 text-2xl font-bold py-2 px-6 border-b border-slate-800/60">
            パラメータを変更して、グラフの可算結果が教師データを通るようにする
          </h1>

          <div id="main-layout" className="flex flex-col p-6 gap-6">

            <div id="upper-panel" className="flex flex-col md:flex-row gap-6">

              <div className="md:w-1/2">
                <div id="parameter-control"
                  className="p-3 rounded-lg shadow-xl ring-4 ring-offset-2 ring-indigo-400/30 ring-offset-transparent h-full">
                  <h3 className="text-gray-800 text-base font-bold mb-3">パラメータ設定</h3>

                  <div className="mb-3 p-2 border-8 border-red-300 rounded-lg bg-red-400/5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-pink-400">グラフ1: <span className="text-gray-800">y =
                        w2 * tanh(w1 * x + b)</span></h3>
                      <button id="reset-graph1"
                        className="px-3 py-1 text-xs font-semibold text-gray-200 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700">リセット</button>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-1/3 pr-1">
                        <label htmlFor="a1" className="text-xs font-medium text-gray-700 block">
                          <div className="flex items-center whitespace-nowrap">
                            <span className="flex-shrink">重み w1:</span>
                            <input type="number" id="a1-value" min="-10.0" max="10.0" step="0.001"
                              defaultValue="1.000"
                              className="font-bold text-red-600 w-12 text-right border border-gray-400 p-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-red-400 rounded" />
                          </div>
                        </label>
                        <input type="range" id="a1" min="-10.0" max="10.0" step="0.001" defaultValue="1.0"
                          className="accent-pink-400" />
                      </div>

                      <div className="w-1/3 pr-1">
                        <label htmlFor="b1" className="text-xs font-medium text-gray-700 block">
                          <div className="flex items-center whitespace-nowrap">
                            <span className="flex-shrink">バイアス b:</span>
                            <input type="number" id="b1-value" min="-10.0" max="10.0" step="0.001"
                              defaultValue="0.000"
                              className="font-bold text-red-600 w-12 text-right border border-gray-400 p-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-red-400 rounded" />
                          </div>
                        </label>
                        <input type="range" id="b1" min="-10.0" max="10.0" step="0.001" defaultValue="0.0"
                          className="accent-pink-400" />
                      </div>

                      <div className="w-1/3 pr-1">
                        <label htmlFor="c1" className="text-xs font-medium text-gray-700 block">
                          <div className="flex items-center whitespace-nowrap">
                            <span className="flex-shrink">重み w2:</span>
                            <input type="number" id="c1-value" min="-10.0" max="10.0" step="0.001"
                              defaultValue="1.000"
                              className="font-bold text-red-600 w-12 text-right border border-gray-400 p-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-red-400 rounded" />
                          </div>
                        </label>
                        <input type="range" id="c1" min="-10.0" max="10.0" step="0.001" defaultValue="1.0"
                          className="accent-pink-400" />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-2 border-8 border-blue-300 rounded-lg bg-blue-400/5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-sky-400">グラフ2: <span className="text-gray-800">y =
                        w2 * tanh(w1 * x + b)</span></h3>
                      <button id="reset-graph2"
                        className="px-3 py-1 text-xs font-semibold text-gray-200 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700">リセット</button>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-1/3 pr-1">
                        <label htmlFor="a2" className="text-xs font-medium text-gray-700 block">
                          <div className="flex items-center whitespace-nowrap">
                            <span className="flex-shrink">重み w1:</span>
                            <input type="number" id="a2-value" min="-10.0" max="10.0" step="0.001"
                              defaultValue="1.000"
                              className="font-bold text-blue-600 w-12 text-right border border-gray-400 p-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 rounded" />
                          </div>
                        </label>
                        <input type="range" id="a2" min="-10.0" max="10.0" step="0.001" defaultValue="1.0"
                          className="accent-sky-400" />
                      </div>

                      <div className="w-1/3 pr-1">
                        <label htmlFor="b2" className="text-xs font-medium text-gray-700 block">
                          <div className="flex items-center whitespace-nowrap">
                            <span className="flex-shrink">バイアス b:</span>
                            <input type="number" id="b2-value" min="-10.0" max="10.0" step="0.001"
                              defaultValue="0.000"
                              className="font-bold text-blue-600 w-12 text-right border border-gray-400 p-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 rounded" />
                          </div>
                        </label>
                        <input type="range" id="b2" min="-10.0" max="10.0" step="0.001" defaultValue="0.0"
                          className="accent-sky-400" />
                      </div>

                      <div className="w-1/3 pr-1">
                        <label htmlFor="c2" className="text-xs font-medium text-gray-700 block">
                          <div className="flex items-center whitespace-nowrap">
                            <span className="flex-shrink">重み w2:</span>
                            <input type="number" id="c2-value" min="-10.0" max="10.0" step="0.001"
                              defaultValue="-1.000"
                              className="font-bold text-blue-600 w-12 text-right border border-gray-400 p-0 bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 rounded" />
                          </div>
                        </label>
                        <input type="range" id="c2" min="-10.0" max="10.0" step="0.001" defaultValue="-1.0"
                          className="accent-sky-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:w-1/2">
                <div id="graph-area-top"
                  className="flex flex-col items-start justify-start bg-gray-100 p-4 rounded-lg shadow-inner w-full h-full">
                  <div className="flex items-center justify-between w-full mb-3">
                    <h3 className="text-base font-semibold text-gray-800 m-0">個別のグラフ (G1, G2)</h3>
                  </div>
                  <div className="chart-container mx-auto md:mx-0">
                    <canvas id="individual-graphs-canvas"></canvas>
                  </div>
                </div>
              </div>

            </div>


            <div id="lower-panel" className="flex flex-col md:flex-row gap-6">

              <div className="md:w-1/2">
                <div id="drawing-area"
                  className="relative bg-gray-100 p-4 rounded-lg shadow-inner w-full min-h-[250px] flex flex-col items-center justify-center border border-dashed border-slate-600 space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-800 m-0">ニューラルネットワークの構造</h2>
                    <h3 className="text-xs">
                      入力xに値がセットされ、バイアスには常に1が設定されます。各ニューロンは、その値を使って指定された計算式で値を求め、それらをすべて足し合わせたものが出力yとなります。</h3>
                  </div>
                  <svg id="circleSvg" viewBox="0 0 300 100" className="inset-0 w-full h-full"
                    xmlns="http://www.w3.org/2000/svg">

                    <defs>
                      <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5"
                        markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#888888" />
                      </marker>
                    </defs>

                    <line x1="50" y1="30" x2="130.3" y2="26.94" stroke="#888888" strokeWidth="0.8"
                      markerEnd="url(#arrowhead)" />

                    <line x1="50" y1="30" x2="130.3" y2="70.06" stroke="#888888" strokeWidth="0.8"
                      markerEnd="url(#arrowhead)" />

                    <line x1="50" y1="70" x2="130.3" y2="29.94" stroke="#888888" strokeWidth="0.8"
                      markerEnd="url(#arrowhead)" />

                    <line x1="50" y1="70" x2="130.3" y2="74.06" stroke="#888888" strokeWidth="0.8"
                      markerEnd="url(#arrowhead)" />

                    <line x1="150" y1="30" x2="235.3" y2="47.06" stroke="#888888" strokeWidth="0.8"
                      markerEnd="url(#arrowhead)" />

                    <line x1="150" y1="70" x2="235.3" y2="52.94" stroke="#888888" strokeWidth="0.8"
                      markerEnd="url(#arrowhead)" />

                    <text x="110" y="25" textAnchor="middle" fontSize="6" fill="#cbd5e1">w1 </text>
                    <text x="110" y="38" textAnchor="middle" fontSize="6" fill="#cbd5e1">b </text>
                    <text x="110" y="57" textAnchor="middle" fontSize="6" fill="#cbd5e1">w1 </text>
                    <text x="110" y="72" textAnchor="middle" fontSize="6" fill="#cbd5e1">b </text>
                    <text x="210" y="35" textAnchor="middle" fontSize="6" fill="#cbd5e1">w2 </text>
                    <text x="210" y="65" textAnchor="middle" fontSize="6" fill="#cbd5e1">w2 </text>


                    <circle cx="50" cy="30" r="15" fill="#0f172a" stroke="#888888" strokeWidth="1.5" />
                    <circle cx="50" cy="70" r="10" fill="#0f172a" stroke="#888888" strokeWidth="1.5" />

                    <circle cx="150" cy="25" r="20" fill="#291221" stroke="#f472b6" strokeWidth="1.5" />

                    <circle cx="150" cy="75" r="20" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />

                    <circle cx="250" cy="50" r="15" fill="#065f46" stroke="#22c55e" strokeWidth="1.5" />

                    <text x="50" y="32" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#e2e8f0">入力
                      x</text>
                    <text x="50" y="72" textAnchor="middle" fontSize="8" fontWeight="bold"
                      fill="#e2e8f0">バイアス</text>

                    <text x="150" y="27" textAnchor="middle" fontSize="8" fontWeight="bold"
                      fill="#e2e8f0">ニューロン
                      1</text>
                    <text x="150" y="77" textAnchor="middle" fontSize="8" fontWeight="bold"
                      fill="#e2e8f0">ニューロン
                      2</text>

                    <text x="250" y="52" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#e2e8f0">出力
                      y</text>
                  </svg>
                  <div>
                    <h3 className="text-xs">
                      AIは、この出力yが教師データと一致するように、自動的に重みwとバイアスの重みbを調整して決定します。なお、このツールの目的は、ユーザーがこれらの重みを直感的に試して手動で求めることです。
                    </h3>
                  </div>
                </div>
              </div>

              <div className="md:w-1/2">
                <div id="graph-area-bottom"
                  className="flex flex-col items-start justify-start bg-gray-100 p-4 rounded-lg shadow-inner w-full h-full">
                  <div className="flex items-center justify-between w-full mb-3">
                    <h3 className="text-base font-semibold text-gray-800 m-0">グラフの可算結果 (G1 + G2)</h3>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-700"><span className="font-semibold">誤差(MSE):</span> <span
                        id="mse-value">0.0000</span></div>
                    </div>
                  </div>

                  <div
                    className="target-settings mb-3 p-2 border-none rounded-lg bg-opacity-50 shadow-sm text-xs w-full">
                    <div className="flex items-center">
                      <label htmlFor="target-select"
                        className="mr-2 font-medium text-gray-800 whitespace-nowrap">目標点データ:</label>
                      <select id="target-select" defaultValue="0"
                        className="p-1 border-8 border-amber-200 rounded text-xs bg-opacity-50 ">
                        <option defaultValue="0">原点通る直線</option>
                        <option defaultValue="1">原点通る折れ線</option>
                        <option defaultValue="2">原点通らない直線</option>
                        <option defaultValue="3">原点通らない折れ線</option>
                      </select>
                    </div>
                  </div>

                  <div className="chart-container mx-auto md:mx-0">
                    <canvas id="sum-graph-canvas"></canvas>
                  </div>

                  <div
                    className="range-settings mt-3 p-2 border border-gray-300 rounded-lg bg-opacity-50 shadow-sm text-xs w-full">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-semibold text-gray-700 text-sm m-0">グラフ表示範囲設定</h4>
                      <button id="toggle-range-settings"
                        className="p-1 rounded-full text-gray-600 hover:bg-gray-200 transition"
                        aria-expanded="false" aria-controls="range-settings-content">
                        <svg id="toggle-icon"
                          className="w-4 h-4 transform rotate-0 transition-transform duration-300" fill="none"
                          stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M9 5l7 7-7 7"></path>
                        </svg>
                      </button>
                    </div>

                    <div id="range-settings-content" className="hidden">
                      <div className="flex flex-wrap justify-start gap-x-4 gap-y-2">

                        <div className="flex items-center">
                          <span className="mr-1 font-medium">X軸:</span>
                          <input type="number" id="x-min" defaultValue="-1.5" step="0.5"
                            className="range-input text-center border border-gray-300 rounded p-1" />
                          <span className="mx-1">〜</span>
                          <input type="number" id="x-max" defaultValue="2.5" step="0.5"
                            className="range-input text-center border border-gray-300 rounded p-1" />
                        </div>

                        <div className="flex items-center">
                          <span className="mr-1 font-medium">Y軸:</span>
                          <input type="number" id="y-min" defaultValue="-5" step="1"
                            className="range-input text-center border border-gray-300 rounded p-1" />
                          <span className="mx-1">〜</span>
                          <input type="number" id="y-max" defaultValue="4" step="1"
                            className="range-input text-center border border-gray-300 rounded p-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>


          </div>
        </div>
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