"use client";
import { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";

const buildIframeErrorHandlerScript = `
<script>
    (function () {
        window.onerror = function (message, source, lineno, colno, error) {
            window.parent.postMessage({
                type: 'iframe-error',
                message,
                source,
                lineno,
                colno,
            },'*');
        };
    })();
</script >`.replace(/[\r\n\t ]+/g, "");

export default function App() {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const workerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function onStartLearn() {
        const editor_output_elem = document.querySelector(".editor_output") as HTMLIFrameElement;

        if (workerRef.current) {
            workerRef.current.terminate();
            clearTimeout(workerTimerRef.current!);
        }
        workerRef.current = new Worker('/workers/worker.js', { type: 'module' });
        workerTimerRef.current = setTimeout(() => {
            workerRef.current?.terminate();
            workerRef.current = null;
            console.log("JavaScriptが終了しません");
        }, 2000);
        workerRef.current.addEventListener('message', e => {
            workerRef.current?.terminate();
            workerRef.current = null;
            clearTimeout(workerTimerRef.current!);
            console.log("Workerによる実行チェックOK");

            // editor_output_elem!.srcdoc = editorRef.current!.getValue();
        });
        workerRef.current.postMessage({ code: editorRef.current!.getValue() })
    }

    // iframeからのメッセージの取得
    useEffect(() => {
        const handleMessage = (e: Event) => {
            console.log("handleMessage", e);
        }
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    return (
        <>
            <iframe className="editor_output" style={{ display: "none" }}></iframe>
            <Editor
                height="80%"
                defaultLanguage="javascript"
                theme="vs-dark"
                onMount={(editor, monaco) => editorRef.current = editor}
                options={{
                    fontSize: 12,
                    lineNumbers: 'off',
                    minimap: {
                        enabled: false,
                    },
                }}
                defaultValue={`
/*
async function setup() {
  const data = {
    "原点通る直線": [[-1, -1], [0, 0], [1, 1], [2, 2],],
    "原点通る折れ線": [[-1, -2], [0, 0], [1, 2], [2, 1],],
    "原点通らない直線": [[-1, -2], [0, -1], [1, 0], [2, 1],],
    "原点通らない折れ線": [[-1, -3], [0, -1], [1, 1], [2, 0],],
  };

  const { values, ranges, tensors } = await getDataset(
    data?.["原点通らない折れ線"],
  );
  updateScatterplot({ values: [[], values], ranges });
  const model = createModel({
    units: 2,
    useBias: true,
    LearningRate: 0.05,
  });
  setupVisor({ onStart: async () => await learn({ epochs: 50, model, values, ranges, tensors }), });
}
document.addEventListener("DOMContentLoaded", setup);
*/`}
            />
            <button className="px-3 py-1 text-xs font-semibold text-gray-200 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700"
                onClick={e => onStartLearn()}>AIが学習する</button>
        </>
    );
}
