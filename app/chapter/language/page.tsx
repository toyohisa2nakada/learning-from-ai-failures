"use client";
import { useEffect, useState } from 'react';
import Editor from "@/components/JsEditor";

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

      console.log(loadedScripts)
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
          <div className="left-panel h-full flex flex-col">
            <h3 className="text-base font-bold mb-3">Left Panel (Merged)</h3>
            <Editor
              path="chapter/language/main.js"
              externalScripts={importScripts}
              defaultValue={mainScript}
            />
          </div>

          {/* Right Column Wrapper: Stacks Upper and Lower panels */}
          <div className="flex flex-col flex-1 gap-6 h-full min-w-0">
            {/* Upper Right Panel */}
            <div className="right-panel h-auto flex-1 flex flex-col">
              <h3 className="text-base font-bold mb-3">Upper Right</h3>
            </div>
            {/* Lower Right Panel */}
            <div className="right-panel h-auto flex-1 flex flex-col">
              <h3 className="text-base font-bold mb-3">Lower Right</h3>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
