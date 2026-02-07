"use client"
import { useEffect, useState, useRef } from "react";
import { Chart, ChartConfiguration } from 'chart.js/auto';
import Editor from "@/components/Editor";
import NeuralNetGraph from "@/components/NeuralNetGraph";


// グラフ描画の設定
const DATA_POINTS = 300;
// プロットする散布図データ（目標点データセット）
const TARGET_POINT_DATASETS: Record<string, [number, number][]> = {
  原点通る直線: [[-1, -1], [0, 0], [1, 1], [2, 2]],
  原点通る折れ線: [[-1, -2], [0, 0], [1, 2], [2, 1]],
  原点通らない直線: [[-1, -2], [0, -1], [1, 0], [2, 1]],
  原点通らない折れ線: [[-1, -3], [0, -1], [1, 1], [2, 0]],
};
// 目標点選択ドロップダウンのID
const TARGET_SELECT_ID = 'target-select';

// グラフデータ生成のためのX座標データ
function generateXData(X_MIN: number, X_MAX: number): number[] {
  const xData = [];
  const step = (X_MAX - X_MIN) / DATA_POINTS;
  for (let i = 0; i < DATA_POINTS; i++) {
    xData.push(X_MIN + i * step);
  }
  return xData;
}

// 活性化関数の定義: y = w_out * tanh(w_in * x + b)
function activation(x: number, w_in: number, b: number, w_out: number) {
  return w_out * Math.tanh(w_in * x + b);
}

// Y軸データを計算 (X軸データも依存するため引数に追加)
function generateYData(weights: Record<string, number>, xData: number[]): {
  y0Data: number[],
  y1Data: number[],
  ySumData: { x: number, y: number }[]
} {
  // y = w2 * tanh(w1 * x + b) を計算
  const y0Data = xData.map(x => activation(x, weights.wIn0, weights.b0, weights.wOut0));
  const y1Data = xData.map(x => activation(x, weights.wIn1, weights.b1, weights.wOut1));

  // 合成グラフ (y1 + y2)
  const ySumData = y0Data.map((y0, i) => y0 + y1Data[i]);

  // Chart.jsはX軸をラベルとして扱えないため、X-Yペアの形式に変換
  const ySumChartData = xData.map((x, i) => ({ x: x, y: ySumData[i] }));

  return { y0Data, y1Data, ySumData: ySumChartData };
}

// Chart.jsの共通設定を取得する関数（範囲設定を動的に反映）
function getCommonChartOptions(range: Record<string, number>): ChartConfiguration['options'] {
  return {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        min: range.X_MIN,
        max: range.X_MAX,
        title: { display: true, text: 'x', color: '#cbd5e1' },
        // X軸のティックを調整（0.1単位で表示）
        ticks: { callback: (val: string | number) => Number(val).toFixed(1), color: '#cbd5e1' },
        grid: { color: 'rgba(148, 163, 184, 0.25)' }
      },
      y: {
        min: range.Y_MIN,
        max: range.Y_MAX,
        title: { display: true, text: 'y', color: '#cbd5e1' },
        ticks: { color: '#cbd5e1' },
        grid: { color: 'rgba(148, 163, 184, 0.25)' }
      }
    },
    plugins: {
      legend: { display: true, labels: { color: '#e2e8f0' } },
      tooltip: { enabled: false }
    },
    elements: {
      point: { radius: 0 }
    }
  };
}


// 合成グラフと目標点の平均二乗誤差（MSE）を計算
function calculateMSE(currentScatterPoints: Record<string, number>[], weights: Record<string, number>) {

  if (!currentScatterPoints.length) return 0;

  const totalSquaredError = currentScatterPoints.reduce((acc, point) => {
    const predicted = activation(point.x, weights.wIn0, weights.b0, weights.wOut0)
      + activation(point.x, weights.wIn1, weights.b1, weights.wOut1);
    const diff = predicted - point.y;
    return acc + diff * diff;
  }, 0);

  return totalSquaredError / currentScatterPoints.length;
}

function updateMSEDisplay(currentScatterPoints: Record<string, number>[], weights: Record<string, number>) {
  const mseElement = document.getElementById('mse-value');
  if (!mseElement) return;
  const mse = calculateMSE(currentScatterPoints, weights);
  mseElement.textContent = mse.toFixed(4);

  // 学習するデータは折れ線の場合にはy軸の幅が 2 , 直線では 3 あります。
  // その小さい方の 5% の誤差を許容すると仮定すると 損失関数である mse(平均二乗誤差)は、(2 * 0.05)^2 = 0.01となります。
  // そこで、今回は 0.01 よりも平均二乗誤差が小さい場合には学習できた、としています。
  if (mse < 0.01) {
    mseElement.classList.add('text-green-600');
  } else {
    mseElement.classList.remove('text-green-600');
  }
}

function updateChartScales(individualChart: Chart, sumChart: Chart, range: Record<string, number>) {
  // 範囲の更新 (両方のグラフに適用)
  const updateScales = (chart: Chart) => {
    chart.options.scales!.x!.min = range.X_MIN;
    chart.options.scales!.x!.max = range.X_MAX;
    chart.options.scales!.y!.min = range.Y_MIN;
    chart.options.scales!.y!.max = range.Y_MAX;
  };

  updateScales(individualChart);
  updateScales(sumChart);
}

// グラフ全体を更新する関数
function updateCharts(individualChart: Chart, sumChart: Chart, weights: Record<string, number>, range: Record<string, number>, currentScatterPoints: Record<string, number>[]) {
  const xData: number[] = generateXData(range.X_MIN, range.X_MAX);
  const { y0Data, y1Data, ySumData } = generateYData(weights, xData);

  // Individual Chart (Line Chart): labelsとy-value配列で更新
  individualChart.data.labels = xData.map(x => x.toFixed(2));
  individualChart.data.datasets[0].data = y0Data;
  individualChart.data.datasets[1].data = y1Data;

  // Sum Chart (Line + Scatter): x-yペアで更新
  sumChart.data.datasets[0].data = ySumData;
  // Scatterデータ (目標点) は currentScatterPoints を参照しているため、別途更新する必要はない

  // グラフを更新
  individualChart.update();
  sumChart.update();

  updateMSEDisplay(currentScatterPoints, weights);
}

export default function Home() {
  console.log("HOME")
  // 教師データ
  // const currentScatterPoints = useRef<{ x: number; y: number }[]>(
  //   TARGET_POINT_DATASETS['原点通る直線'].map(p => ({ x: p[0], y: p[1] }))
  // );
  const trainingDataTypeRef = useRef<HTMLSelectElement>(null);
  const currentScatterPoints = useRef<{ x: number; y: number }[]>(null);
  function onChangeScatterPoints(datatype: string) {
    currentScatterPoints.current = TARGET_POINT_DATASETS[datatype].map(p => ({ x: p[0], y: p[1] }));
    updateCharts(individualChart.current!, sumChart.current!, weights.current, getRangeParams(), currentScatterPoints.current);
    sumChart.current!.data.datasets[1].data = currentScatterPoints.current;
    sumChart.current!.update();
    updateMSEDisplay(currentScatterPoints.current, weights.current);
  }
  function getCurrentTrainingDataType(): [number, number][] {
    return TARGET_POINT_DATASETS[trainingDataTypeRef.current!.selectedOptions[0].text];
  }

  // 重み
  const weightInits = [{ wIn0: 1.0, b0: 0.0, wOut0: 1.0 }, { wIn1: 1.0, b1: 0.0, wOut1: -1.0 }];
  const weights = useRef<{ [key: string]: number }>(Object.assign({}, ...weightInits));
  function onChangeWeightAll(w: Record<string, number>): void {
    Object.keys(w).forEach(e => {
      weights.current[e] = w[e];
      (document.getElementById(e) as HTMLInputElement)!.value = weights.current[e].toFixed(3);
      (document.getElementById(`${e}-input`) as HTMLInputElement)!.value = weights.current[e].toFixed(3);
    });
    updateCharts(individualChart.current!, sumChart.current!, weights.current, getRangeParams(), currentScatterPoints.current!);
  }
  function onChangeWeight(id: string, value: string): void {
    const attr = id.split('-')[0] as keyof typeof weights.current & string;
    weights.current[attr] = parseFloat(value) || 0;
    const other = id.includes('-input') ? attr : `${attr}-input`;
    (document.getElementById(other) as HTMLInputElement)!.value = weights.current[attr].toFixed(3);
    updateCharts(individualChart.current!, sumChart.current!, weights.current, getRangeParams(), currentScatterPoints.current!);
  }
  function onWeightInit(id: string) {
    const no = parseInt(id.replace(/[^0-9]/g, "")) || 0;
    Object.assign(weights.current, weightInits[no]);
    ["wIn", "b", "wOut"].forEach(e => {
      const attr = `${e}${no}`;
      (document.getElementById(attr) as HTMLInputElement)!.value = weights.current[attr].toString();
      (document.getElementById(attr + "-input") as HTMLInputElement)!.value = weights.current[attr].toFixed(3);
    })
    updateCharts(individualChart.current!, sumChart.current!, weights.current, getRangeParams(), currentScatterPoints.current!);
  }

  // Chart
  const individualChart = useRef<Chart>(null);
  const sumChart = useRef<Chart>(null);

  // グラフの可算結果のグラフ表示範囲設定
  const rangeParams = useRef<{ x0: number; x1: number; y0: number, y1: number }>({ x0: -1.5, x1: 2.5, y0: -4, y1: 4 });
  function getRangeParams(): Record<string, number> {
    return {
      X_MIN: Math.min(rangeParams.current.x0, rangeParams.current.x1), X_MAX: Math.max(rangeParams.current.x0, rangeParams.current.x1),
      Y_MIN: Math.min(rangeParams.current.y0, rangeParams.current.y1), Y_MAX: Math.max(rangeParams.current.y0, rangeParams.current.y1)
    };
  }
  function onToggleGraphSetting(elem: HTMLButtonElement) {
    const isExpanded = elem.getAttribute('aria-expanded') === 'true';
    const contentDiv = document.getElementById('range-settings-content');
    const toggleIcon = document.getElementById('toggle-icon');
    if (isExpanded) {
      contentDiv?.classList.add('hidden');
      if (toggleIcon) toggleIcon.style.transform = 'rotate(0deg)';
      elem.setAttribute('aria-expanded', 'false');
    } else {
      contentDiv?.classList.remove('hidden');
      if (toggleIcon) toggleIcon.style.transform = 'rotate(90deg)'; // 90度回転させて下向きにする
      elem.setAttribute('aria-expanded', 'true');
    }
  }
  function onChangeGraphSetting(id: keyof typeof rangeParams.current, value: string): void {
    rangeParams.current[id] = parseFloat(value) || 0.0;
    updateChartScales(individualChart.current!, sumChart.current!, getRangeParams());
    updateCharts(individualChart.current!, sumChart.current!, weights.current, getRangeParams(), currentScatterPoints.current!);
  }

  // 手動学習、自動（プログラム）学習の切り替え (manual / programming)
  const [programmingMode, setProgrammingMode] = useState('manual');
  const btnStates = ["bg-gray-700 text-gray-100 cursor-pointer p-1", "bg-transparent text-gray-500 cursor-pointer p-1",];
  const [btnStatusManual, btnStatusProgramming] = programmingMode === 'manual' ? [btnStates[0], btnStates[1]] : [btnStates[1], btnStates[0]];
  // iframe->カスタムタグのEditor->経由で受け取るプログラムでアップデートした重み
  function onUpdateWeight(weights: Record<string, number>) {
    onChangeWeightAll(weights)
  }


  // 初期表示
  useEffect(() => {

    const range: Record<string, number> = getRangeParams();
    const xData = generateXData(range.X_MIN, range.X_MAX);
    const { y0Data, y1Data, ySumData } = generateYData(weights.current, xData);
    const commonOptions: ChartConfiguration['options'] = getCommonChartOptions(range);

    // Chart.jsではLine Chartのデータラベル（xData）とデータポイントのインデックスが紐づくため、
    // 個別グラフはこれまで通りの配列形式を維持
    const y1Only: number[] = y0Data.map((d: number) => d);
    const y2Only: number[] = y1Data.map((d: number) => d);

    // 上部の個別グラフ
    const ctxIndividual: CanvasRenderingContext2D = (document.getElementById('individual-graphs-canvas') as HTMLCanvasElement)?.getContext('2d')!;
    if (individualChart.current) {
      individualChart.current.destroy();
    }
    individualChart.current = new Chart(ctxIndividual, {
      type: 'line',
      data: {
        labels: xData.map(x => x.toFixed(2)), // X軸ラベルは表示用に固定
        datasets: [
          {
            label: 'グラフ1 (G1)',
            data: y1Only, // Y値の配列
            borderColor: '#f472b6',
            tension: 0.2,
            borderWidth: 2,
            fill: false
          },
          {
            label: 'グラフ2 (G2)',
            data: y2Only, // Y値の配列
            borderColor: '#38bdf8',
            tension: 0.2,
            borderWidth: 2,
            fill: false
          }
        ]
      },
      options: commonOptions
    });

    // 下部の合成グラフ
    const ctxSum: CanvasRenderingContext2D = (document.getElementById('sum-graph-canvas') as HTMLCanvasElement).getContext('2d')!;
    if (sumChart.current) {
      sumChart.current.destroy();
    }
    sumChart.current = new Chart(ctxSum, {
      type: 'line', // 合成関数はLine Chart
      data: {
        // 合成関数のLine Chartデータセット
        datasets: [
          {
            label: '加算結果 (G1 + G2)',
            data: ySumData, // {x: X, y: Y} の配列
            borderColor: '#22c55e',
            borderWidth: 3,
            tension: 0.2,
            fill: false,
            // Line Chartでもx-y形式のデータを扱うために'x'の型を指定
            parsing: false,
          },
          // Scatterプロットのデータセット
          {
            label: '教師データ',
            data: currentScatterPoints.current!, // 動的に更新される変数を使用
            type: 'scatter', // 散布図として描画
            backgroundColor: '#facc15', // オレンジ色
            pointRadius: 5, // 点のサイズ
            pointBorderWidth: 1,
            // pointBorderColor: '#0f172a',
            showLine: false, // 線は描画しない
          }
        ]
      },
      options: commonOptions
    });

    (Object.keys(weights.current) as (keyof typeof weights.current & string)[]).forEach(e => {
      (document.getElementById(e) as HTMLInputElement)!.value = weights.current[e].toString();
      (document.getElementById(`${e}-input`) as HTMLInputElement)!.value = weights.current[e].toFixed(3);
    });

    // 教師データの初期値をselectタグから文字を取得してセット
    onChangeScatterPoints(trainingDataTypeRef.current!.selectedOptions[0].text);
    updateMSEDisplay(currentScatterPoints.current!, weights.current);
  }, []);

  // 重み部分のinput
  const weight_input_css = "no-spin font-bold w-12 text-right p-0 bg-transparent text-sm rounded border border-[#1f2a44] border-solid";

  return (
    <div className="h-full min-h-0 grid grid-rows-[auto_1fr_auto] gap-1 bg-inherit">
      <style>{`
        .no-spin::-webkit-inner-spin-button,
        .no-spin::-webkit-outer-spin-button {
          -webkit-appearance: none;
        }
        .no-spin {
          -moz-appearance: textfield;
        }
        .range-input {
            width: 50px;
            font-size: 0.75rem;
            background: #0d162d;
            border: 1px solid #1f2a44;
        }
        .auto-inherit {
          appearance: none;
          background: inherit;
          color: inherit;
        }
      `}</style>

      {/* 指令エリア */}
      <section className="action-section">
        指令：パラメータを変更して、グラフの可算結果が教師データを通るようにする。
      </section>

      {/* 操作と可視化 */}
      <main className="flex bg-inherit">
        <div id="container" className="container-panel">

          {/* 上部パネル */}
          <div id="upper-panel" className="upper-panel">

            {/* パラメータ設定 */}
            <div id="parameter-control" className="left-panel">
              <h3 className="text-base font-bold mb-3">パラメータ設定</h3>

              {[
                { borderColor: "border-red-300", textFocusColor: "ring-red-400", sliderColor: "accent-pink-400" },
                { borderColor: "border-blue-300", textFocusColor: "ring-blue-400", sliderColor: "accent-sky-400" },
              ].map((e, i) => (
                <div className={`${e.borderColor} mb-2 p-2 border-8 rounded-lg bg-red-400/5`} key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold">{`グラフ${i + 1}: `}<span className="text-gray-300">y =
                      w2 * tanh(w1 * x + b)</span></h3>
                    <button id={`weight${i}-init`}
                      className="px-3 py-1 text-xs font-semibold bg-slate-800 border border-slate-600 rounded hover:bg-slate-700"
                      onClick={e => onWeightInit(e.currentTarget.id)}>リセット</button>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-1/3 pr-1">
                      <label htmlFor={`wIn${i}-input`} className="text-xs font-medium block">
                        <div className="flex items-center whitespace-nowrap">
                          <span className="flex-shrink">重み w1:</span>
                          <input type="number" id={`wIn${i}-input`} min="-10.0" max="10.0" step="0.001"
                            className={`${weight_input_css} focus:outline-none focus:ring-1 focus:${e.textFocusColor}`}
                            onChange={e => onChangeWeight(e.target.id, e.target.value)} />
                        </div>
                      </label>
                      <input type="range" id={`wIn${i}`} min="-10.0" max="10.0" step="0.001"
                        className={`w-full h-[6px] cursor-pointer my-[3px] ${e.sliderColor}`}
                        onChange={e => onChangeWeight(e.target.id, e.target.value)} />
                    </div>

                    <div className="w-1/3 pr-1">
                      <label htmlFor={`b${i}-input`} className="text-xs font-medium block">
                        <div className="flex items-center whitespace-nowrap">
                          <span className="flex-shrink">バイアス b:</span>
                          <input type="number" id={`b${i}-input`} min="-10.0" max="10.0" step="0.001"
                            className={`${weight_input_css} focus:outline-none focus:ring-1 focus:${e.textFocusColor}`}
                            onChange={e => onChangeWeight(e.target.id, e.target.value)} />
                        </div>
                      </label>
                      <input type="range" id={`b${i}`} min="-10.0" max="10.0" step="0.001"
                        className={`w-full h-[6px] cursor-pointer my-[3px] ${e.sliderColor}`}
                        onChange={e => onChangeWeight(e.target.id, e.target.value)} />
                    </div>

                    <div className="w-1/3 pr-1">
                      <label htmlFor={`wOut${i}-input`} className="text-xs font-medium block">
                        <div className="flex items-center whitespace-nowrap">
                          <span className="flex-shrink">重み w2:</span>
                          <input type="number" id={`wOut${i}-input`} min="-10.0" max="10.0" step="0.001"
                            className={`${weight_input_css} focus:outline-none focus:ring-1 focus:${e.textFocusColor}`}
                            onChange={e => onChangeWeight(e.target.id, e.target.value)} />
                        </div>
                      </label>
                      <input type="range" id={`wOut${i}`} min="-10.0" max="10.0" step="0.001"
                        className={`w-full h-[6px] cursor-pointer my-[3px] ${e.sliderColor}`}
                        onChange={e => onChangeWeight(e.target.id, e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 個別のグラフ */}
            <div id="graph-area-top" className="right-panel">
              <div className="flex items-center justify-between w-full mb-3">
                <h3 className="text-base font-semibold m-0">個別のグラフ (G1, G2)</h3>
              </div>
              <div className="chart-container w-full flex-1 min-h-0">
                <canvas id="individual-graphs-canvas" className="h-0 min-h-full"></canvas>
              </div>
            </div>
          </div>

          {/* 下部パネル */}
          <div id="lower-panel" className="lower-panel">

            {/* ニューラルネットワークの構造 */}
            <div id="drawing-area" className="left-panel relative">
              <div className="flex justify-between items-center">
                <div className="text-base font-semibold m-0">ニューラルネットワークの構造</div>
                <div className="text-xs flex">
                  <button className={btnStatusManual} onClick={() => setProgrammingMode('manual')}>構造(手動で学習)</button>
                  <button className={btnStatusProgramming} onClick={() => setProgrammingMode('programming')}>自動(プログラムで学習)</button>
                </div>
              </div>
              {programmingMode === 'manual' ? <NeuralNetGraph /> : <Editor onUpdateWeight={onUpdateWeight} getCurrentTrainingDataType={getCurrentTrainingDataType} />}
            </div>

            {/* グラフの可算結果 */}
            <div id="graph-area-bottom" className="right-panel">
              <div className="flex items-center justify-between w-full mb-1">
                <div className="text-base font-semibold m-0">グラフの可算結果 (G1+G2)</div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold">誤差(MSE):</span> <span
                    id="mse-value">0.0000</span>
                </div>
              </div>

              <div
                className="target-settings mb-1 p-2 border-none rounded-lg shadow-sm text-xs bg-inherit w-full">
                <div className="flex items-center bg-inherit">
                  <label htmlFor="target-select"
                    className="mr-2 font-medium whitespace-nowrap">目標点データ:</label>
                  <select id="target-select" defaultValue="0"
                    className="p-1 border-8 border-amber-200 rounded text-xs bg-inherit text-inherit appearance-none"
                    ref={trainingDataTypeRef}
                    onChange={e => onChangeScatterPoints(e.target.selectedOptions[0].text)}>
                    <option value="0">原点通る直線</option>
                    <option value="1">原点通る折れ線</option>
                    <option value="2">原点通らない直線</option>
                    <option value="3">原点通らない折れ線</option>
                  </select>
                </div>
              </div>

              <div className="chart-container w-full flex-1 min-h-0">
                <canvas id="sum-graph-canvas" className="h-0 min-h-full"></canvas>
              </div>

              <div className="range-settings p-1 border border-gray-300/20 rounded-lg bg-opacity-50 shadow-sm text-xs w-full">
                <div className="flex justify-between items-center mb-1">
                  <div className="font-semibold m-0">グラフ表示範囲設定</div>
                  <button id="toggle-range-settings"
                    className="p-1 rounded-full text-gray-600 hover:bg-gray-200 transition"
                    aria-expanded="false" aria-controls="range-settings-content"
                    onClick={e => onToggleGraphSetting(e.currentTarget)}>
                    <svg id="toggle-icon"
                      className="w-4 h-4 transform rotate-0 transition-transform duration-300" fill="none"
                      stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>

                <div id="range-settings-content" className="hidden flex flex-wrap justify-start gap-x-4 gap-y-2">

                  <div className="flex items-center">
                    <span className="mr-1 font-medium">X軸:</span>
                    <input type="number" id="x0" defaultValue="-1.5" step="0.5"
                      className="no-spin range-input text-center border border-gray-300 rounded p-1"
                      onChange={e => onChangeGraphSetting(e.target.id as keyof typeof rangeParams.current, e.target.value)} />
                    <span className="mx-1">〜</span>
                    <input type="number" id="x1" defaultValue="2.5" step="0.5"
                      className="no-spin range-input text-center border border-gray-300 rounded p-1"
                      onChange={e => onChangeGraphSetting(e.target.id as keyof typeof rangeParams.current, e.target.value)} />
                  </div>

                  <div className="flex items-center">
                    <span className="mr-1 font-medium">Y軸:</span>
                    <input type="number" id="y0" defaultValue="-5" step="1"
                      className="no-spin range-input text-center border border-gray-300 rounded p-1"
                      onChange={e => onChangeGraphSetting(e.target.id as keyof typeof rangeParams.current, e.target.value)} />
                    <span className="mx-1">〜</span>
                    <input type="number" id="y1" defaultValue="4" step="1"
                      className="no-spin range-input text-center border border-gray-300 rounded p-1"
                      onChange={e => onChangeGraphSetting(e.target.id as keyof typeof rangeParams.current, e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* 解説 */}
      {/* <footer className="border border-slate-800 rounded-xl px-4 py-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-sm">⑤ 解説</h3>
          <span className="text-xs px-2 py-1 rounded-full border border-slate-800 text-slate-400">
            操作後に開示
          </span>
        </div>
        <div className="text-sm text-slate-400 leading-relaxed">
          ここに「なぜそうなるか」の説明を表示します。
        </div>
      </footer> */}
    </div>
  );
}

