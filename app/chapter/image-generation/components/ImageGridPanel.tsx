"use client";

import { useImperativeHandle, useRef, forwardRef } from 'react';

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
                    for (let p = 0; p < 2; p += 1) {
                        const canvas = canvasRefs.current[`${unitIndex + p * 4}-${normalizedKey}`];
                        if (!canvas) return;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;

                        const [width, height] = LEARNING_DATA_SIZE;
                        const imageData = ctx.createImageData(width, height);

                        for (let i = 0; i < data.length / 3; i++) {
                            imageData.data[i * 4 + 0] = Math.round(data[i * 3 + 0] * 255 * (p == 0 ? 1 : -1));
                            imageData.data[i * 4 + 1] = Math.round(data[i * 3 + 1] * 255 * (p == 0 ? 1 : -1));
                            imageData.data[i * 4 + 2] = Math.round(data[i * 3 + 2] * 255 * (p == 0 ? 1 : -1));
                            imageData.data[i * 4 + 3] = 255;

                            // debug
                            // if (data[i * 3 + 0] < -0.01 && data[i * 3 + 1] < -0.01 && data[i * 3 + 2] < -0.01) {
                            //     console.log(normalizedKey, unitIndex);
                            // }
                        }
                        ctx.putImageData(imageData, 0, 0);

                    }
                });
            });
        }
    }));

    return (
        <div className="flex flex-col h-full w-full gap-2 font-sans">
            <div className="text-base font-semibold m-0">計算プロセス</div>

            {/* Grid Canvas */}
            <div className="grid-canvas-container flex-1 flex flex-col items-center justify-center p-2 relative">
                <div className="flex flex-col w-full h-full justify-between items-center">
                    <div className="grid grid-cols-6 gap-x-1 w-full px-2">
                        {stepValues.map((_, groupIndex) => (
                            <div key={`header-${groupIndex}`} className="flex gap-0 justify-center text-[10px] font-bold">
                                <div className="w-[50px] text-center text-amber-500/80">+</div >
                                <div className="w-[50px] text-center text-sky-500/80">-</div>
                            </div>
                        ))}
                    </div>
                    {Array(rows).fill(0).map((_, rowIndex) => (
                        <div key={`row-${rowIndex}`} className="grid grid-cols-6 gap-x-1 w-full px-2">
                            {stepValues.map((val, groupIndex) => (
                                <div key={`group-${rowIndex}-${groupIndex}`} className="flex gap-0 justify-center">
                                    <div className="flex flex-col items-center">
                                        <div className="bg-sky-900/40 border border-amber-500/30 rounded-sm shadow-sm overflow-hidden">
                                            <canvas
                                                ref={el => { canvasRefs.current[`${rowIndex}-${val}`] = el; }}
                                                width={LEARNING_DATA_SIZE[0]}
                                                height={LEARNING_DATA_SIZE[1]}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="bg-sky-900/40 border border-sky-500/30 rounded-sm shadow-sm overflow-hidden">
                                            <canvas
                                                ref={el => { canvasRefs.current[`${rowIndex + 4}-${val}`] = el; }}
                                                width={LEARNING_DATA_SIZE[0]}
                                                height={LEARNING_DATA_SIZE[1]}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                < div className="w-full px-4 pt-2 relative" >
                    <div className="h-0.5 w-full bg-slate-500 relative flex items-center">
                        <div className="absolute right-0 -mr-1 w-2 h-2 border-t-2 border-r-2 border-slate-500 transform rotate-45"></div>
                    </div>
                    <div className="grid grid-cols-6 gap-x-2 text-[10px] text-slate-400 mt-1 font-mono px-2">
                        {stepValues.map(val => (
                            <span key={val} className="text-center">{val}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

ImageGridPanel.displayName = 'ImageGridPanel';
export default ImageGridPanel;
