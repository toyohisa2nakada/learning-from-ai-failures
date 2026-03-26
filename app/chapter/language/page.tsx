"use client";
import { useEffect, useState, useRef } from 'react';
import JsEditor, { type JsEditorHandle } from '@/components/JsEditor';
import DatasetPanel, { type Dataset, type DatasetPanelHandle, type EvaluationResult } from '@/app/chapter/language/components/DatasetPanel';
import ModelInsightPanel, { type ModelInsightPanelHandle } from '@/app/chapter/language/components/ModelInsightPanel';
import { useDoubleResizer } from '@/lib/hooks/useDoubleResizer';
import StageControllerPanel, { type Tutorial } from "@/components/StageController";
import EditorToggleButtons from '@/components/EditorToggleButtons';

const tutorial: Tutorial = {
  stages: [
    {
      description: "生成AIを作ってみましょう",
      guide: [
        { element: '.training-data-row-0', popover: { title: '学習データ', description: '「私は」を入力として、「ポケモン」が出るように学習します。<br>&lt;P&gt;は、2つの入力語のうち使わない空の部分を表しています。' } },
        { element: '.training-data-row-1', popover: { title: '学習データ', description: '「ポケモン」と出力されたあと、その出力を次の入力として使い、「好きです」と続くようにAIを学習させます。' } },
        {
          element: '#ai-learning-start', popover: {
            title: 'AIが学習を開始する',
            description: 'ここを押してAIの学習を開始してください。',
            onNextClick: (element, step, options) => {
              console.log(tutorial);
              console.log(tutorial.checkElements)
              if (tutorial.checkElements?.['doneLearning']()) {
                options.driver.moveNext()
              } else {
                if (options.state.popover) {
                  const curText = options.state.popover.description.textContent;
                  options.state.popover.description.textContent = curText.includes("進めません") ?
                    "プログラムのボタンを押してみてください。" : "プログラムのボタンを押さないと進めません。";
                }
              }
            }
          }
        },
        {
          element: '.prediction-input-container', popover: {
            title: '次の文字を予測する',
            description: '学習が終了したらここに、「私は」と入力して横の矢印ボタンを押してください。',
            onNextClick: (element, step, options) => {
              if (tutorial.checkElements?.['donePredict']()) {
                options.driver.moveNext()
              } else {
                if (options.state.popover) {
                  const curText = options.state.popover.description.textContent;
                  options.state.popover.description.textContent = curText.includes("進めません") ?
                    "「私は」を入力して矢印ボタンを押してください。" : "矢印ボタンを押さないと進めません。";
                }
              }
            }
          }
        },
        { element: '.prediction-results', popover: { title: '予測結果', description: 'ここに予測した結果が表示されます。Ⓕは、現在のモデルの略称です。' } },
        {
          element: '.prediction-container', popover: {
            title: '次の文字を予測する',
            description: '「私は」の後に出力された文字を入力して再度矢印ボタンを押してみてください。"Ⓕ"の入力は不要です。'
          }
        },
        { element: '.prediction-results', popover: { title: '予測結果', description: 'さらに予測語が表示されて、文章が出来上がっていきます。' } },
        {
          element: '.test-data-row-0', popover: {
            title: 'テストデータ',
            description: 'テストデータとは、AIの学習を評価するためのデータです。テストデータには、AIが学習していないデータが含まれています。予測結果が緑色は正解、赤は不正解を表しています。'
          }
        },
      ],
      quiz: {
        title: "問題", problems: [
          { question: "学習データにある「<P>」という記号は、何を表していますか？", choices: ["2つの入力語のうち、使わない空の部分", "AIが予測に成功したことを示す「Pass」の略称", "プログラムの実行を一時停止（Pause）させるコマンド"], correctIndex: 0 },
          { question: "入力欄の一部が「<P>（使わない入力）」で埋められているのはなぜだと思いますか？", choices: ["一度に読み込むデータの枠が決まっており、空いたスペースを埋める必要があるため", "入力データが多すぎるとAIのメモリが不足し、計算が止まってしまうのを防ぐため", "将来的に新しい単語を追加したくなったときのために、予約席として空けておくため"], correctIndex: 0 },
          { question: "AIにおける「学習」とは、具体的にどのような工程を指しますか？", choices: ["構築されたルールを使って、新しい入力データに対する答えを計算する工程", "入力データと正解データのパターンを読み込み、ルールや知識を自ら構築する工程", "AIが計算ミスをしないように、人間がすべてのプログラムコードを手書きする工程"], correctIndex: 1 },
          { question: "AIにおける「予測」とは、具体的にどのような工程を指しますか？", choices: ["構築されたルールを使って、新しい入力データに対する答えを計算する工程", "入力データと正解データのパターンを読み込み、ルールや知識を自ら構築する工程", "AIが計算ミスをしないように、人間がすべてのプログラムコードを手書きする工程"], correctIndex: 0 },
          { question: "学習に使用していないデータをテストデータとする理由は何だと思いますか？", choices: ["一度学習に使ったデータは、モデルの内部でロックされてしまい二度と読み込めなくなるという制約があるため", "学習データが多すぎるとコンピュータの計算速度が落ち、モデルの構築が終わらなくなるのを防ぐため", "モデルが未知のデータに対してどの程度正しく予測できるか（汎化性能）を評価するため"], correctIndex: 2 },
        ]
      },
    },
    {
      description: "Feed forward neural network (fnn)を理解する",
      guide: [
        { element: '.fnn', popover: { title: '機械学習の種類(モデル)', description: '機械学習のモデルは3種類用意してあり、今回はfnnを使用しました。' } },
        { element: '.model-insight-fnn', popover: { title: 'fnnの構造', description: 'このfnnは、2つの入力値を受け取り、1つの出力値を返すシンプルな構造をしています。' } },
        { element: '.model-insight-fnn .bottom-table', popover: { title: '出力', description: '出力は1つの数値で、その値に最も近い単語が予測結果となります。' } },
        { element: '.arrow-svg', popover: { title: 'エッジ', description: '入力語と出力語の間の線がエッジです。オレンジは確率を上げる、水色は確率を下げることを表しています。' } },
        { element: () => ((document.querySelector('#quiz-container') as HTMLElement)?.offsetParent && document.querySelector('#quiz-container'))! || document.querySelector('#start-quiz')!, popover: { title: '次のクイズ', description: 'ここまでの内容で次のクイズが用意されています。' } },
      ],
      quiz: {
        title: "問題", problems: [
          { question: "目的語（例えばカレー）が同じでも、主語が「私は」と「俺は」では、どう出力が変わりますか？", choices: ["出力は変わらない", "「私は」のときは予測が外れて失敗する", "「私は」のときは語尾が「です」、「俺は」のときは「だ」になる"], correctIndex: 2 },
          { question: "データセットと予測結果の入力欄に「彼は」という学習データに登場しない語を入力するとどうなりますか？", choices: ["目的語が適当に選ばれて出力される", "未知の語が含まれているというエラーになる（学習データに無い語は使用できない）"], correctIndex: 1 },
          { question: "データセットと予測結果の入力欄に「私はポケモン好きです」の3語を入力したとき、出力はどうなりますか？", choices: ["「好きです」が「好きだ」に変わる", "語数が多いというエラーになる（入力語は最大で2語までである）"], correctIndex: 1 },
          { question: "テストケースの中で、fnnが失敗するはどのようなときですか？", choices: ["入力1に主語（私は、俺は）が入るとき", "入力1に目的語（カレー、大学）が入るとき"], correctIndex: 1 },
          { question: "fnnが失敗するのはなぜでしょうか？", choices: ["学習データでは主語、目的語の順で並んでいて、テストデータではその語順が逆転しているから", "カレー、大学といった目的語は学習データに無いから"], correctIndex: 0 },
        ]
      },
    },
    {
      description: "入力を平均する",
      guide: [
        { element: '.fnn', popover: { title: 'fnnの問題点', description: 'fnnの問題点は、入力の順序が変わると対応できないことでした。' } },
        {
          element: '.gap', popover: {
            title: 'Global Average Pooling',
            description: '次に、この gap というモデルを試します。gapは、global average poolingの略です。<br><br>まず // を消してコメントアウトを外してください。<br><br>そのあとで「AIが学習する」を押してください。'
          }
        },
        { element: () => ((document.querySelector('#quiz-container') as HTMLElement)?.offsetParent && document.querySelector('#quiz-container'))! || document.querySelector('#start-quiz')!, popover: { title: '次のクイズ', description: 'ここまでの内容で次のクイズが用意されています。 ' } },
      ],
      quiz: {
        title: "問題", problems: [
          { question: "計算プロセスの図、データセットを見て、fnnに対してgapの特徴を表しているものをすべて選択してください。", choices: ["gapは入力語を平均して1つにしてから次の語を予測している", "gapは語順を入れ替えたデータを学習している", "入力から予測する出力への線の数が少ないので計算コストが低い"], correctIndex: [0, 2] },
          { question: "平均という計算の特徴は何でしょうか？", choices: ["入力の順序が変わっても結果は変わらない (a+b)/2 == (b+a)/2", "入力の順序が変わると結果が変わる (a+b)/2 != (b+a)/2"], correctIndex: 0 },
          { question: "データセットと予測結果において、Ⓖで表されるgapの結果はfnnと比べてどういう特徴がありますか？", choices: ["「好き」のときにfnnより成功しやすい", "語尾が「です」のときにfnnより成功しやすい", "語順が変わるときにfnnより成功しやすい"], correctIndex: 2 },
        ]
      },
    },
    {
      description: "Global Average Pooling (gap)を理解する",
      guide: [
        {
          element: '#dataSelect', popover: {
            title: 'データセットの変更',
            description: 'ここのデータセットを「同音異義語データ」に変えてください。',
            onNextClick: (element, step, options) => {
              if (tutorial.checkElements?.['selectedDataset']()) {
                options.driver.moveNext()
              } else {
                if (options.state.popover) {
                  const curText = options.state.popover.description.textContent;
                  options.state.popover.description.textContent = curText.includes("進めません") ?
                    "ここのデータセットを「同音異義語データ」に変えてください。" : "「同音異義語データ」に変更しないと進めません";
                }
              }
            }
          }
        },
        {
          element: '.training-data-row-0', popover: {
            title: '「橋」と「箸」を区別する',
            description: '「ハシ」は、入力語の内容によって意味が変わり、入力語に道を連想する語があれば「橋」、食を連想する語があれば「箸」と解釈され、それに応じて次の語を「わたる」か「たべる」のどちらかに決めます。',
          }
        },
        {
          element: '.training-data-row-1', popover: {
            title: '1文字の入力語',
            description: '「山」「音」などの1文字はノイズとして予測には影響を与えません。道と食を連想する語は学習時に一緒に入力されないようにしています。',
          }
        },
        {
          element: '.training-data-row-2', popover: {
            title: '不明のデータ',
            description: '道と食を連想させる語がない場合には、「不明」と出力するようにします。不明のときの入力語は、「わたる」「たべる」のときと異なるものを使っています。これは少ない学習データでノイズが正しくノイズとして機能するためのものです。',
          }
        },
        {
          element: '.test-data-row-0', popover: {
            title: 'テストデータ',
            description: 'テストデータは、「不明」のときのノイズ語と、道と食を連想させる語で構成されています。学習データには出現しない組み合わせです。これでも正しく「わたる」「たべる」を予測できるようにすることが目的です。',
          }
        },
        { element: () => ((document.querySelector('#quiz-container') as HTMLElement)?.offsetParent && document.querySelector('#quiz-container'))! || document.querySelector('#start-quiz')!, popover: { title: '次のクイズ', description: 'ここまでの内容で次のクイズが用意されています。' } },
      ],
      quiz: {
        title: "問題", problems: [
          {
            question: "gapの長所は、fnnと比べた時に何だと思いますか？", choices: [
              "入力語の平均をとるため、学習データにない「逆順」などの未知の並び順に対しても、正解できる。",
              "入力語の語順を保存して学習するため、未知の並び順に対しても、学習時のパターンに当てはめて正解できる。",
            ], correctIndex: 0
          },
          {
            question: "gapであっても対応できない入力語の組み合わせは？", choices: [
              "同音異義語のデータセットのように、予測に関係ない語が入力されると、正解を外しやすくなる。",
              "同音異義語のデータセットのように、カタカナの語が入力されると、正解を外しやすくなる。"
            ], correctIndex: 0
          },
        ]
      },
    },
    {
      description: "どの語に注目するのかを学習する（Attentionを理解する）",
      guide: [
        { element: '.gap', popover: { title: 'gapの問題点', description: 'gapの問題点は、予測に関係ない語が入力されると、正解を外しやすくなることでした。' } },
        {
          element: '.llm', popover: {
            title: 'Large language model (llm)',
            description: '次に、この llm というモデルを試します。llmは、large language modelの略です。<br><br>まず // を消してコメントアウトを外してください。<br><br>そのあとで「AIが学習する」を押してください。'
          }
        },
        {
          element: '.model-insight-llm', popover: {
            title: 'llmモデル',
            description: 'llmモデルはfnn, gapとは違い、'
          }
        },
        {
          element: '.llm', popover: {
            title: '最後の一語を変換する',
            description: ''
          }
        },
        { element: () => ((document.querySelector('#quiz-container') as HTMLElement)?.offsetParent && document.querySelector('#quiz-container'))! || document.querySelector('#start-quiz')!, popover: { title: '次のクイズ', description: 'ここまでの内容で次のクイズが用意されています。' } },
      ],
      quiz: {
        title: "問題", problems: [
          {
            question: "計算プロセスの図より、llmの特徴を示すものをすべて選択してください。", choices: [
              "",
              ""
            ], correctIndex: [0]
          },
          { question: "データセットと予測結果において、Ⓛで表されるllmの結果はfnn,gapと比べてどういう特徴がありますか？", choices: ["「好き」のときに予測に成功している", "語尾が「です」のときに予測に成功している", "語順が変わるときに予測に成功している"], correctIndex: 2 },
        ]
      },
    },
  ],
  checkElements: {
    doneLearning: () => { return false; },
    donePredict: () => { return false; },
    selectedDataset: () => { return false; }
  },
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

const MODEL_NAMES = ["fnn", "gap", "llm"] as const;

function getModelIcon(name: string): string {
  if (name.startsWith("llm")) {
    return "Ⓛ";
  }
  if (name.startsWith("fnn")) {
    return "Ⓕ";
  }
  if (name.startsWith("gap")) {
    return "Ⓖ";
  }
  return "";
}

export default function Home() {
  console.log("LANGUAGE HOME")
  const [importScripts, setImportScripts] = useState<ImportScripts>(initialImportScripts);
  const [mainScript, setMainScript] = useState<string | null>(null);
  const [dataset, setDataset] = useState<Readonly<Dataset> | null>(null);
  const datasetPanelRef = useRef<DatasetPanelHandle>(null);
  const modelInsightPanelRef = useRef<{ [modelName: string]: ModelInsightPanelHandle }>({});
  const testPatternSelectRef = useRef<HTMLSelectElement>(null);
  const jsEditorRef = useRef<JsEditorHandle>(null);

  async function onPredict(input: string) {
    return await jsEditorRef.current?.callExternallyCallableFunction({ functionName: "predict", args: [input] });
  }
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
    datasetPanelRef.current?.updatePredictions(resultSet);
    modelInsightPanelRef.current[resultSet.modelName].updateModelInsight(resultSet);
  }
  function onLearningStatusUpdate(status: string) {
    if (status === "started") {
      datasetPanelRef.current?.clearPredictions();
    }
  }

  // クイズパネル
  const [isQuizVisible, setIsQuizVisible] = useState(false);
  const toggleQuiz = () => {
    setIsQuizVisible(!isQuizVisible);
  };
  const quizPanelRef = useRef<HTMLDivElement | null>(null);
  const { leftWidth, rightWidth, containerRef, handleLeftMouseDown, handleRightMouseDown } =
    useDoubleResizer({ initialLeft: 40, initialRight: 25, minLeft: 20, minRight: 10, minCenter: 30 });

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
    });

    if (tutorial.checkElements) {
      tutorial.checkElements.doneLearning = () => jsEditorRef.current?.canCallExternallyCallableFunction({ functionName: "predict" }) ?? false;
      tutorial.checkElements.donePredict = () => document.querySelector(".prediction-results")?.textContent?.startsWith("Ⓕ") ?? false;
      tutorial.checkElements.selectedDataset = () => (document.querySelector("#dataSelect") as HTMLSelectElement)?.value === "Homonym";
    }
  }, []);


  return (
    <div className="h-full min-h-0 grid grid-rows-[auto_1fr_auto] gap-1 bg-inherit">
      {/* 指令エリア */}
      <StageControllerPanel tutorial={tutorial} quizPanelRef={quizPanelRef} onStartQuiz={toggleQuiz} />

      {/* Main Content */}
      <main className="flex min-w-0 min-h-0 overflow-hidden bg-inherit">
        {/* Container: Flex Row on MD screens to put Left and Right side-by-side */}
        <div ref={containerRef} className="container-panel h-full bg-inherit">

          {/* プログラム */}
          <div className="left-panel flex flex-col" style={{ width: `${leftWidth}%`, flexShrink: 0 }} >
            <div className="flex justify-between items-center">
              <div className="text-base font-bold mb-3">ニューラルネットワークの構造</div>
              <EditorToggleButtons
                programmingMode="programming"
                onReset={() => { jsEditorRef.current?.resetCode() }}
              />
            </div>
            <JsEditor
              path="chapter/language/main.js"
              defaultValue={mainScript}
              decorationSpecs={{ "\"fnn\"": "fnn", "\"gap\"": "gap", "\"llm\"": "llm" }}
              updateHandler={[
                { onUpdate: onEvaluationUpdate, messageType: "evaluation" },
                { onUpdate: onLearningStatusUpdate, messageType: "learning-status" },
              ]}
              externalScripts={({ ...importScripts, 'dataset.js': dataset })}
              externallyCallableFunctions={["predict"]}
              ref={jsEditorRef}
            />
          </div>

          {/* リサイザー */}
          <div
            onMouseDown={handleLeftMouseDown}
            className="w-2 flex-shrink-0 cursor-col-resize hover:bg-blue-900 active:bg-blue-500 transition-colors duration-150 rounded"
          />

          {/* 計算プロセスとデータセット */}
          <div className="flex flex-col gap-4 min-w-0 flex-1 bg-inherit">
            {/* 計算プロセス */}
            <div id="model-insight-container" className="right-panel h-auto flex-none bg-inherit">
              <div className="flex flex-row items-center mb-2 gap-2 bg-inherit">
                <div className="font-semibold">計算プロセス</div>
                <div className="bg-inherit text-sm">
                  <label htmlFor="test-pattern-index">テストデータ</label>
                  <select className="border border-slate-500 bg-inherit" id="test-pattern-index" ref={testPatternSelectRef}
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
              </div>

              <div className="flex flex-row flex-wrap gap-2 text-xs">
                {MODEL_NAMES.map(modelName => (
                  <ModelInsightPanel
                    key={modelName}
                    modelName={modelName}
                    modelIcons={MODEL_NAMES.reduce((a, e) => ({ ...a, [e]: getModelIcon(e) }), {})}
                    ref={el => { if (el) modelInsightPanelRef.current[modelName] = el; }} />
                ))}
              </div>
            </div>

            {/* データセット */}
            <div id="dataset-container" className="right-panel h-auto flex-1 flex flex-col min-h-0 overflow-y-auto bg-inherit">
              <DatasetPanel
                ref={datasetPanelRef}
                modelIcons={MODEL_NAMES.reduce((a, e) => ({ ...a, [e]: getModelIcon(e) }), {})}
                onDatasetChange={onDatasetChange} onPredict={onPredict} />
            </div>
          </div>

          {/* リサイザー */}
          <div
            onMouseDown={handleRightMouseDown}
            className={(isQuizVisible ? "block" : "hidden") + " w-1.5 flex-shrink-0 cursor-col-resize hover:bg-blue-900 active:bg-blue-500 transition-colors duration-150 rounded"}
          />

          {/* 右パネル */}
          <div id="quiz-container" ref={quizPanelRef} className={(isQuizVisible ? "block" : "hidden") + " h-auto flex flex-col min-h-0 overflow-y-auto rounded-lg shadow-xl ring-4 ring-offset-2 ring-indigo-400/10 ring-offset-transparent"} style={{ width: `${rightWidth}%`, flexShrink: 0 }}>
          </div>
        </div>
      </main >
    </div >
  );
}
