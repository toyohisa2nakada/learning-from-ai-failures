"use client"
import { useState, useRef } from "react";
import JsEditor from "@/components/JsEditor";
import NeuralNetGraph from "@/app/chapter/image-generation/components/NeuralNetGraph";

import DatasetView, { type DatasetViewHandle } from "@/app/chapter/image-generation/components/DatasetPanel";
import ImageGridPanel from "@/app/chapter/image-generation/components/ImageGridPanel";
import { type ImageOption } from "@/components/ImageSelect";

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
                  <button className={btnStatusManual} onClick={() => setProgrammingMode('manual')}>構造(手動で学習)</button>
                  <button className={btnStatusProgramming} onClick={() => setProgrammingMode('programming')}>自動(プログラムで学習)</button>
                </div>
              </div>
              {programmingMode === 'manual' ? <NeuralNetGraph /> :
                <JsEditor
                  updateHandler={[
                    { onUpdate: onImageUpdate, messageType: 'images' },
                    { onUpdate: onIntermediateImageUpdate, messageType: 'intermediateImages' }
                  ]}
                  externalScripts={() => ({ 'trainingData.js': `export const trainingData=${JSON.stringify(getCurrentTrainingData())};` })}
                  defaultValue={`
const config = {
    units: 8,
    useBias: true,
    learningRate: 0.005,
    epochs: 500,
};
function getTensor(dataArray) {
    const n = dataArray.length;
    const imgArray = [];
    dataArray.forEach(item => {
        const rgbData = [];
        // item.data is [R, G, B, A, R, G, B, A, ...]
        for (let i = 0; i < item.data.length; i += 4) {
            rgbData.push(item.data[i + 0] / 255);
            rgbData.push(item.data[i + 1] / 255);
            rgbData.push(item.data[i + 2] / 255);
        }
        imgArray.push(rgbData);
    });
    return {
        x: tf.tensor2d([...Array(n).keys()], [n, 1]),
        y: tf.tensor2d(imgArray, [n, dataArray[0].width * dataArray[0].height * 3]),
    };
}
function buildModel({ outputShape }) {
    const model = tf.sequential();
    const intermediateLayer = tf.layers.dense({
      inputShape: [1],
      units: config.units,
      useBias: config.useBias,
      activation: "tanh",
      name: 'intermediate',
    });
    model.add(intermediateLayer);
    model.add(
        tf.layers.dense({
            units: outputShape,
            useBias: false,
        }),
    );
    model.compile({
        optimizer: tf.train.adam(config.learningRate),
        loss: tf.losses.meanSquaredError,
        metrics: ["mse"],
    });

    const intermediateModel = tf.model({
        inputs: model.input,
        outputs: intermediateLayer.output,
    });

    return [model,intermediateModel];
}

import {trainingData} from "trainingData.js";
const tensors = getTensor(trainingData);
const [model,intermediateModel] = buildModel({ outputShape: tensors.y.shape[1] });
model.summary();
intermediateModel.summary();

function postWeights(){
  const range = [0.0,0.2,0.4,0.6,0.8,1.0];
  const input = tf.tensor2d(range, [range.length, 1]); // [6,1]

  {
    const images = model.predict(input).arraySync();
    const values = range.reduce((a,e,i)=>({...a,[e]:images[i]}),{})
    window.parent.postMessage({type:'images',values});
  }

  {
    const intermediateOutput = intermediateModel.predict(input); // [6,8]
    const expanded = intermediateOutput.expandDims(2); // [6, 8, 1]

    const outputLayer = model.layers[1];
    const weights = outputLayer.getWeights()[0]; // [8,6912]
    const weightsExpanded = weights.expandDims(0); // [1, 8, 6912]

    const images = expanded.mul(weightsExpanded).arraySync(); // [6, 8, 6912]
    const values = range.reduce((a,e,i)=>({...a,[e]:images[i]}),{});
    window.parent.postMessage({type:'intermediateImages',values});

    // test
    // {
    //   const summed = expanded.mul(weightsExpanded).sum(1); // [6, 6912]
    //   const matmulResult = intermediateOutput.matMul(weights); // [6, 6912]
    //   console.log("summed",summed.arraySync());
    //   console.log("matmulResult",matmulResult.arraySync());
    // }
  }

}

const history = await model.fit(tensors.x, tensors.y, {
    batchSize: tensors.x.shape[0],
    epochs: config.epochs,
    shuffle: true,
    callbacks:{
      onEpochEnd: ()=>{
        postWeights();
      }
    },
});
console.log("history",history);
console.log("last loss",history.history.loss[history.history.loss.length - 1]);
`}
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
