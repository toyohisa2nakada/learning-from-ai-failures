"use client"
import { useEffect, useState, useRef } from "react";
import JsEditor from "@/components/JsEditor";
import NeuralNetGraph from "@/app/chapter/image-generation/components/NeuralNetGraph";

import DatasetPanel, { type DatasetPanelHandle } from "@/app/chapter/image-generation/components/DatasetPanel";
import ImageGridPanel from "@/app/chapter/image-generation/components/ImageGridPanel";
import { type ImageOption } from "@/components/ImageSelect";

import { useResizer } from '@/lib/hooks/useResizer';
import { type Tutorial } from "@/lib/Tutorial";
import StageControllerPanel from "@/components/StageController";


const tutorial: Tutorial = {
  stages: [
    {
      description: "出力が複数になって画像になって",
      guide: [
        { element: '#graph-area-bottom', popover: { title: 'パラメータの設定', description: '進化させたい画像の元になる画像を２つ選んでね' } },
      ],
      quiz: {
        title: "問題", problems: [
          { question: "バイアスを移動すると個別グラフはどのように動きますか", choices: ["上下に移動する", "左右に移動する", "傾きが変わる"], correctIndex: [1] },
          { question: "重みw1を移動すると個別グラフはどのように動きますか", choices: ["上下に移動する", "左右に移動する", "傾きが変わる"], correctIndex: 2 },
        ]
      },
    },
  ]
}

const MAIN_SCRIPT_NAME = 'main.js';
const SCRIPT_BASE_PATH = '/chapter/image-generation/';

export default function Home() {
  console.log("Editor HOME")
  // 手動学習、自動（プログラム）学習の切り替え (manual / programming)
  const [programmingMode, setProgrammingMode] = useState('manual');
  const btnStates = ["bg-gray-700 text-gray-100 cursor-pointer p-1", "bg-transparent text-gray-500 cursor-pointer p-1",];
  const [btnStatusManual, btnStatusProgramming] = programmingMode === 'manual' ? [btnStates[0], btnStates[1]] : [btnStates[1], btnStates[0]];

  const [imageSelected0, setImageSelected0] = useState<ImageOption | undefined>();
  const [imageSelected1, setImageSelected1] = useState<ImageOption | undefined>();
  const datasetPanelRef = useRef<DatasetPanelHandle>(null);
  const imageGridPanelRef = useRef<any>(null);

  const { leftWidth, containerRef, handleMouseDown } = useResizer(50, 20, 80);

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
    datasetPanelRef.current?.updatePredictions(images as Record<string, number[]>);
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
      });
  }, []);



  return (
    <div className="h-full min-h-0 grid grid-rows-[auto_1fr_auto] gap-1 bg-inherit">
      {/* 指令エリア */}
      <StageControllerPanel tutorial={tutorial} />

      {/* Main Content */}
      <main className="flex min-w-0 w-full bg-inherit">
        <div ref={containerRef} id="container" className="container-panel h-full min-w-0 bg-inherit overflow-hidden p-2">

          {/* Left Panel: Merged Height (Full Height of container) */}
          <div className="left-panel flex flex-col overflow-hidden min-w-0" style={{ width: `${leftWidth}%`, flexShrink: 0 }}>
            <div className="flex justify-between items-center">
              <div className="text-base font-semibold m-0">ニューラルネットワークの構造</div>
              <div id="programming-mode-toggle" className="text-xs flex">
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

          {/* リサイザー */}
          <div
            onMouseDown={handleMouseDown}
            className="w-2 flex-shrink-0 cursor-col-resize hover:bg-blue-900 active:bg-blue-500 transition-colors duration-150 rounded"
          />

          {/* Right Column Wrapper: Stacks Upper and Lower panels */}
          <div className="flex flex-col gap-4 min-w-0 flex-1 bg-inherit">
            {/* 個別のグラフ */}
            <div id="graph-area-top" className="right-panel">
              <ImageGridPanel ref={imageGridPanelRef} />
            </div>
            {/* 画像生成結果 */}
            <div id="graph-area-bottom" className="right-panel">
              <DatasetPanel
                ref={datasetPanelRef}
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
