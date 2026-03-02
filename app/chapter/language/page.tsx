"use client";
import { useEffect, useState, useRef } from 'react';
import JsEditor from '@/components/JsEditor';
import DatasetPanel, { type Dataset, type DatasetPanelHandle, type EvaluationResult } from '@/app/chapter/language/components/DatasetPanel';
import ModelInsightPanel, { type ModelInsightPanelHandle } from '@/app/chapter/language/components/ModelInsightPanel';
import { useResizer } from '@/lib/hooks/useResizer';
import { type Tutorial } from "@/lib/Tutorial";
import StageControllerPanel from "@/components/StageController";

const tutorial: Tutorial = {
  stages: [
    {
      description: "出力が言葉になって、連なって",
      guide: [
        { element: '#dataset-container', popover: { title: '単語の並び', description: '入力単語の並びです' } },
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


const IMPORT_SCRIPT_NAMES = [
  'MultiHeadAttention.js',
  'SliceLayer.js',
  'TiedEmbeddingOutput.js',
  'OneHotLayer.js',
  'WeightedLayer.js',
  'SumLayer.js'
] as const;
const MAIN_SCRIPT_NAME = 'main.js';
const SCRIPT_BASE_PATH = '/chapter/language/';

type ImportScripts = Record<typeof IMPORT_SCRIPT_NAMES[number], string>;

const initialImportScripts: ImportScripts = IMPORT_SCRIPT_NAMES.reduce((acc, name) => {
  acc[name] = '';
  return acc;
}, {} as ImportScripts);



export default function Home() {
  console.log("LANGUAGE HOME")
  const [importScripts, setImportScripts] = useState<ImportScripts>(initialImportScripts);
  const [mainScript, setMainScript] = useState<string>('');
  const [dataset, setDataset] = useState<Readonly<Dataset> | null>(null);
  const datasetPanelRef = useRef<DatasetPanelHandle>(null);
  const modelInsightPanelRef = useRef<{ [modelName: string]: ModelInsightPanelHandle }>({});
  const testPatternSelectRef = useRef<HTMLSelectElement>(null);
  const { leftWidth, containerRef, handleMouseDown } = useResizer(50, 20, 80);

  function onDatasetChange(dataset: Readonly<Dataset>) {
    setDataset(dataset);
    if (testPatternSelectRef.current) {
      testPatternSelectRef.current.value = "0";
    }
    if (modelInsightPanelRef.current) {
      Object.values(modelInsightPanelRef.current).forEach(panel => panel.updateDataset(dataset, 0));
    }
  }
  function onEvaluationUpdate(resultSet: { modelName: string, results: EvaluationResult[] }) {
    // console.log("onEvaluationUpdate", resultSet);
    datasetPanelRef.current?.updatePredictions(resultSet);
    modelInsightPanelRef.current[resultSet.modelName].updateModelInsight(resultSet);
  }
  function onLearningStatusUpdate(status: string) {
    // console.log("onLearningStatusUpdate", status);
    if (status === "started") {
      datasetPanelRef.current?.clearPredictions();
    }
  }

  useEffect(() => {
    Promise.all(([MAIN_SCRIPT_NAME, ...IMPORT_SCRIPT_NAMES] as const).map(filename =>
      fetch(`${SCRIPT_BASE_PATH}${filename}`)
        .then(res => res.text())
        .then(text => ({ filename, text }))
    )).then(results => {
      const loadedScripts = results.reduce((acc, { filename, text }) => {
        if (filename === MAIN_SCRIPT_NAME) {
          acc[0] = text;
        } else {
          acc[1][filename] = text;
        }
        return acc;
      }, ["", {}] as [string, ImportScripts]);

      setMainScript(loadedScripts[0]);
      setImportScripts(loadedScripts[1]);
    }).catch(error => {
      console.error('Error loading scripts:', error);
    })
  }, []);


  return (
    <div className="h-full min-h-0 grid grid-rows-[auto_1fr_auto] gap-1 bg-inherit">
      {/* 指令エリア */}
      <StageControllerPanel tutorial={tutorial} />

      {/* Main Content */}
      <main className="flex bg-inherit overflow-hidden bg-inherit">
        {/* Container: Flex Row on MD screens to put Left and Right side-by-side */}
        <div ref={containerRef} className="container-panel md:flex-row h-full bg-inherit">

          {/* Left Panel: Merged Height (Full Height of container) */}
          <div className="left-panel flex flex-col" style={{ width: `${leftWidth}%`, flexShrink: 0 }} >
            <h3 className="text-base font-bold mb-3">ニューラルネットワークの構造</h3>
            <JsEditor
              path="chapter/language/main.js"
              updateHandler={[
                { onUpdate: onEvaluationUpdate, messageType: "evaluation" },
                { onUpdate: onLearningStatusUpdate, messageType: "learning-status" },
              ]}
              externalScripts={({ ...importScripts, 'dataset.js': dataset })}
              defaultValue={mainScript}
            />
          </div>

          {/* リサイザー */}
          <div
            onMouseDown={handleMouseDown}
            className="w-2 flex-shrink-0 cursor-col-resize hover:bg-blue-900 active:bg-blue-500 transition-colors duration-150 rounded"
          />

          {/* Right Column Wrapper: Stacks Upper and Lower panels */}
          <div className="flex flex-col gap-4 min-w-0 flex-1 bg-inherit">
            {/* Upper Right Panel */}
            <div id="model-insight-container" className="right-panel h-auto flex-none bg-inherit">
              <div className="font-semibold mb-2">計算プロセス</div>
              <div className="bg-inherit">
                <label htmlFor="test-pattern-index">テストパターン</label>
                <select className="bg-inherit" id="test-pattern-index" ref={testPatternSelectRef}
                  onChange={(e) => {
                    if (modelInsightPanelRef.current && dataset) {
                      Object.values(modelInsightPanelRef.current).forEach(panel => panel.updateDataset(dataset, Number(e.target.value)));
                    }
                  }}>
                  {dataset?.test_patterns.map((_, index) => (
                    <option key={index} value={index}>{index}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-row flex-wrap gap-2">
                {["llm", "gap", "fnn"].map(modelName => (
                  <ModelInsightPanel
                    key={modelName}
                    modelName={modelName}
                    ref={el => { if (el) modelInsightPanelRef.current[modelName] = el; }} />
                ))}
              </div>
            </div>
            {/* Lower Right Panel */}
            <div id="dataset-container" className="right-panel h-auto flex-1 flex flex-col min-h-0 overflow-y-auto bg-inherit">
              <DatasetPanel
                ref={datasetPanelRef}
                onDatasetChange={onDatasetChange} />
            </div>
          </div>

        </div>
      </main >
    </div >
  );
}
