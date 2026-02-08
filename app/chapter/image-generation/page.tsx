"use client"
import { useEffect, useState } from "react";
import Editor from "@/components/Editor";
import NeuralNetGraph from "@/components/NeuralNetGraph";


import ImageComparisonPanel from "@/app/chapter/image-generation/components/ImageComparisonPanel";

export default function Home() {
  console.log("Editor HOME")
  // 手動で重みの変更
  function onChangeWeight(id: string, value: string): void {
  }
  // 手動学習、自動（プログラム）学習の切り替え (manual / programming)
  const [programmingMode, setProgrammingMode] = useState('programming');
  const btnStates = ["bg-gray-700 text-gray-100 cursor-pointer p-1", "bg-transparent text-gray-500 cursor-pointer p-1",];
  const [btnStatusManual, btnStatusProgramming] = programmingMode === 'manual' ? [btnStates[0], btnStates[1]] : [btnStates[1], btnStates[0]];

  useEffect(() => {
  });

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
              {Array(8).fill(({ borderColor: "border-gray-800", sliderColor: "accent-gray-400" })).map((e, i) => (
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
              <div className="flex justify-between items-center">
                <div className="text-base font-semibold m-0">ニューラルネットワークの構造</div>
                <div className="text-xs flex">
                  <button className={btnStatusManual} onClick={() => setProgrammingMode('manual')}>構造(手動で学習)</button>
                  <button className={btnStatusProgramming} onClick={() => setProgrammingMode('programming')}>自動(プログラムで学習)</button>
                </div>
              </div>
              {programmingMode === 'manual' ? <NeuralNetGraph /> : <Editor />}
            </div>

            {/* 画像生成結果 */}
            <div id="graph-area-bottom" className="right-panel">
              <ImageComparisonPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
