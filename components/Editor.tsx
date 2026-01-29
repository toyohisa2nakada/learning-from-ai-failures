"use client";
import { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { inlineHTML } from "@/lib/monaco-utils/inlineHTML";
import { removeLineComments } from "@/lib/monaco-utils/removeLineComments";
import { buildImportmap } from "@/lib/monaco-utils/buildImportmap";


// iframeに追加するエラー発生時に親ウィンドウにメッセージを送信するコード
const BUILD_IFRAME_ERROR_HANDLER_SCRIPT = `
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

// スクリプトのみのEditorで書かれた文字からHTMLにするためのテンプレート
const HTML_TEMPLATE = `
<html>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js"></script>
    <script type="module">__CODE__</script>
</html>`.replace(/[\r\n\t]+/g, "");

interface EditorProps {
    onUpdateWeight: (weights: Record<string, number>) => void;
}

export default function App({ onUpdateWeight }: EditorProps) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const workerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function injectImportmap(htmlString: string, files: Record<string, string>): string {
        // '//'のコメントをとる
        const filesNoComm = Object.entries(files).reduce((a, e) =>
            ({ ...a, [e[0]]: removeLineComments(e[1]) }), {} as Record<string, string>);
        // importmapを追加して返す
        return htmlString.replace(/(<html[^>]*>)/i, `$1${buildImportmap(files)}`);
    }

    function onStartLearn() {
        const editor_output_elem = document.querySelector(".editor_output") as HTMLIFrameElement;

        if (workerRef.current) {
            workerRef.current.terminate();
            clearTimeout(workerTimerRef.current!);
        }
        workerRef.current = new Worker(new URL('monaco-utils/worker.js', window.location.origin), { type: 'module' });
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

            // 外部のjsファイルをimportmapで取り込む。この例の場合、import {testtemp01234} from 'test.js'; で使用する。
            const files = { 'test.js': `export const testtemp01234=0;` };
            const htmlString = injectImportmap(HTML_TEMPLATE.replace('__CODE__', editorRef.current?.getValue() || ""), files);
            const { html: inlined_html, insertions } = inlineHTML(htmlString, files);
            const htmlStringWithErrorHandler = inlined_html.replace(/(<html[^>]*>)/i, `$1${BUILD_IFRAME_ERROR_HANDLER_SCRIPT}`);

            console.log(htmlStringWithErrorHandler)
            editor_output_elem!.srcdoc = htmlStringWithErrorHandler;

        });
        workerRef.current.postMessage({ code: editorRef.current!.getValue() })
    }

    // iframeからのメッセージの取得
    useEffect(() => {
        const handleMessage = (e: { data: Record<string, string | number | Record<string, number>> }) => {
            if (!e.data) {
                return;
            }
            if (e.data.type === 'iframe-error') {
                const info = e.data;
                // const { lineno, colno } = convert_iframe_error_position(info.lineno, info.colno);
                // set_error_in_iframe({ lineno, colno, message: info.message })
            } else if (e.data.type === 'weights') {
                const values = e.data.values as Record<string, number>;
                onUpdateWeight(values);
                /*
                editorに書くテスト用コード
                window.parent.postMessage({type:'weights',values:{ wIn1: 3.1, wOut1: -2.4 }});
                */
            }
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
async function getDataset(data) {
  if (data === undefined) {
    return {};
  }
  const series = {
    x: data.map((e) => e[0]),
    y: data.map((e) => e[1]),
  };
  return {
    values: data.map((e) => ({ x: e[0], y: e[1] })),
    ranges: {
      x: [Math.min(...series.x) - 0.5, Math.max(...series.x) + 0.5],
      y: [Math.min(...series.y) - 2.5, Math.max(...series.y) + 2.5],
    },
    tensors: {
      x: tf.tensor2d(series.x, [data.length, 1]),
      y: tf.tensor2d(series.y, [data.length, 1]),
    },
  };
}
const { values, ranges, tensors } = await getDataset([[-1, -3], [0, -1], [1, 1], [2, 0],]);
const [units,useBias,LearningRate,epochs] = [2,true,0.05,50];
const model = tf.sequential();
model.add(tf.layers.dense({
    inputShape:[1], activation:"tanh",
    units,useBias,
}),);
model.add(tf.layers.dense({ units: 1, useBias: false }));
model.compile({
    optimizer: tf.train.adam(LearningRate),
    loss: tf.losses.meanSquaredError,
    metrics: ["mse"],
});
const history = await model.fit(tensors.x,tensors.y,{
    batchSize: tensors.x.shape[0],shuffle:true,
    epochs,
});
const weights = {
    w1: model.layers[0].getWeights()[0].dataSync(),
    b: model.layers[0].getWeights()[1]?.dataSync(),
    w2: model.layers[1].getWeights()[0].dataSync(),
};
const weightValues = {
    wIn1: weights.w1[0],
    wIn2: weights.w1[1] || 0,
    wOut1: weights.w2[0],
    wOut2: weights.w2[1] || 0,
    b1: weights.b[0],
    b2: weights.b[1] || 0,
}
console.log(values);
window.parent.postMessage({type:'weights',values:weightValues});
`}
            />
            <button className="px-3 py-1 text-xs font-semibold text-gray-200 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700"
                onClick={e => onStartLearn()}>AIが学習する</button>
        </>
    );
}
