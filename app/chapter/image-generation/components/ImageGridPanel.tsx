"use client";

import React, { useImperativeHandle, useRef, forwardRef } from 'react';

export interface ImageGridPanelHandle {
    updateImages: (images: Record<string, number[][]>) => void;
}

const LEARNING_DATA_SIZE: [number, number] = [48, 48];

const ImageGridPanel = forwardRef<ImageGridPanelHandle>((_, ref) => {
    const rows = 4;
    const groups = 6;
    const stepValues = ['0.0', '0.2', '0.4', '0.6', '0.8', '1.0'];
    const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

    useImperativeHandle(ref, () => ({
        updateImages: (images: Record<string, number[][]>) => {
            Object.entries(images).forEach(([key, unitDataArray]) => {
                const normalizedKey = parseFloat(key).toFixed(1);
                unitDataArray.forEach((data, unitIndex) => {
                    const canvas = canvasRefs.current[`${unitIndex}-${normalizedKey}`];
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    const [width, height] = LEARNING_DATA_SIZE;
                    const imageData = ctx.createImageData(width, height);

                    for (let i = 0; i < data.length / 3; i++) {
                        // Data is normalized roughly around 0. applying bias to visualize
                        imageData.data[i * 4 + 0] = Math.max(0, Math.min(255, Math.round((data[i * 3 + 0] + 0.5) * 255)));
                        imageData.data[i * 4 + 1] = Math.max(0, Math.min(255, Math.round((data[i * 3 + 1] + 0.5) * 255)));
                        imageData.data[i * 4 + 2] = Math.max(0, Math.min(255, Math.round((data[i * 3 + 2] + 0.5) * 255)));
                        imageData.data[i * 4 + 3] = 255;
                    }
                    ctx.putImageData(imageData, 0, 0);
                });
            });
        }
    }));

    return (
        <div className="flex flex-col h-full w-full gap-2 font-sans">
            <div className="text-base font-semibold m-0">計算プロセス</div>

            {/* Grid Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 relative">
                <div className="flex flex-col w-full h-full justify-between items-center">
                    {/* 4 Rows */}
                    {Array(rows).fill(0).map((_, rowIndex) => (
                        <div key={`row-${rowIndex}`} className="flex justify-between w-full px-4">
                            {/* 6 Groups (Steps) */}
                            {stepValues.map((val, groupIndex) => (
                                <div key={`group-${rowIndex}-${groupIndex}`} className="flex gap-1">
                                    {/* 2 Columns per group (Unit i and Unit i+4) */}
                                    <div className="w-4 h-4 bg-sky-900/40 border border-sky-500/30 rounded-sm shadow-sm overflow-hidden">
                                        <canvas
                                            ref={el => { canvasRefs.current[`${rowIndex}-${val}`] = el; }}
                                            width={LEARNING_DATA_SIZE[0]}
                                            height={LEARNING_DATA_SIZE[1]}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="w-4 h-4 bg-sky-900/40 border border-sky-500/30 rounded-sm shadow-sm overflow-hidden">
                                        <canvas
                                            ref={el => { canvasRefs.current[`${rowIndex + 4}-${val}`] = el; }}
                                            width={LEARNING_DATA_SIZE[0]}
                                            height={LEARNING_DATA_SIZE[1]}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Axis Row */}
                <div className="w-full px-4 pt-2 relative">
                    <div className="h-0.5 w-full bg-slate-500 relative flex items-center">
                        <div className="absolute right-0 -mr-1 w-2 h-2 border-t-2 border-r-2 border-slate-500 transform rotate-45"></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono px-1">
                        {stepValues.map(val => (
                            <span key={val} className="w-4 text-center">{val}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

ImageGridPanel.displayName = 'ImageGridPanel';
export default ImageGridPanel;
