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
    <script type="module">__EDITOR_VALUE__</script>
</html>`.replace(/[\r\n\t]+/g, "");

/*
let latest_insertions = [];
function convert_iframe_error_position(lineno: string, colno: string) {
    const line_number = Number(lineno);
    const column_number = Number(colno);
    if (!Number.isFinite(line_number) || !Number.isFinite(column_number)) {
        return { lineno, colno };
    }

    let line_index = line_number - 1;
    const sorted_insertions = [...latest_insertions]
        .sort((a, b) => a.startLine - b.startLine || a.startColumn - b.startColumn);

    for (const insertion of sorted_insertions) {
        const diff = insertion.newLineCount - insertion.originalLineCount;
        const start = insertion.startLine;
        const end = insertion.startLine + insertion.newLineCount - 1;

        if (line_index < start) {
            continue;
        }

        if (line_index > end) {
            line_index -= diff;
            continue;
        }

        line_index = start;
        return { lineno: line_index + 1, colno };
    }

    return { lineno: line_index + 1, colno };
}
    */


interface EditorProps {
    defaultValue?: string;
    updateHandler?: {
        onUpdate: (data: Record<string, number>) => void;
        messageType: string;
    };
    externalScripts?: Record<string, string> | (() => Record<string, string>);
}

export default function App({ defaultValue = "", updateHandler, externalScripts = {} }: EditorProps) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const workerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const statusRef = useRef<HTMLDivElement>(null);

    function injectImportmap(htmlString: string, files: Record<string, string>): string {
        // '//'のコメントをとる
        const filesNoComm = Object.entries(files).reduce((a, e) =>
            ({ ...a, [e[0]]: removeLineComments(e[1]) }), {} as Record<string, string>);
        // importmapを追加して返す
        return htmlString.replace(/(<html[^>]*>)/i, `$1${buildImportmap(filesNoComm)}`);
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
            // const extJsCode = { 'trainingData.js': `export const trainingData=${JSON.stringify(getCurrentTrainingDataType())};` };
            const extJsCode = externalScripts instanceof Function ? externalScripts() : externalScripts;

            const htmlString = injectImportmap(HTML_TEMPLATE.replace('__EDITOR_VALUE__', editorRef.current?.getValue() || ""), extJsCode);
            const { html: inlined_html, insertions } = inlineHTML(htmlString, extJsCode);
            const htmlStringWithErrorHandler = inlined_html.replace(/(<html[^>]*>)/i, `$1${BUILD_IFRAME_ERROR_HANDLER_SCRIPT}`);

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
                if (statusRef.current) {
                    statusRef.current.textContent = `error L${info.lineno}:C${info.colno}`;
                }
            } else if (e.data.type === updateHandler?.messageType) {
                const data = e.data.values as Record<string, number>;
                updateHandler?.onUpdate(data);
                /*
                editorに書くテスト用コード
                window.parent.postMessage({type:'weights',values:{ wIn1: 3.1, wOut1: -2.4 }});
                */
            }
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
                defaultValue={defaultValue}
            />
            <button className="px-3 py-1 text-xs font-semibold text-gray-200 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700"
                onClick={e => onStartLearn()}>AIが学習する</button>
            <div ref={statusRef} className="overflow-hidden whitespace-nowrap">
            </div>
        </>
    );
}
