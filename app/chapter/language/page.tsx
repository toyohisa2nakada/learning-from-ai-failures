"use client";
import { useEffect, useState, useRef } from 'react';
import JsEditor from '@/components/JsEditor';
import DatasetPanel, { type Dataset, type DatasetPanelHandle, type EvaluationResult } from '@/app/chapter/language/components/DatasetPanel';
import ModelInsightPanel from '@/app/chapter/language/components/ModelInsightPanel';

const IMPORT_SCRIPT_NAMES = [
  'MultiHeadAttention.js',
  'SliceLayer.js',
  'TiedEmbeddingOutput.js',
  'OneHotLayer.js'
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

  function onDatasetChange(dataset: Readonly<Dataset>) {
    setDataset(dataset);
  }
  function onEvaluationUpdate(resultSet: { model: string, results: EvaluationResult[] }) {
    // console.log("onEvaluationUpdate", resultSet);
    datasetPanelRef.current?.updatePredictions(resultSet);
  }
  function onLearningStatusUpdate(status: string) {
    console.log("onLearningStatusUpdate", status);
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
      {/* Action Section */}
      <section className="action-section">
        指令：言語モデル
      </section>

      {/* Main Content */}
      <main className="flex bg-inherit overflow-hidden">
        {/* Container: Flex Row on MD screens to put Left and Right side-by-side */}
        <div className="container-panel md:flex-row h-full">

          {/* Left Panel: Merged Height (Full Height of container) */}
          <div className="left-panel flex flex-col">
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

          {/* Right Column Wrapper: Stacks Upper and Lower panels */}
          <div className="flex flex-col gap-4 min-w-0 flex-1 bg-inherit">
            {/* Upper Right Panel */}
            <div className="right-panel h-auto flex-none">
              <div className="font-semibold mb-2">計算プロセス</div>
              <div className="flex flex-row flex-wrap gap-2">
                <ModelInsightPanel />
                <ModelInsightPanel />
                <ModelInsightPanel />
              </div>
            </div>
            {/* Lower Right Panel */}
            <div className="right-panel h-auto flex-1 flex flex-col min-h-0 overflow-y-auto bg-inherit">
              <DatasetPanel
                ref={datasetPanelRef}
                onDatasetChange={onDatasetChange} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
