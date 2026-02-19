"use client";
import { useRef, useEffect } from "react";
import Editor, { loader, OnMount } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { inlineHTML } from "@/lib/monaco-utils/inlineHTML";
import { removeLineComments } from "@/lib/monaco-utils/removeLineComments";
import { buildImportmap } from "@/lib/monaco-utils/buildImportmap";

// Monaco Editorの重複読み込みを防ぐためのグローバルフラグ
declare global {
    interface Window {
        __MONACO_EDITOR_INITIALIZED__?: boolean;
    }
}

// loader設定を一度だけ実行
if (typeof window !== 'undefined' && !window.__MONACO_EDITOR_INITIALIZED__) {
    loader.config({ monaco: undefined });
    window.__MONACO_EDITOR_INITIALIZED__ = true;
}


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


interface JsEditorProps {
    defaultValue?: string;
    updateHandler?: {
        onUpdate: (data: any) => void;
        messageType: string;
    }[];
    externalScripts?: Record<string, string | object | null> | (() => Record<string, string | object | null>);
    path?: string;
}

export default function JsEditor({ defaultValue = "", updateHandler, externalScripts = {}, path }: JsEditorProps) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const workerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const statusRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLSpanElement>(null);

    function injectImportmap(htmlString: string, files: Record<string, string | object>, targetObject?: any): string {
        // '//'のコメントをとる
        const filesNoComm = Object.entries(files).reduce((a, [filename, content]) => {
            if (typeof content === 'string') {
                return { ...a, [filename]: removeLineComments(content) };
            }
            return { ...a, [filename]: content };
        }, {} as Record<string, string | object>);
        // importmapを追加して返す
        return htmlString.replace(/(<html[^>]*>)/i, `$1${buildImportmap(filesNoComm, targetObject)}`);
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

            // JsEditor標準の外部js
            const jsEditorExtJsCode: Record<string, string | object> = {
                'updateProgress.js': `export function updateProgress(percent) {
                    window.parent.postMessage({type:'updateProgress',values:percent});}`
            }

            // 外部のjsファイルをimportmapで取り込む。この例の場合、import {testtemp01234} from 'test.js'; で使用する。
            // const extJsCode = { 'trainingData.js': `export const trainingData=${JSON.stringify(getCurrentTrainingDataType())};` };
            const extJsCode = { ...jsEditorExtJsCode, ...(externalScripts instanceof Function ? externalScripts() : externalScripts) };


            const htmlString = injectImportmap(HTML_TEMPLATE.replace('__EDITOR_VALUE__', editorRef.current?.getValue() || ""), extJsCode as Record<string, string | object>, editor_output_elem);
            const { html: inlined_html, insertions } = inlineHTML(htmlString, extJsCode as Record<string, string | object>);
            const htmlStringWithErrorHandler = inlined_html.replace(/(<html[^>]*>)/i, `$1${BUILD_IFRAME_ERROR_HANDLER_SCRIPT}`);

            editor_output_elem!.srcdoc = htmlStringWithErrorHandler;

        });
        workerRef.current.postMessage({ code: editorRef.current!.getValue() })
    }

    // defaultValueが変更された場合にエディタの内容を更新する
    useEffect(() => {
        if (editorRef.current && defaultValue && editorRef.current.getValue() === "") {
            editorRef.current.setValue(defaultValue);
        }
    }, [defaultValue]);

    function updateProgress(percent: number) {
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
                return;
            } else if (e.data.type === 'updateProgress') {
                const percent = e.data.values as number;
                if (progressRef.current) {
                    progressRef.current.style.width = `${percent}%`;
                }
            }
            updateHandler?.forEach(handler => {
                if (e.data.type === handler.messageType) {
                    const data = e.data.values as Record<string, number | number[]>;
                    handler.onUpdate(data);
                }
            })
            /*
            editorに書くテスト用コード
            window.parent.postMessage({type:'weights',values:{ wIn1: 3.1, wOut1: -2.4 }});
            */
        }
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    return (
        <div className="flex flex-col h-full gap-2 overflow-hidden">
            <iframe className="editor_output" style={{ display: "none" }}></iframe>
            <div className="flex-1 min-h-0">
                <Editor
                    height="100%"
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
                    path={path}
                    defaultValue={defaultValue}
                />
            </div>
            <div className="flex flex-col gap-1">
                <button className="relative overflow-hidden px-3 py-1 text-xs font-semibold text-gray-200 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 w-full"
                    onClick={e => onStartLearn()}>
                    <span ref={progressRef} className="absolute left-0 top-0 h-full bg-blue-600/40 w-0" />
                    <span className="relative z-10">AIが学習する</span>
                </button>
                <div ref={statusRef} className="overflow-hidden whitespace-nowrap text-xs text-red-400 min-h-[1em]">
                </div>
            </div>
        </div>
    );
}
