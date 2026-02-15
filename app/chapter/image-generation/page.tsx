"use client"
import { useEffect, useState, useRef } from "react";
import JsEditor from "@/components/JsEditor";
import NeuralNetGraph from "@/app/chapter/image-generation/components/NeuralNetGraph";

import DatasetView, { type DatasetViewHandle } from "@/app/chapter/image-generation/components/DatasetPanel";
import ImageGridPanel from "@/app/chapter/image-generation/components/ImageGridPanel";
import { type ImageOption } from "@/components/ImageSelect";

const MAIN_SCRIPT_NAME = 'main.js';
const SCRIPT_BASE_PATH = '/chapter/image-generation/';

export default function Home() {
  console.log("Editor HOME")
  // 手動で重みの変更
  function onChangeWeight(id: string, value: string): void {
  }
  // 手動学習、自動（プログラム）学習の切り替え (manual / programming)
  const [programmingMode, setProgrammingMode] = useState('programming');
  const btnStates = ["bg-gray-700 text-gray-100 cursor-pointer p-1", "bg-transparent text-gray-500 cursor-pointer p-1",];
  const [btnStatusManual, btnStatusProgramming] = programmingMode === 'manual' ? [btnStates[0], btnStates[1]] : [btnStates[1], btnStates[0]];

  const [imageSelected0, setImageSelected0] = useState<ImageOption | undefined>();
  const [imageSelected1, setImageSelected1] = useState<ImageOption | undefined>();
  const datasetViewRef = useRef<DatasetViewHandle>(null);
  const imageGridPanelRef = useRef<any>(null);

  const handleImageSelectChange = (index: 0 | 1, newValue: ImageOption) => {
    if (index === 0) setImageSelected0(newValue);
    else setImageSelected1(newValue);
  };

  function getCurrentTrainingData() {
    if (imageSelected0 === undefined || imageSelected1 === undefined) return null;
    return [imageSelected0, imageSelected1].map(sel => {
      const canvas = sel.icon as HTMLCanvasElement;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return {
        width: canvas.width,
        height: canvas.height,
        data: Array.from(imageData.data) // RGBA values as normal array
      };
    });
  }

  function onImageUpdate(images: Record<string, any>) {
    datasetViewRef.current?.updatePredictions(images as Record<string, number[]>);
  }

  function onIntermediateImageUpdate(images: Record<string, any>) {
    imageGridPanelRef.current?.updateImages(images as Record<string, number[][]>);
  }

  const [mainScript, setMainScript] = useState<string>('');
  useEffect(() => {
    fetch(`${SCRIPT_BASE_PATH}${MAIN_SCRIPT_NAME}`)
      .then(res => res.text())
      .then(text => {
        setMainScript(text);
      })
      .catch(error => {
        console.error('Error loading scripts:', error);
      })

  }, []);

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
            {/* h-[240px] */}
            <div id="parameter-control" className="left-panel overflow-y-auto">
              <h3 className="text-base font-bold mb-3">パラメータ設定</h3>

              {/* {Array(8).fill(({ borderColor: "border-gray-800", sliderColor: "accent-gray-400" })).map((e, i) => (
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
              ))} */}

            </div>

            {/* 個別のグラフ */}
            <div id="graph-area-top" className="right-panel">
              <ImageGridPanel ref={imageGridPanelRef} />
            </div>

          </div>

          {/* 下部パネル */}
          <div id="lower-panel" className="lower-panel">

            {/* ニューラルネットワークの構造 */}
            <div id="drawing-area" className="left-panel relative">
              <div className="flex justify-between items-center">
                <div className="text-base font-semibold m-0">ニューラルネットワークの構造</div>
                <div className="text-xs flex">
                  <button className={btnStatusManual} onClick={() => setProgrammingMode('manual')}>構造</button>
                  <button className={btnStatusProgramming} onClick={() => setProgrammingMode('programming')}>プログラム</button>
                </div>
              </div>
              {programmingMode === 'manual' ? <NeuralNetGraph /> :
                <JsEditor
                  path="chapter/image-generation/main.js"
                  updateHandler={[
                    { onUpdate: onImageUpdate, messageType: 'images' },
                    { onUpdate: onIntermediateImageUpdate, messageType: 'intermediateImages' }
                  ]}
                  externalScripts={() => ({ 'trainingData.js': `export const trainingData=${JSON.stringify(getCurrentTrainingData())};` })}
                  defaultValue={mainScript}
                />
              }
            </div>

            {/* 画像生成結果 */}
            <div id="graph-area-bottom" className="right-panel">
              <DatasetView
                ref={datasetViewRef}
                imageSelected0={imageSelected0}
                imageSelected1={imageSelected1}
                onImageSelectChange={handleImageSelectChange}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
