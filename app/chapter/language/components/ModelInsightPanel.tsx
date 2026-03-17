"use client";

import { useImperativeHandle, useRef, forwardRef, useEffect, useState } from 'react';
import { type Dataset, type EvaluationResult } from '@/app/chapter/language/components/DatasetPanel';

const VOCAB_TOP_N = 5;
const INPUT_COLORS = [
    "rgba(228, 26, 28, 0.6)",
    "rgba(55, 126, 184, 0.6)",
    "rgba(77, 175, 74, 0.6)",
    "rgba(152, 78, 163, 0.6)",
    "rgba(255, 127, 0, 0.6)"
];

interface ModelInsightPanelProps {
    modelName: string;
    modelIcons: { [modelName: string]: string };
}

export interface ModelInsightPanelHandle {
    updateModelInsight: (resultSet: { modelName: string, results: EvaluationResult[] }) => void;
    updateDataset: (dataset: Dataset, test_pattern_index: number) => void;
}

const ModelInsightPanel = forwardRef<ModelInsightPanelHandle, ModelInsightPanelProps>(({ modelName, modelIcons }, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const llmSvgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(100);
    const [datasetState, setDatasetState] = useState<{ dataset: Dataset, test_pattern_index: number } | null>(null);
    const [vocabCellMinWidth, setVocabCellMinWidth] = useState<number | undefined>(undefined);
    const edgeElementsRef = useRef<{ sources: (HTMLTableCellElement | null)[], targets: (HTMLTableCellElement | null)[] }>({ sources: [], targets: [] });
    const wordElementsRef = useRef<(HTMLTableCellElement | null)[]>([]);
    const probElementsRef = useRef<(HTMLTableCellElement | null)[]>([]);
    const edgeSVGElementsRef = useRef<(SVGLineElement | SVGPathElement)[][]>([]);
    const llmEdgeElementsRef = useRef<{ sources: (HTMLTableCellElement | null)[], targets: (HTMLTableCellElement | null)[] }>({ sources: [], targets: [] });
    const measureSpanRef = useRef<HTMLSpanElement>(null);
    const lastResultSetRef = useRef<{ modelName: string, results: EvaluationResult[] } | null>(null);

    const applyResultSet = (resultSet: { modelName: string, results: EvaluationResult[] }, patternIndex: number) => {
        wordElementsRef.current.slice(0, -1).filter(e => e !== null).forEach((e, i) => {
            e.textContent = datasetState?.dataset.decode(resultSet.results[patternIndex].topKIndices[i]) ?? '';
        });
        probElementsRef.current.slice(0, -1).filter(e => e !== null).forEach((e, i) => {
            e.textContent = resultSet.results[patternIndex].topKValues[i].toFixed(2);
        });
        const weights = resultSet.results[patternIndex].weights;
        if (weights) {
            resultSet.results[patternIndex].topKIndices.slice(0, VOCAB_TOP_N).forEach((targetIndex, colIndex) => {
                const sourceSize = Math.min(edgeElementsRef.current.sources.length, resultSet.results[patternIndex].test_pattern.length);
                [...Array(sourceSize).keys()].forEach(sourceIndex => {
                    const line = edgeSVGElementsRef.current[sourceIndex][colIndex];
                    const w = weights[sourceIndex][targetIndex];
                    line.setAttribute('stroke-width', (Math.abs(w) * 2).toString());
                    if (w >= 0) line.setAttribute('stroke', 'rgba(245, 158, 11, 0.8)');
                    else line.setAttribute('stroke', 'rgba(14, 165, 233, 0.8)');
                })
            })
        }
        const attentionScores = resultSet.results[patternIndex].attentionScores;
        if (attentionScores) {
            // head軸でsumして [l, l] を作る
            const seqLen = attentionScores[0].length;
            const summed: number[][] = Array.from({ length: seqLen }, (_, i) =>
                Array.from({ length: seqLen }, (_, j) =>
                    attentionScores.reduce((acc, head) => acc + head[i][j], 0) / attentionScores.length
                )
            );
            // multiheadのモデルでは残差を使用しているので、対角成分に1を加える
            summed.forEach((row, i) => {
                row[i] += 1;
            });

            // 最後のquery行 [seqLen] の各値をedgeSVGElementsRef.current[sourceIndex][0]に反映
            const lastRow = summed[seqLen - 1];
            lastRow.forEach((score, sourceIndex) => {
                const edges = edgeSVGElementsRef.current[sourceIndex];
                if (!edges || edges.length === 0) return;
                const line = edges[0];
                if (!line) return;
                line.setAttribute('stroke-width', (Math.abs(score)).toString());
                if (score >= 0) line.setAttribute('stroke', 'rgba(245, 158, 11, 0.8)');
                else line.setAttribute('stroke', 'rgba(14, 165, 233, 0.8)');
            });

            const total = lastRow.reduce((a, b) => a + b, 0);
            let cumulative = 0;
            const stops = lastRow.map((score, i) => {
                const start = cumulative;
                cumulative += (score / total) * 100;
                return `${INPUT_COLORS[i]} ${start.toFixed(2)}% ${cumulative.toFixed(2)}%`;
            });
            const gradientStr = `linear-gradient(to right, ${stops.join(', ')})`;

            const backgroundTargetCells = [llmEdgeElementsRef.current.targets[0], edgeElementsRef.current.targets[0]];
            backgroundTargetCells.filter(e => e != null).forEach(cell => {
                cell.style.backgroundImage = gradientStr;
            });
        }
    };

    useImperativeHandle(ref, () => ({
        updateModelInsight: (resultSet: { modelName: string, results: EvaluationResult[] }) => {
            lastResultSetRef.current = resultSet;
            applyResultSet(resultSet, datasetState?.test_pattern_index ?? 0);
        },
        updateDataset: (dataset: Dataset, test_pattern_index: number) => {
            if (dataset !== datasetState?.dataset) {
                const backgroundTargetCells = [llmEdgeElementsRef.current.targets[0], edgeElementsRef.current.targets[0]];
                backgroundTargetCells.filter(e => e != null).forEach(cell => {
                    cell.style.backgroundImage = "";
                });
                probElementsRef.current.slice(0, -1).filter(e => e !== null).forEach((e, i) => {
                    e.textContent = "";
                });
                lastResultSetRef.current = null;
            }
            setDatasetState({ dataset, test_pattern_index });
        }
    }));

    /**
     * 2つの要素間に矢印を作成
     * @param startId - 開始要素のID（「平均」セル）
     * @param endId - 終了要素のID
     * @param endOffsetY - 終点のY座標オフセット（負の値で上に移動）
     */
    const createEdge = (
        startElement: HTMLTableCellElement,
        endElement: HTMLTableCellElement,
        endOffsetY: number = -10,
        lineShape: 'straight' | 'polyline' = 'straight',
        targetSvg = svgRef.current)
        : SVGLineElement | SVGPathElement | null => {
        if (!targetSvg) return null;

        const container = containerRef.current;
        if (!container) return null;

        // 各要素の位置を取得
        const startRect = startElement.getBoundingClientRect();
        const endRect = endElement.getBoundingClientRect();
        const svgRect = targetSvg.getBoundingClientRect();

        // SVGを基準とした相対座標を計算
        // 開始点：「平均」セルの中央下部
        const startX = startRect.left + startRect.width / 2 - svgRect.left;
        const startY = startRect.bottom - svgRect.top;

        // 終了点：ターゲット要素の中央上部 + オフセット
        const endX = endRect.left + endRect.width / 2 - svgRect.left;
        const endY = endRect.top - svgRect.top + endOffsetY;

        // 線を作成
        let path = null;
        if (lineShape === 'straight') {
            path = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            path.setAttribute('x1', startX.toString());
            path.setAttribute('y1', startY.toString());
            path.setAttribute('x2', endX.toString());
            path.setAttribute('y2', endY.toString());
            path.setAttribute('stroke', 'rgba(140, 140, 140, 1)');
            path.setAttribute('stroke-width', '0.5');
        } else if (lineShape === 'polyline') {
            path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const midY = startY + svgRect.height / 2;
            const d = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
            path.setAttribute('d', d);
            path.setAttribute('stroke', 'rgba(140, 140, 140, 1)');
            path.setAttribute('stroke-width', '0.5');
            path.setAttribute('fill', 'none');
        }
        if (path !== null) targetSvg.appendChild(path);
        return path;
    };

    const drawArrows = () => {
        const svg = svgRef.current;
        const container = containerRef.current;
        const edgeElements = edgeElementsRef.current;
        if (!svg || !container || !edgeElements) return;

        setContainerWidth(container.offsetWidth);

        // 既存の矢印を削除
        const lines = svg.querySelectorAll('line, path');
        lines.forEach(line => line.remove());
        edgeSVGElementsRef.current.length = 0;

        // 矢印を再作成
        edgeElements.sources.forEach((source) => {
            if (!source) return;
            edgeSVGElementsRef.current.push([]);
            edgeElements.targets.forEach((target) => {
                if (!target) return;
                const el = createEdge(source, target, -2);
                if (el) edgeSVGElementsRef.current[edgeSVGElementsRef.current.length - 1].push(el);
            });
        });

        // llm用SVGにmiddle-top-tableの最後の列セルとbottom-tableの最後の列を結ぶpolylineを描画
        if (modelName === 'llm') {
            const llmSvg = llmSvgRef.current;
            if (llmSvg) {
                const existingPaths = llmSvg.querySelectorAll('line, path');
                existingPaths.forEach(p => p.remove());
            }
            llmEdgeElementsRef.current.sources.forEach((source) => {
                if (!source) return;
                llmEdgeElementsRef.current.targets.forEach((target) => {
                    if (!target) return;
                    createEdge(source, target, -2, 'polyline', llmSvgRef.current);
                })
            })
        }
    };

    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
        }

        // リサイズ時に再描画
        window.addEventListener('resize', drawArrows);
        return () => window.removeEventListener('resize', drawArrows);
    }, []);

    useEffect(() => {
        // vocab全キーの中で最大の表示幅を計算してセルのmin-widthに設定
        if (datasetState && measureSpanRef.current) {
            const span = measureSpanRef.current;
            const keys = Object.keys(datasetState.dataset.vocab);
            let maxWidth = 0;
            for (const key of keys) {
                span.textContent = key;
                maxWidth = Math.max(maxWidth, span.getBoundingClientRect().width);
            }
            setVocabCellMinWidth(maxWidth);
        }

        if (lastResultSetRef.current && datasetState) {
            applyResultSet(lastResultSetRef.current, datasetState.test_pattern_index);
        }
    }, [datasetState]);

    useEffect(() => {
        drawArrows();
    }, [vocabCellMinWidth])


    return (
        <div ref={containerRef} className="text-s bg-slate-800/30">
            {/* 幅計測用の非表示スパン（実際のフォントサイズで測定するためDOMに配置） */}
            <span ref={measureSpanRef} style={{ visibility: 'hidden', position: 'absolute', whiteSpace: 'nowrap', fontSize: 'inherit' }} />
            <style jsx>{`
                table {
                    border: 2px solid rgb(140 140 140);
                }
                
                th, td {
                    border: 1px solid rgb(140 140 140);
                }
            `}</style>

            {/* モデル名と入力 */}
            <div className="flex">
                <div className="mx-4">{modelName} {modelIcons[modelName]}</div>
                {/* 入力 */}
                <table className="top-table">
                    <tbody>
                        <tr>{datasetState?.dataset.test_patterns[datasetState.test_pattern_index].slice(0, -1).map((word, index) => (
                            <td key={index}
                                ref={(el) => {
                                    if (modelName === "fnn" || modelName === "llm") {
                                        edgeElementsRef.current.sources[index] = el;
                                    }
                                }}
                                style={{ backgroundColor: INPUT_COLORS[index] }}>
                                {word}
                            </td>
                        ))}</tr>
                        {modelName === 'gap' && (<tr>
                            <td id="average-cell"
                                ref={(el) => { edgeElementsRef.current.sources[0] = el; }}
                                colSpan={(datasetState?.dataset.test_patterns[datasetState.test_pattern_index].length || 1) - 1}
                                style={{ textAlign: 'center' }}>
                                平均
                            </td>
                        </tr>)}
                    </tbody>
                </table>
            </div>

            {/* 出力への矢印 */}
            <svg ref={svgRef} id="arrow-svg" viewBox={`0 0 ${containerWidth} 30`} style={{ height: '30px', width: '100%', display: 'block' }}>
            </svg>

            {/* llm用の中間の表とsvg */}
            {modelName === "llm" && (
                <div className="flex">
                    <div className="mx-4 invisible">{modelName} {modelIcons[modelName]}</div>
                    <table className="middle-top-table">
                        <tbody>
                            <tr>
                                {datasetState?.dataset.test_patterns[datasetState.test_pattern_index].slice(0, -1).map((word, index, arr) => (
                                    <td key={index}
                                        ref={(el) => {
                                            if (index === arr.length - 1) {
                                                llmEdgeElementsRef.current.sources[0] = el;
                                            }
                                            if (index === arr.length - 1) {
                                                edgeElementsRef.current.targets[0] = el;
                                            }
                                        }}
                                        style={{
                                            textAlign: 'center',
                                            opacity: index === arr.length - 1 ? 1.0 : 0.2
                                        }}>
                                        {word}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
            {modelName === "llm" && (
                <svg ref={llmSvgRef} id="llm-arrow-svg" viewBox={`0 0 ${containerWidth} 20`} style={{ height: '20px', width: '100%', display: 'block' }}>
                </svg>
            )}
            {modelName === "llm" && (
                <table className="middle-bottom-table">
                    <tbody>
                        <tr>
                            <td id="word-単語">単語</td>
                            {datasetState?.dataset.test_patterns[datasetState.test_pattern_index].slice(-2, -1).map((word, index) => {
                                return (<td key={index}
                                    ref={(el) => {
                                        llmEdgeElementsRef.current.targets[0] = el;
                                    }}
                                    style={{ textAlign: 'center' }}>
                                    {word}
                                </td>
                                )
                            })}
                        </tr>
                    </tbody>
                </table>
            )
            }
            {modelName === "llm" && (
                <div>一致度トップ{VOCAB_TOP_N}</div>
            )}

            {/* 下部の表 */}
            <table className="bottom-table">
                <tbody>
                    <tr>
                        <td id="word-単語">単語</td>
                        {[...Array(VOCAB_TOP_N).keys()].map((i) => {
                            const word = Object.keys(datasetState?.dataset.vocab ?? {})[i] || "?";
                            return (
                                <td key={`${datasetState?.dataset.name}-${i}`}
                                    id={`vocab-${i}`}
                                    ref={(el) => {
                                        if (modelName === "fnn" || modelName === "gap") {
                                            edgeElementsRef.current.targets[i] = el;
                                        }
                                        wordElementsRef.current[i] = el;
                                    }}
                                    style={vocabCellMinWidth !== undefined ? { minWidth: `${vocabCellMinWidth}px` } : undefined}>
                                    {word}
                                </td>
                            );
                        })}
                        <td key={VOCAB_TOP_N}
                            id={`vocab-${VOCAB_TOP_N}`}
                            ref={(el) => {
                                if (modelName === "fnn" || modelName === "gap") {
                                    edgeElementsRef.current.targets[VOCAB_TOP_N] = el;
                                }
                            }}
                            style={vocabCellMinWidth !== undefined ? { minWidth: `${vocabCellMinWidth}px` } : undefined}>
                            ...
                        </td>
                    </tr>
                    <tr>
                        <td className="probability-cell">確率</td>
                        {[...Array(VOCAB_TOP_N + 1).keys()].map((i) =>
                            <td key={i} id={`vocab-prob-${i}`}
                                ref={(el) => {
                                    probElementsRef.current[i] = el;
                                }}
                                style={vocabCellMinWidth !== undefined ? { minWidth: `${vocabCellMinWidth}px` } : undefined}>
                            </td>
                        )}
                    </tr>
                </tbody>
            </table>
        </div >
    );
});

ModelInsightPanel.displayName = 'ModelInsightPanel';
export default ModelInsightPanel;