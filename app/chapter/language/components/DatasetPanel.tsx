"use client";

import React, { useEffect, useRef, useState, useImperativeHandle } from 'react';

interface DatasetPanelProps {
    onDatasetChange: (dataset: Readonly<Dataset>) => void;
}

declare namespace tf {
    type Tensor2D = any;
    type Tensor1D = any;
    function tensor2d(data: number[][], shape?: [number, number], dtype?: string): Tensor2D;
    function tensor1d(data: number[], dtype?: string): Tensor1D;
}

export interface Dataset {
    setTf: (tf: any) => void;
    train_x: () => tf.Tensor2D;
    train_y: () => tf.Tensor1D;
    toTensor: (data: number[][]) => tf.Tensor2D;
    maxLen: number;
    vocab: { [key: string]: number };
    encode: (words: string[]) => number[];
    decode: (code: number) => string;
    // 例: [['車道','ノイズ','ハシ','わたる'], ['食堂','ノイズ','ハシ','たべる']]
    test_patterns: string[][];
    // 例: ["私は 猫が 好きです", "俺は 猫が 好きだ"]
    train_patterns: string[][];
    tokenize: (input: string) => { tokens: number[], errorMessage?: string };
}

export type EvaluationResult = {
    correct_answer: string;
    predicted: string;
    test_pattern: string[];
    topKIndices: number[];
    topKValues: number[];
    attentionScores: number[][][]; // head, query, key
    weights: number[][]; // neuron+bias, vocab
}

export interface DatasetPanelHandle {
    updatePredictions: (resultSet: { modelName: string, results: EvaluationResult[] }) => void;
    clearPredictions: () => void;
}


function generateDatasets({ train_patterns, test_patterns, mode = "next" }: { train_patterns: string[][], test_patterns: string[][], mode?: "next" | "last" }): Dataset {
    const maxLen = Math.max(...train_patterns.map(e => e.length));
    const allWords: string[] = [...new Set(train_patterns.flat())].sort();
    const vocab: { [key: string]: number } = { "<P>": 0, ...allWords.reduce((a, e, i) => ({ ...a, [e]: i + 1 }), {}) }

    function encode(words: string[]): number[] {
        const inputPad = new Array(maxLen - words.length - 1).fill(vocab["<P>"]);
        return [...inputPad, ...words.map(w => vocab[w])];
    }
    function decode(code: number): string {
        return allWords[code - 1];
    }
    function tokenize(input: string): { tokens: number[], errorMessage?: string } {
        const words = Object.keys(vocab).sort((a, b) => b.length - a.length);
        const chunks = input.trim().split(/\s+/).filter(Boolean);
        const ids: number[] = [];
        for (const chunk of chunks) {
            let rest = chunk;
            while (rest.length > 0) {
                let matchedWord: string | null = null;
                for (const w of words) {
                    if (rest.startsWith(w)) {
                        matchedWord = w;
                        break;
                    }
                }
                if (!matchedWord) {
                    return { tokens: [], errorMessage: `未知の語が含まれています: "${rest}"（chunk="${chunk}"）` };
                }
                ids.push(vocab[matchedWord]);
                rest = rest.slice(matchedWord.length);
            }
        }
        return { tokens: Array(Math.max(0, maxLen - 1 - ids.length)).fill(0).concat(ids) };
    }

    const sequences: { inputSeq: number[], targetWord: number }[] = [];
    train_patterns.forEach(words => {
        const n = words.length;
        if (mode === "next") {
            for (let i = 1; i < n; i++) {
                sequences.push({ inputSeq: encode(words.slice(0, i)), targetWord: vocab[words[i]] });
            }
        } else if (mode === "last") {
            sequences.push({ inputSeq: encode(words.slice(0, n - 1)), targetWord: vocab[words[n - 1]] });
        }
    });

    // const inputs = tf.tensor2d(sequences.map(e => e.inputSeq), [sequences.length, maxLen - 1], 'int32');
    // const targets = tf.tensor1d(sequences.map(e => e.targetWord), 'float32');
    let train_x_backup: any = null;
    let train_y_backup: any = null;
    let tf_backup: any = null;
    return {
        setTf: (tf: any) => { if (tf_backup !== null) { train_x_backup = null; train_y_backup = null; } tf_backup = tf; },
        train_x: () => train_x_backup ?? (train_x_backup = tf_backup.tensor2d(sequences.map(e => e.inputSeq), [sequences.length, maxLen - 1], 'int32')),
        train_y: () => train_y_backup ?? (train_y_backup = tf_backup.tensor1d(sequences.map(e => e.targetWord), 'float32')),
        toTensor: (seq: any) => tf_backup.tensor2d(seq, [seq.length, maxLen - 1], 'int32'),
        maxLen, vocab, encode, decode, train_patterns, test_patterns, tokenize
    };
}

function generateFavoriteDatasets() {
    const objects = [["ポケモン", "ゲーム", "カレー"], ["大学"]];
    const subjects: [string, string[]][] = [["私は", ["好きです", "嫌いです"]], ["俺は", ["好きだ", "嫌いだ"]]];


    const test_patterns: string[][] = [];
    // const correct_answers: string[] = [];

    const choice = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    objects.forEach((objs, objs_i) => {
        const obj = choice(objs);
        subjects.forEach(sub => {
            // 順列
            test_patterns.push([sub[0], obj, sub[1][objs_i]]);
            // correct_answers.push(sub[1][objs_i]);

            // 逆順
            test_patterns.push([obj, sub[0], sub[1][objs_i]]);
            // correct_answers.push(sub[1][objs_i]);
        })
    })

    const train_patterns: string[][] = [];
    objects.map((o, i) => o.map(oi => [oi, i] as [string, number])).flat().forEach(([oi, i]) => {
        subjects.forEach(([sub, verbs]) => {
            train_patterns.push([sub, oi, verbs[i]]);
        })
    });
    return generateDatasets({ train_patterns, test_patterns, mode: "next" });
}
function generateHomonymDatasets() {
    const numSlots = 4; // ハシの前の語数
    const numDataPerType = 64; // 各パターンのデータ数

    const contextGroups = [
        ["道路", "車道", "歩道"],
        ["食事", "食卓", "食器"]
    ];
    const lastWord = "ハシ";
    const targetWords = ["わたる", "たべる", "不明"];
    const contextNoise = ["山", "空", "海", "音", "光", "英", "国", "県", "東", "西", "南", "北"];
    const noContextNoise = ["右", "左", "壱", "弐", "参", "四", "五", "六", "七", "八", "九", "十"];

    const train_patterns: string[][] = [];
    const test_patterns: string[][] = [];
    // const correct_answers: string[] = [];

    const shuffle = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);
    const slotIndices: number[] = Array.from({ length: numSlots - 1 }, (_, i) => i + 1);

    // 1. 有効なコンテキストを含むデータの生成
    for (let i = 0; i < numDataPerType * contextGroups.length; i++) {
        const words = shuffle(contextNoise).slice(0, numSlots);
        const ctxIdx = i % contextGroups.length;
        words[shuffle(slotIndices)[0]] = contextGroups[ctxIdx][i % contextGroups[ctxIdx].length];
        train_patterns.push([...words, lastWord, targetWords[ctxIdx]]);
    }
    // 2. ノイズのみのデータの生成 (128個)
    for (let i = 0; i < numDataPerType; i++) {
        let words = shuffle([...contextNoise, ...noContextNoise]).slice(0, numSlots);
        train_patterns.push([...words, lastWord, targetWords[targetWords.length - 1]]);
    }

    // contextGroupsにある語を持つレコードを見つける
    const findAndExtract = (hasG0: boolean, hasG1: boolean, index = 0): string[] | null => {
        const results = train_patterns.filter(words => {
            const containsG0 = words.some(w => contextGroups[0].includes(w));
            const containsG1 = words.some(w => contextGroups[1].includes(w));
            return containsG0 === hasG0 && containsG1 === hasG1;
        });
        return results[index];
    };

    // noContextNoiseからテストデータを作成
    [...Array(3).keys()].forEach(i => {
        const words = shuffle(noContextNoise).slice(0, numSlots);
        const ctxIdx = i % contextGroups.length;
        words[Math.floor(Math.random() * numSlots)] = contextGroups[ctxIdx][Math.floor(Math.random() * contextGroups[ctxIdx].length)];
        test_patterns.push([...words, lastWord, targetWords[ctxIdx]]);
        // correct_answers.push(targetWords[ctxIdx]);
    });

    // 1語目にコンテキストを入れる
    [...Array(1).keys()].map(i => findAndExtract(i % 2 === 0, i % 2 === 1)).filter(e => e !== null).forEach(seq => {
        test_patterns.push([...seq.slice(0, numSlots + 1), seq[numSlots + 1]]);
        // correct_answers.push(seq[numSlots + 1])

        const ctxWord: string | undefined = seq.find(e => contextGroups.flat().includes(e))
        const ctxIdx = seq.indexOf(ctxWord!)
        const tagIdx = 0;
        [seq[tagIdx], seq[ctxIdx]] = [seq[ctxIdx], seq[tagIdx]];
        test_patterns.push([...seq.slice(0, numSlots + 1), seq[numSlots + 1]]);
        // correct_answers.push(seq[numSlots + 1])
    });

    return generateDatasets({ train_patterns, test_patterns, mode: "last" })
}


function getDatasetHeader(col: string[], i: number) {
    if (i === col.length - 1) return "期待される出力";
    return `入力${i + 1}`;
}

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

const DatasetPanel = React.forwardRef<DatasetPanelHandle, DatasetPanelProps>(({ onDatasetChange }, ref) => {
    const datasetRef = useRef<Dataset | null>(null);
    const evaluationCellRef = useRef<HTMLTableCellElement[]>([]);
    const evaluationResultsRef = useRef<{ [modelName: string]: HTMLDivElement }[]>([]);
    const [selected, setSelected] = useState("Homonym");

    function clearPredictions() {
        if (datasetRef.current && evaluationCellRef.current && evaluationResultsRef.current) {
            evaluationCellRef.current.forEach((el, i) => {
                if (el) el.innerHTML = "";
                evaluationResultsRef.current[i] = {};
            });
            evaluationCellRef.current.length = datasetRef.current.test_patterns.length;
        }
    }

    useImperativeHandle(ref, () => ({
        updatePredictions: (resultSet: { modelName: string, results: EvaluationResult[] }) => {
            if (!evaluationCellRef.current || !evaluationResultsRef.current) return;
            resultSet.results.forEach((result, i) => {
                const cell = evaluationCellRef.current[i];
                if (!cell) return;
                const div = evaluationResultsRef.current[i][resultSet.modelName] ?? cell.appendChild(document.createElement("div"));
                if (!div) return;

                const textColor = result.correct_answer === result.predicted ? "#16a34a" : "#b91c1cbf";
                div.innerHTML = `<small title="${resultSet.modelName}">${getModelIcon(resultSet.modelName)}</small><span style="color: ${textColor}">${result.predicted}</span>`;
                evaluationResultsRef.current[i][resultSet.modelName] = div;
            });
        },
        clearPredictions
    }));

    useEffect(() => {
        // generateFavoriteDatasets, generateHomonymDatasets
        clearPredictions();
        datasetRef.current = selected === "Homonym" ? generateHomonymDatasets() : generateFavoriteDatasets();
        onDatasetChange(datasetRef.current);
    }, [selected]);

    return (
        <div className="bg-inherit">
            <div className="font-semibold">データセットと予測結果</div>

            <div className="bg-inherit">
                <label htmlFor="dataSelect">データ選択：</label>
                <select className="bg-inherit" id="dataSelect" value={selected} onChange={(e) => setSelected(e.target.value)}>
                    <option value="Homonym">同音異義語データ</option>
                    <option value="Favorite">好き嫌いデータ</option>
                </select>
            </div>

            <style jsx>{`
                table {
                    border: 2px solid rgb(140 140 140);
                    border-collapse: collapse;
                }
                
                th, td {
                    border: 1px solid rgb(140 140 140);
                    padding: 4px;
                }
            `}</style>
            <div className="flex flex-row text-xs">
                <div>
                    <strong>学習データ</strong>
                    <table className="inner-table">
                        <thead>
                            <tr>
                                {datasetRef.current?.train_patterns[0].map((_, i) => (
                                    <th key={i}>{getDatasetHeader(datasetRef.current?.train_patterns[0]!, i)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {datasetRef.current?.train_patterns.map((row, i) => (
                                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div>
                    <strong>テストデータ</strong>
                    <table className="inner-table">
                        <thead>
                            <tr>
                                {datasetRef.current?.test_patterns[0].map((_, i) => (
                                    <th key={i}>{getDatasetHeader(datasetRef.current?.test_patterns[0]!, i)}</th>
                                ))}
                                <th>予測結果</th>
                            </tr>
                        </thead>
                        <tbody>
                            {datasetRef.current?.test_patterns.map((row, i) => (
                                <tr key={i}>
                                    {row.map((cell, j) => <td key={j}>{cell}</td>)}
                                    <td ref={el => {
                                        if (el) {
                                            evaluationCellRef.current[i] = el as HTMLTableCellElement;
                                            evaluationResultsRef.current[i] = {};
                                        }
                                    }}></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
});

DatasetPanel.displayName = 'DatasetPanel';
export default DatasetPanel;
