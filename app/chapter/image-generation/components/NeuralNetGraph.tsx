"use client";
import { useEffect, useRef } from 'react';

/**
 * drawNetwork
 * @param {Object} options
 * @param {number}   options.input  - 入力ニューロン数
 * @param {boolean}  options.bias   - バイアスノードを表示するか
 * @param {number}   options.unit   - 中間層ニューロン数
 * @param {number[]} options.output - 出力画像サイズ [width, height]
 * @returns {SVGElement}
 */
function drawNetwork({ input, bias, unit, output }: { input: number, bias: boolean, unit: number, output: number[] }): SVGSVGElement {
    const [outW, outH] = output;

    // ── レイアウト定数 ──────────────────────────────────────
    const SVG_W = 600;
    const SVG_H = 360;
    const NODE_R = 24;
    const BIAS_R = 20;
    const NODE_GAP = 72;
    const N_RENDERED_OUTPUT_CELLS = 8;

    // 出力ボックスのSVG内サイズ
    const BOX_MAX = 100;
    const BOX_SCALE = Math.min(BOX_MAX / outW, BOX_MAX / outH);
    const BOX_W = outW * BOX_SCALE;
    const BOX_H = outH * BOX_SCALE;
    const CH_OFFSET = 14; // RGBチャンネルの奥行きオフセット

    // 各層のX座標
    const X_INPUT = 30;
    const X_HIDDEN = 120;
    const X_OUT_RED = SVG_W - 280 - BOX_W - CH_OFFSET * 2; // 最前面(Red)のox

    // RGB各チャンネル（後→前の順）
    const channels = [
        { label: 'Blue', color: '#3b82f6', ox: X_OUT_RED, oy: SVG_H / 2 - BOX_H / 2 - CH_OFFSET },
        { label: 'Green', color: '#22c55e', ox: X_OUT_RED + CH_OFFSET, oy: SVG_H / 2 - BOX_H / 2 },
        { label: 'Red', color: '#ef4444', ox: X_OUT_RED + CH_OFFSET * 2, oy: SVG_H / 2 - BOX_H / 2 + CH_OFFSET },
    ];


    // ノード座標
    const inputNodes = input + (bias ? 1 : 0);
    function layerYs(count: number, centerY: number, gap: number) {
        const h = (count - 1) * gap;
        return Array.from({ length: count }, (_, i) => centerY - h / 2 + i * gap);
    }
    const inputYs = layerYs(inputNodes, SVG_H / 2, NODE_GAP);
    const hiddenYs = layerYs(unit, SVG_H / 2, NODE_GAP);

    // ── SVGユーティリティ ──────────────────────────────────
    const ns = 'http://www.w3.org/2000/svg';
    function el(tag: string, attrs: { [key: string]: string | number } = {}) {
        const e = document.createElementNS(ns, tag);
        for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v.toString());
        return e;
    }
    function txt(str: string, attrs = {}) {
        const t = el('text', attrs);
        t.textContent = str;
        return t;
    }
    function ln(x1: number, y1: number, x2: number, y2: number, attrs = {}) {
        return el('line', { x1, y1, x2, y2, ...attrs });
    }

    // ── SVGルート ─────────────────────────────────────────
    const svg = el('svg', {
        width: SVG_W, height: SVG_H,
        viewBox: `0 0 ${SVG_W} ${SVG_H}`,
        xmlns: ns,
    }) as SVGSVGElement;

    // ── defs：グリッドパターン ─────────────────────────────
    const defs = el('defs');
    const gridPat = el('pattern', { id: 'grid', width: '30', height: '30', patternUnits: 'userSpaceOnUse' });
    const gp = el('path', { d: 'M 30 0 L 0 0 0 30', fill: 'none', stroke: '#1e3a5f', 'stroke-width': '0.5' });
    gridPat.appendChild(gp);
    defs.appendChild(gridPat);
    svg.appendChild(defs);

    // 背景グリッド
    // svg.appendChild(el('rect', { width: SVG_W, height: SVG_H, fill: 'url(#grid)', opacity: '0.4', rx: '12' }));

    // ── エッジ（直線）：入力層 → 中間層 ───────────────────
    const edgeColor = 'rgba(160,210,255,0.22)';
    const edgeG1 = el('g');
    for (const iy of inputYs) {
        for (const hy of hiddenYs) {
            edgeG1.appendChild(ln(
                X_INPUT + NODE_R, iy,
                X_HIDDEN - NODE_R, hy,
                { stroke: edgeColor, 'stroke-width': '1' }
            ));
        }
    }
    svg.appendChild(edgeG1);

    // ── エッジ（直線）：中間層 → 出力層（各ニューロン → 3チャンネル全て） ──
    // 接続先：各チャンネルボックスの左辺中央
    const cellSize = [BOX_W / N_RENDERED_OUTPUT_CELLS, BOX_H / N_RENDERED_OUTPUT_CELLS];
    const edgeG2 = el('g');
    for (const hy of hiddenYs) {
        for (const ch of channels) {
            const tx = ch.ox;
            const ty = ch.oy;
            for (let x = 0; x < N_RENDERED_OUTPUT_CELLS; x += 1) {
                for (let y = 0; y < N_RENDERED_OUTPUT_CELLS; y += 1) {
                    edgeG2.appendChild(ln(
                        X_HIDDEN + NODE_R, hy,
                        tx + x * cellSize[0] + cellSize[0] / 2, ty + y * cellSize[1] + cellSize[1] / 2,
                        { stroke: edgeColor, 'stroke-width': '0.2' }
                    ));
                }
            }
        }
    }
    svg.appendChild(edgeG2);

    // ── 出力層：RGBボックス（後→前の順で描画） ────────────
    function drawBoxGrid(x: number, y: number, w: number, h: number, color: string) {
        const g = el('g', { opacity: '0.28' });
        for (let c = 1; c < N_RENDERED_OUTPUT_CELLS; c++) {
            const px = x + (w / N_RENDERED_OUTPUT_CELLS) * c;
            g.appendChild(ln(px, y, px, y + h, { stroke: color, 'stroke-width': '0.7' }));
        }
        for (let r = 1; r < N_RENDERED_OUTPUT_CELLS; r++) {
            const py = y + (h / N_RENDERED_OUTPUT_CELLS) * r;
            g.appendChild(ln(x, py, x + w, py, { stroke: color, 'stroke-width': '0.7' }));
        }
        return g;
    }

    const outGroup = el('g');
    for (const ch of channels) {
        outGroup.appendChild(el('rect', {
            x: ch.ox, y: ch.oy, width: BOX_W, height: BOX_H,
            fill: ch.color, opacity: '0.12', rx: '2'
        }));
        outGroup.appendChild(drawBoxGrid(ch.ox, ch.oy, BOX_W, BOX_H, ch.color));
        outGroup.appendChild(el('rect', {
            x: ch.ox, y: ch.oy, width: BOX_W, height: BOX_H,
            fill: 'none', stroke: ch.color, 'stroke-width': '1.8', rx: '2', opacity: '0.9'
        }));
    }

    // W/H ラベル（最前面 Red ボックス基準）
    const fc = channels[2]; // Red
    outGroup.appendChild(txt(`W: ${outW}`, {
        x: fc.ox + BOX_W / 2, y: fc.oy + BOX_H + 20,
        fill: '#94a3b8', 'font-size': '13', 'text-anchor': 'middle'
    }));
    outGroup.appendChild(txt(`H: ${outH}`, {
        x: fc.ox - 10, y: fc.oy + BOX_H / 2,
        fill: '#94a3b8', 'font-size': '13', 'text-anchor': 'end', 'dominant-baseline': 'middle'
    }));
    svg.appendChild(outGroup);

    // ── 中間層ノード（白枠、塗りなし） ───────────────────────
    const hiddenG = el('g');
    for (const i in hiddenYs) {
        hiddenG.appendChild(el('circle', {
            cx: X_HIDDEN, cy: hiddenYs[i], r: NODE_R,
            fill: 'none',
            stroke: 'rgba(255,255,255,0.85)',
            'stroke-width': '1.8'
        }));
        hiddenG.appendChild(txt(`ニューロン${Number(i) + 1}`, {
            x: X_HIDDEN, y: hiddenYs[i],
            fill: 'rgba(255,255,255,0.85)',
            'font-size': 8,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle'
        }))
    }
    svg.appendChild(hiddenG);

    // ── 入力層ノード（白枠、白文字） ────────────────────────
    const inputG = el('g');
    for (let i = 0; i < inputNodes; i++) {
        const y = inputYs[i];
        const isBias = bias && i === inputNodes - 1;
        const r = isBias ? BIAS_R : NODE_R;
        const label = isBias ? 'バイアス' : '入力';
        const fontSize = isBias ? '10' : '11';

        inputG.appendChild(el('circle', {
            cx: X_INPUT, cy: y, r,
            fill: 'none',
            stroke: 'rgba(255,255,255,0.85)',
            'stroke-width': '1.8'
        }));
        inputG.appendChild(txt(label, {
            x: X_INPUT, y: y + 1,
            fill: 'rgba(255,255,255,0.90)',
            'font-size': fontSize,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle'
        }));
    }
    svg.appendChild(inputG);

    // ── レイヤーラベル ────────────────────────────────────
    const LABEL_Y = 32;
    svg.appendChild(txt(`中間層 (${unit})`, {
        x: X_HIDDEN, y: LABEL_Y,
        fill: '#94a3b8', 'font-size': '13', 'text-anchor': 'middle'
    }));
    svg.appendChild(txt(`出力層 (${outW} × ${outH} × 3)`, {
        x: X_OUT_RED + BOX_W / 2 + CH_OFFSET,
        y: LABEL_Y,
        fill: '#94a3b8', 'font-size': '13', 'text-anchor': 'middle'
    }));

    // ── 凡例（RGB）────────────────────────────────────────
    const legendStartX = X_OUT_RED;
    const legendY = 100;
    const legendItems = [...channels].reverse();
    for (let i = 0; i < legendItems.length; i++) {
        const lx = legendStartX + [0, 44, 98][i];
        svg.appendChild(el('rect', {
            x: lx, y: legendY, width: 13, height: 13,
            fill: legendItems[i].color, rx: '2', opacity: '0.9'
        }));
        svg.appendChild(txt(legendItems[i].label, {
            x: lx + 16, y: legendY + 7,
            fill: '#cbd5e1', 'font-size': '12', 'dominant-baseline': 'middle'
        }));
    }

    return svg;
}
export default function NeuralNetGraph() {
    const svgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (svgRef.current && !svgRef.current.hasChildNodes()) {
            svgRef.current.appendChild(drawNetwork({
                input: 1, bias: true, unit: 4, output: [48, 48]
            }));
        }
    }, []);
    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="text-xs shrink-0 mb-2">
                入力xに値がセットされ、バイアスには常に1が設定されます。各ニューロンは、その値を使って指定された計算式で値を求め、それらをすべて足し合わせたものが出力yとなります。
            </div>
            <div className="min-h-0" ref={svgRef}>
            </div>

            <div className="shrink-0 mt-2">
                <div className="text-xs">
                    AIは、この出力yが教師データと一致するように、自動的に重みwとバイアスの重みbを調整して決定します。なお、このツールの目的は、ユーザーがこれらの重みを直感的に試して手動で求めることです。
                </div>
            </div>
            <div className="flex-1" />
        </div>
    );
}
