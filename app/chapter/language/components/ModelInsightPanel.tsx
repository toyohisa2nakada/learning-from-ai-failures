"use client";

import { useImperativeHandle, useRef, forwardRef, useEffect, useState } from 'react';

export interface ModelInsightPanelHandle {
    updateModelInsight: () => void;
}

const ModelInsightPanel = forwardRef<ModelInsightPanelHandle>(({ }, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(100);

    useImperativeHandle(ref, () => ({
        updateModelInsight: () => {
            console.log('updateModelInsight');
        }
    }));

    /**
     * 2つの要素間に矢印を作成
     * @param startId - 開始要素のID（「平均」セル）
     * @param endId - 終了要素のID
     * @param endOffsetY - 終点のY座標オフセット（負の値で上に移動）
     */
    const createEdge = (startId: string, endId: string, endOffsetY: number = -10) => {
        const svg = svgRef.current;
        if (!svg) return;

        // const startElement = document.getElementById(startId);
        // const endElement = document.getElementById(endId);
        const container = containerRef.current;
        if (!container) return;

        const startElement = container.querySelector(`#${startId}`);
        const endElement = container.querySelector(`#${endId}`);

        if (!startElement || !endElement) {
            console.error(`Element not found: ${startId} or ${endId}`);
            return;
        }

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
        line.setAttribute('stroke-width', '1');
        line.setAttribute('marker-end', 'url(#arrowhead)');

        svg.appendChild(line);
    };

    const drawArrows = () => {
        const svg = svgRef.current;
        const container = containerRef.current;
        if (!svg || !container) return;

        setContainerWidth(container.offsetWidth);

        // 既存の矢印を削除
        const lines = svg.querySelectorAll('line');
        lines.forEach(line => line.remove());

        // 矢印を再作成
        createEdge('average-cell', 'word-道路', -4);
        createEdge('average-cell', 'word-食事', -4);
        createEdge('average-cell', 'word-ハン', -4);
        createEdge('average-cell', 'word-ellipsis', -4);
        createEdge('average-cell', 'word-わたる', -4);
        createEdge('average-cell', 'word-たべる', -4);
    };

    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
        }

        // 初回描画
        drawArrows();

        // リサイズ時に再描画
        window.addEventListener('resize', drawArrows);
        return () => window.removeEventListener('resize', drawArrows);
    }, []);

    return (
        <div ref={containerRef} className="text-xs">
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
                        <td>右</td>
                        <td>十</td>
                        <td>道路</td>
                        <td>九</td>
                        <td>ハシ</td>
                    </tr>
                    <tr>
                        <td colSpan={5} style={{ textAlign: 'center' }} id="average-cell">平均</td>
                    </tr>
                </tbody>
            </table>

            {/* 矢印（SVG） */}
            <svg ref={svgRef} id="arrow-svg" viewBox={`0 0 ${containerWidth} 40`} style={{ height: '40px', width: '100%', display: 'block' }}>
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" fill="rgba(140, 140, 140, 1)" />
                    </marker>
                </defs>
            </svg>

            {/* 下部の表 */}
            <table className="bottom-table">
                <tbody>
                    <tr>
                        <td id="word-単語">単語</td>
                        <td id="word-道路">道路</td>
                        <td id="word-食事">食事</td>
                        <td id="word-ハン">ハン</td>
                        <td id="word-ellipsis">・・・</td>
                        <td id="word-わたる">わたる</td>
                        <td id="word-たべる">たべる</td>
                    </tr>
                    <tr>
                        <td className="probability-cell">確率</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
});

ModelInsightPanel.displayName = 'ModelInsightPanel';
export default ModelInsightPanel;