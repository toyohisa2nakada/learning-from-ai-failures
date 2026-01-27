"use client";

import Editor from "@monaco-editor/react";

export default function App() {
    function onStartLearn() {
        console.log("start")
    }
    return (
        <>
            <Editor
                height="80%"
                defaultLanguage="javascript"
                theme="vs-dark"
                options={{
                    fontSize: 12,
                    lineNumbers: 'off',
                    minimap: {
                        enabled: false,
                    },
                }}
                defaultValue={`
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
document.addEventListener("DOMContentLoaded", setup);`}
            />
            <button className="px-3 py-1 text-xs font-semibold text-gray-200 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700"
                onClick={e => onStartLearn()}>AIが学習する</button>
        </>
    );
}
