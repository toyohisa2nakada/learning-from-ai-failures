"use client";

import { useImperativeHandle, useRef, forwardRef, useEffect, useState } from 'react';
import { type Dataset } from '@/app/chapter/language/components/DatasetPanel';

const VOCAB_TOP_N = 5;

interface ModelInsightPanelProps {
    modelName: string;
}

export interface ModelInsightPanelHandle {
    updateModelInsight: () => void;
    updateDataset: (dataset: Dataset, test_pattern_index: number) => void;
}

const ModelInsightPanel = forwardRef<ModelInsightPanelHandle, ModelInsightPanelProps>(({ modelName }, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(100);
    const [datasetState, setDatasetState] = useState<{ dataset: Dataset, test_pattern_index: number } | null>(null);
    const [vocabCellMinWidth, setVocabCellMinWidth] = useState<number | undefined>(undefined);
    const edgeElementsRef = useRef<{ sources: HTMLTableCellElement[], targets: HTMLTableCellElement[] }>({ sources: [], targets: [] });
    const edgeSVGElementsRef = useRef<SVGLineElement[]>([]);
    const measureSpanRef = useRef<HTMLSpanElement>(null);

    useImperativeHandle(ref, () => ({
        updateModelInsight: () => {
            console.log('updateModelInsight');

            // test
            edgeSVGElementsRef.current[0]?.setAttribute('stroke', 'red');
            const w = Number(edgeSVGElementsRef.current[0]?.getAttribute('stroke-width') ?? "0");
            edgeSVGElementsRef.current[0]?.setAttribute('stroke-width', (w + 0.05).toString());

        },
        updateDataset: (dataset: Dataset, test_pattern_index: number) => {
            console.log('updateDataset', dataset);
            setDatasetState({ dataset, test_pattern_index });
        }
    }));

    /**
     * 2つの要素間に矢印を作成
     * @param startId - 開始要素のID（「平均」セル）
     * @param endId - 終了要素のID
     * @param endOffsetY - 終点のY座標オフセット（負の値で上に移動）
     */
    const createEdge = (startElement: HTMLTableCellElement, endElement: HTMLTableCellElement, endOffsetY: number = -10): SVGLineElement | null => {
        const svg = svgRef.current;
        if (!svg) return null;

        const container = containerRef.current;
        if (!container) return null;

        // 各要素の位置を取得
        const startRect = startElement.getBoundingClientRect();
        const endRect = endElement.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        // SVGを基準とした相対座標を計算
        // 開始点：「平均」セルの中央下部
        const startX = startRect.left + startRect.width / 2 - svgRect.left;
        const startY = startRect.bottom - svgRect.top;

        // 終了点：ターゲット要素の中央上部 + オフセット
        const endX = endRect.left + endRect.width / 2 - svgRect.left;
        const endY = endRect.top - svgRect.top + endOffsetY;

        // 線を作成
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', startX.toString());
        line.setAttribute('y1', startY.toString());
        line.setAttribute('x2', endX.toString());
        line.setAttribute('y2', endY.toString());
        line.setAttribute('stroke', 'rgba(140, 140, 140, 1)');
        line.setAttribute('stroke-width', '0.5');

        svg.appendChild(line);
        return line;
    };

    const drawArrows = () => {
        const svg = svgRef.current;
        const container = containerRef.current;
        const edgeElements = edgeElementsRef.current;
        if (!svg || !container || !edgeElements) return;

        setContainerWidth(container.offsetWidth);

        // 既存の矢印を削除
        const lines = svg.querySelectorAll('line');
        lines.forEach(line => line.remove());
        edgeSVGElementsRef.current.length = 0;

        // 矢印を再作成
        edgeElements.sources.forEach((source) => {
            edgeElements.targets.forEach((target) => {
                const el = createEdge(source, target, -2);
                if (el) edgeSVGElementsRef.current.push(el);
            });
        });
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
        // drawArrows();
    }, [datasetState]);

    useEffect(() => {
        drawArrows();
    }, [vocabCellMinWidth])

    edgeElementsRef.current.sources.length = 0;
    edgeElementsRef.current.targets.length = 0;

    return (
        <div ref={containerRef} className="text-xs">
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

            {/* 上部の表 */}
            <table className="top-table">
                <tbody>
                    <tr>
                        {datasetState?.dataset.test_patterns[datasetState.test_pattern_index].slice(0, -1).map((word, index) => (
                            <td key={index}
                                ref={(el) => { if (modelName === "fnn" && el) edgeElementsRef.current.sources.push(el) }}>
                                {word}
                            </td>
                        ))}
                    </tr>
                    {modelName === 'gap' && (<tr>
                        <td id="average-cell"
                            ref={(el) => { if (el) edgeElementsRef.current.sources.push(el) }}
                            colSpan={(datasetState?.dataset.test_patterns[datasetState.test_pattern_index].length || 1) - 1}
                            style={{ textAlign: 'center' }}>
                            平均
                        </td>
                    </tr>)}
                    {modelName === 'llm' && (<tr>
                        {datasetState?.dataset.test_patterns[datasetState.test_pattern_index].slice(0, -1).map((word, index) => (
                            <td key={index}
                                ref={(el) => { if (el) edgeElementsRef.current.sources.push(el) }}
                                style={{ textAlign: 'center' }}>
                                0.2
                            </td>
                        ))}
                    </tr>)}
                </tbody>
            </table>

            {/* 矢印（SVG） */}
            <svg ref={svgRef} id="arrow-svg" viewBox={`0 0 ${containerWidth} 40`} style={{ height: '40px', width: '100%', display: 'block' }}>
            </svg>

            {/* 下部の表 */}
            <table className="bottom-table">
                <tbody>
                    <tr>
                        <td id="word-単語">単語</td>
                        {[...Array(VOCAB_TOP_N).keys()].map((i) =>
                            <td key={i}
                                id={`vocab-${i}`}
                                ref={(el) => { if (el) edgeElementsRef.current.targets.push(el) }}
                                style={vocabCellMinWidth !== undefined ? { minWidth: `${vocabCellMinWidth}px` } : undefined}>
                                {Object.keys(datasetState?.dataset.vocab ?? {})[i] || ""}
                            </td>
                        )}
                        <td key={VOCAB_TOP_N}
                            id={`vocab-${VOCAB_TOP_N}`}
                            ref={(el) => { if (el) edgeElementsRef.current.targets.push(el) }}
                            style={vocabCellMinWidth !== undefined ? { minWidth: `${vocabCellMinWidth}px` } : undefined}>
                            ...
                        </td>
                    </tr>
                    <tr>
                        <td className="probability-cell">確率</td>
                        {[...Array(VOCAB_TOP_N + 1).keys()].map((i) =>
                            <td key={i} id={`vocab-prob-${i}`}
                                style={vocabCellMinWidth !== undefined ? { minWidth: `${vocabCellMinWidth}px` } : undefined}></td>
                        )}
                    </tr>
                </tbody>
            </table>
        </div>
    );
});

ModelInsightPanel.displayName = 'ModelInsightPanel';
export default ModelInsightPanel;