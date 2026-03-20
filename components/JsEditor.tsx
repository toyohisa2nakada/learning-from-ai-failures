"use client";
import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import Editor, { loader } from "@monaco-editor/react";
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

const BUTTON_LABELS = {
    ended: 'AIが学習する',
    preparing: '準備中...',
    started: '学習中...',
} as const;

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

interface JsEditorProps {
    path?: string;
    defaultValue?: string | null;
    updateHandler?: { onUpdate: (data: any) => void; messageType: string; }[];
    externalScripts?: Record<string, string | object | null> | (() => Record<string, string | object | null>);
    externallyCallableFunctions?: string[];
    decorationSpecs?: { [text: string]: string };
}

export interface JsEditorHandle {
    callExternallyCallableFunction: (params: { functionName: string, args: any[] }) => Promise<any>;
    canCallExternallyCallableFunction: (params: { functionName: string }) => boolean;
    resetCode: () => void;
}

export type FromIframeMessageData =
    | { type: 'iframe-error'; message: string; source: string; lineno: number; colno: number }
    | { type: 'updateProgress'; values: number }
    | { type: 'learning-status'; values: keyof typeof BUTTON_LABELS }
    | { type: 'registeredExternallyCallableFunction'; values: string }
    | { type: 'externallyCallableFunctionResult'; values: { functionName: string, result: any } }
    | { type: string & {}; values?: any }; // その他の動的なメッセージ（updateHandlerなど）用

const JsEditor = forwardRef<JsEditorHandle, JsEditorProps>(({
    path,
    defaultValue = null,
    updateHandler,
    externalScripts = {},
    externallyCallableFunctions = [],
    decorationSpecs = {}
}: JsEditorProps, ref) => {
    console.log("JsEditor");
    function canCallExternallyCallableFunction(functionName: string) {
        return externalFunctionResults.current?.hasOwnProperty(functionName);
    }
    useImperativeHandle(ref, () => ({
        callExternallyCallableFunction: (params) => {
            return new Promise((resolve, reject) => {
                if (canCallExternallyCallableFunction(params.functionName)) {
                    const editor_output_elem = document.querySelector(".editor_output") as HTMLIFrameElement;
                    externalFunctionResults.current[params.functionName].push(resolve);
                    editor_output_elem!.contentWindow!.postMessage(params, '*');
                } else {
                    resolve(`function '${params.functionName}' not found`);
                }
            })
        },
        canCallExternallyCallableFunction: (params: { functionName: string }) => {
            return canCallExternallyCallableFunction(params.functionName);
        },
        resetCode: () => {
            if (!editor || !defaultValue) return;
            const storageKey = `jseditor-${path}`;
            localStorage.removeItem(storageKey);
            editor.setValue(defaultValue);
        }
    }));
    const [editor, setEditor] = useState<editor.IStandaloneCodeEditor | null>(null);
    const workerRef = useRef<Worker | null>(null);
    const workerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const statusRef = useRef<HTMLDivElement>(null);
    const progressRef = useRef<HTMLSpanElement>(null);
    const buttonLabelRef = useRef<HTMLButtonElement>(null);
    const externalFunctionResults = useRef<{ [functionName: string]: ((value: any) => void)[] }>({});
    const [initialValue, setInitialValue] = useState<string | null>(null);

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
                    window.parent.postMessage({type:'updateProgress',values:percent});}`,
                'postLearningStatus.js': `export function postLearningStatus(status) {
                    window.parent.postMessage({ type: 'learning-status', values: status });}`,
                'externalCaller.js': `
                    const externallyCallableFunctions = {};
                    export function registerExternallyCallableFunction(functionName,fn){
                        externallyCallableFunctions[functionName] = fn;
                        window.parent.postMessage({ type: 'registeredExternallyCallableFunction', values: functionName });
                    }
                    window.addEventListener('message', e=>{
                        const { functionName, args } = e.data;
                        window.parent.postMessage({ type: 'externallyCallableFunctionResult', 
                            values: {functionName, result:externallyCallableFunctions[functionName]?.(...args) } });
                    });`
            }

            // 外部のjsファイルをimportmapで取り込む。この例の場合、import {testtemp01234} from 'test.js'; で使用する。
            // const extJsCode = { 'trainingData.js': `export const trainingData=${JSON.stringify(getCurrentTrainingDataType())};` };
            const extJsCode = { ...jsEditorExtJsCode, ...(externalScripts instanceof Function ? externalScripts() : externalScripts) };

            const htmlString = injectImportmap(HTML_TEMPLATE.replace('__EDITOR_VALUE__', editor?.getValue() || ""), extJsCode as Record<string, string | object>, editor_output_elem);
            const { html: inlined_html, insertions } = inlineHTML(htmlString, extJsCode as Record<string, string | object>);
            const htmlStringWithErrorHandler = inlined_html.replace(/(<html[^>]*>)/i, `$1${BUILD_IFRAME_ERROR_HANDLER_SCRIPT}`);

            if (buttonLabelRef.current) buttonLabelRef.current.textContent = BUTTON_LABELS.preparing;
            editor_output_elem!.srcdoc = htmlStringWithErrorHandler;
        });
        workerRef.current.postMessage({ code: editor!.getValue() })
    }

    // デコレーションの適用
    useEffect(() => {
        if (!editor || !Object.keys(decorationSpecs).length) return;
        const model = editor.getModel();
        if (!model) return;
        const newDecorations = Object.entries(decorationSpecs).flatMap(([text, className]) => {
            const matches = model.findMatches(text, true, false, true, null, true);

            return matches.map(match => ({
                range: match.range,
                options: {
                    inlineClassName: className,
                    stickiness: 1
                }
            }));
        });
        const collection = editor.createDecorationsCollection(newDecorations);
        return () => {
            collection.clear();
        };
    }, [editor, decorationSpecs]);

    // 初期レンダリング時にEditorに表示するコードを決定する
    useEffect(() => {
        if (defaultValue === null) return;

        const storageKey = `jseditor-${path}`;
        const savedData = path ? localStorage.getItem(storageKey) : null;

        if (savedData) {
            setInitialValue(savedData);
        } else {
            setInitialValue(defaultValue);
        }
    }, [defaultValue, path]);

    // iframeからのメッセージの取得
    useEffect(() => {
        const handleMessage = (e: { data: FromIframeMessageData }) => {
            if (!e.data) {
                return;
            }
            if (e.data.type === 'iframe-error') {
                const info = e.data as Extract<FromIframeMessageData, { type: 'iframe-error' }>;
                if (statusRef.current) {
                    statusRef.current.textContent = `error L${info.lineno}:C${info.colno}`;
                }
                return;
            }
            if (e.data.type === 'updateProgress') {
                const percent = (e.data as Extract<FromIframeMessageData, { type: 'updateProgress' }>).values;
                if (progressRef.current) {
                    progressRef.current.style.width = `${percent}%`;
                }
            } else if (e.data.type === 'learning-status') {
                const status = (e.data as Extract<FromIframeMessageData, { type: 'learning-status' }>).values;
                if (buttonLabelRef.current) buttonLabelRef.current.textContent = BUTTON_LABELS[status];
                if (statusRef.current) statusRef.current.textContent = "";
            } else if (e.data.type === 'registeredExternallyCallableFunction') {
                const functionName = (e.data as Extract<FromIframeMessageData, { type: 'registeredExternallyCallableFunction' }>).values;
                if (externalFunctionResults.current) externalFunctionResults.current[functionName] ??= [];
            } else if (e.data.type === 'externallyCallableFunctionResult') {
                const { functionName, result } = (e.data as Extract<FromIframeMessageData, { type: 'externallyCallableFunctionResult' }>).values;
                externalFunctionResults.current[functionName]?.[0](result);
                externalFunctionResults.current[functionName]?.shift();
            }
            updateHandler?.forEach(handler => {
                if (e.data.type === handler.messageType) {
                    const data = (e.data as { values: Record<string, number | number[]> }).values;
                    handler.onUpdate(data);
                }
            })
        }
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    return (
        <div className="flex flex-col h-full gap-2 overflow-hidden">
            <iframe className="editor_output" style={{ display: "none" }}></iframe>
            <div className="editor_panel flex-1 min-h-0 relative">
                {initialValue === null ? <div></div> : <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    theme="vs-dark"
                    onMount={(editor) => setEditor(editor)}
                    options={{
                        fontSize: 12,
                        lineNumbers: 'off',
                        minimap: {
                            enabled: false,
                        },
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        fixedOverflowWidgets: true,
                    }}
                    path={path}
                    defaultValue={initialValue}
                    onChange={(value) => {
                        if (!value || !path) return;
                        const storageKey = `jseditor-${path}`;

                        if (value === defaultValue) {
                            localStorage.removeItem(storageKey);
                        } else {
                            localStorage.setItem(storageKey, value);
                        }
                    }}
                />}
            </div>
            <div className="flex flex-col gap-1">
                <button id="ai-learning-start"
                    className="relative overflow-hidden px-3 py-1 text-xs font-semibold text-gray-200 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 w-full"
                    onClick={e => onStartLearn()}>
                    <span ref={progressRef} className="absolute left-0 top-0 h-full bg-blue-600/40 w-0" />
                    <span ref={buttonLabelRef} className="relative z-10">{BUTTON_LABELS.ended}</span>
                </button>
                <div ref={statusRef} className="overflow-hidden whitespace-nowrap text-xs text-red-400 min-h-[1em]">
                </div>
            </div>
        </div>
    );
})

JsEditor.displayName = 'JsEditor';
export default JsEditor;