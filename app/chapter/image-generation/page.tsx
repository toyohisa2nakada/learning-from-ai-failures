"use client"
import { useEffect, useState, useRef } from "react";
import JsEditor, { type JsEditorHandle } from "@/components/JsEditor";
import NeuralNetGraph from "@/app/chapter/image-generation/components/NeuralNetGraph";
import DatasetPanel, { type DatasetPanelHandle } from "@/app/chapter/image-generation/components/DatasetPanel";
import ImageGridPanel from "@/app/chapter/image-generation/components/ImageGridPanel";
import { type ImageOption } from "@/components/ImageSelect";
import { useDoubleResizer } from '@/lib/hooks/useDoubleResizer';
import StageControllerPanel, { type Tutorial } from "@/components/StageController";
import EditorToggleButtons from "@/components/EditorToggleButtons";


const tutorial: Tutorial = {
  stages: [
    {
      description: "画像を出力する",
      guide: [
        {
          element: '.left-panel', popover: {
            title: 'ネットワークの構造',
            description: 'このニューラルネットワークは、48×48×3の出力を生成します。1つの出力を画素の赤、緑、青のいずれかの値に対応させます。'
          }
        },
        {
          element: '.left-panel', popover: {
            title: 'ネットワークの構造',
            description: '入力は1つです。このネットワークによって入力が0の時に出力したい画像、1の時に出力した画像を学習させます。'
          }
        },
        {
          element: '.image-select-container', popover: {
            title: '画像の選択',
            description: 'ここで入力が0の時と1の時に出力したい画像を選択します。'
          }
        },
        {
          element: '#programming-mode-toggle', popover: {
            title: 'プログラムモードへの変更',
            description: 'ここを押してプログラムを表示してください。',
            onNextClick: (element, step, options) => {
              if (!document.getElementById("ai-learning-start")) {
                if (options.state.popover) {
                  const curText = options.state.popover.description.textContent;
                  options.state.popover.description.textContent = curText.includes("進めません") ?
                    "プログラムのボタンを押してみてください。" : "プログラムのボタンを押さないと進めません。";
                }
              } else {
                options.driver.moveNext()
              }
            }
          }
        },
        {
          element: '#ai-learning-start', popover: {
            title: 'AIが学習を開始する',
            description: 'ここを押してAIの学習を開始してください。'
          }
        },
        {
          element: '.interpolation-steps-container', popover: {
            title: 'ニューラルネットワークが出力する画像',
            description: 'AIは0の例と1の例だけを学習し、その関係から0と1の間の値にも対応できるようになり、中間の特徴を持つ出力を生成できるようになります。'
          }
        },
        {
          element: '.grid-canvas-container', popover: {
            title: '4つのニューロンの出力',
            description: 'さらに1枚の画像は、この4つのニューロンの出力の足し合わせによって計算されます。ここで + は足される画像、- は引かれる画像を表します。'
          }
        },
      ],
      quiz: {
        title: "問題", problems: [
          { question: "このニューラルネットワークの入力値はいくつありますか？", choices: ["0", "1", "4", "48*48*3"], correctIndex: 1 },
          { question: "このニューラルネットワークの出力値はいくつありますか？", choices: ["0", "1", "4", "48*48*3"], correctIndex: 3 },
          { question: "データセットと予測結果にある横軸(0.0〜1.0)は、何を表していますか？", choices: ["入力値", "出力値", "ニューロンの数", "画像のピクセル数"], correctIndex: 0 },
          { question: "データセットと予測結果にある例えば0.2の画像はどういう意味の画像ですか？", choices: ["入力0の画像が20%、入力1の画像が80%の画像", "入力0の画像が80%、入力1の画像が20%の画像", "ニューロン数を0.2にした画像"], correctIndex: 1 },
          { question: "プログラムのunitsの値を4から1に変更すると、画像を正しく出力できません。その理由として正しいものは？", choices: ["画像のように複雑なデータは、ニューロンが1つだけのAIでは学習できないため。これはプログラムのバグではなく、このAIの構造上の限界である。", "画像が2枚なので、ニューロン数は2にしなければいけないため", "プログラムのバグで学習処理ができないため"], correctIndex: 0 },
          { question: "ニューロン数を大きくする場合、どのような影響があると思われますか？適切なものをすべて選んでください。", choices: ["学習時間が長くなる", "より複雑な画像を出力できるようになる", "出力する画像のサイズが大きくなる"], correctIndex: [0, 1] },
        ]
      },
    },
  ]
}

const MAIN_SCRIPT_NAME = 'main.js';
const SCRIPT_BASE_PATH = '/chapter/image-generation/';

export default function Home() {
  console.log("Editor HOME")
  // 手動学習、自動（プログラム）学習の切り替え (manual / programming)
  const [programmingMode, setProgrammingMode] = useState<'manual' | 'programming'>('manual');

  const [imageSelected0, setImageSelected0] = useState<ImageOption | undefined>();
  const [imageSelected1, setImageSelected1] = useState<ImageOption | undefined>();
  const datasetPanelRef = useRef<DatasetPanelHandle>(null);
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
    datasetPanelRef.current?.updatePredictions(images as Record<string, number[]>);
  }

  function onIntermediateImageUpdate(images: Record<string, any>) {
    imageGridPanelRef.current?.updateImages(images as Record<string, number[][]>);
  }

  // クイズパネル
  const [isQuizVisible, setIsQuizVisible] = useState(false);
  const toggleQuiz = () => {
    setIsQuizVisible(!isQuizVisible);
  };
  const quizPanelRef = useRef<HTMLDivElement | null>(null);
  const { leftWidth, rightWidth, containerRef, handleLeftMouseDown, handleRightMouseDown } =
    useDoubleResizer({ initialLeft: 40, initialRight: 25, minLeft: 20, minRight: 10, minCenter: 30 });

  const [mainScript, setMainScript] = useState<string | null>(null);
  const jsEditorRef = useRef<JsEditorHandle>(null);
  function onChangeProgrammingMode(mode: 'manual' | 'programming') {
    setProgrammingMode(mode);
  }
  function onProgramReset() {
    jsEditorRef.current?.resetCode();
  }

  useEffect(() => {
    fetch(`${SCRIPT_BASE_PATH}${MAIN_SCRIPT_NAME}`)
      .then(res => res.text())
      .then(text => {
        setMainScript(text);
      })
      .catch(error => {
        console.error('Error loading scripts:', error);
      });
  }, []);



  return (
    <div className="h-full min-h-0 grid grid-rows-[auto_1fr_auto] gap-1 bg-inherit">
      {/* 指令エリア */}
      <StageControllerPanel tutorial={tutorial} quizPanelRef={quizPanelRef} onStartQuiz={toggleQuiz} />

      {/* Main Content */}
      <main className="flex min-w-0 min-h-0 w-full bg-inherit">
        <div ref={containerRef} id="container" className="container-panel h-full min-w-0 bg-inherit overflow-hidden p-2">

          {/* Left Panel: Merged Height (Full Height of container) */}
          <div className="left-panel flex flex-col overflow-hidden min-w-0" style={{ width: `${leftWidth}%`, flexShrink: 0 }}>
            <div className="flex justify-between items-center">
              <div className="text-base font-semibold m-0">ニューラルネットワークの構造</div>
              <EditorToggleButtons
                programmingMode={programmingMode}
                onChangeMode={onChangeProgrammingMode}
                onReset={onProgramReset}
              />
            </div>
            {programmingMode === 'manual' ? <NeuralNetGraph /> :
              <JsEditor
                path="chapter/image-generation/main.js"
                updateHandler={[
                  { onUpdate: onImageUpdate, messageType: 'images' },
                  { onUpdate: onIntermediateImageUpdate, messageType: 'intermediateImages' }
                ]}
                externalScripts={() => ({ 'trainingData.js': `export const trainingData=${JSON.stringify(getCurrentTrainingData())};` })}
                defaultValue={mainScript}
                ref={jsEditorRef}
              />
            }
          </div>

          {/* リサイザー */}
          <div
            onMouseDown={handleLeftMouseDown}
            className="w-2 flex-shrink-0 cursor-col-resize hover:bg-blue-900 active:bg-blue-500 transition-colors duration-150 rounded"
          />

          {/* 中央パネル */}
          <div className="flex flex-col gap-4 min-h-0 min-w-0 flex-1 bg-inherit">
            {/* 個別のグラフ */}
            <div id="graph-area-top" className="right-panel">
              <ImageGridPanel ref={imageGridPanelRef} />
            </div>
            {/* 画像生成結果 */}
            <div id="graph-area-bottom" className="right-panel">
              <DatasetPanel
                ref={datasetPanelRef}
                imageSelected0={imageSelected0}
                imageSelected1={imageSelected1}
                onImageSelectChange={handleImageSelectChange}
              />
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
      </main>
    </div>
  );
}
