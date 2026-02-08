"use client";

import React from 'react';

export default function ImageGridPanel() {
    const rows = 4;
    const groups = 6;

    return (
        <div className="flex flex-col h-full w-full gap-2">
            <div className="text-base font-semibold m-0">計算プロセス</div>

            {/* Grid Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 relative">
                <div className="flex flex-col w-full h-full justify-between items-center">
                    {/* 4 Rows */}
                    {Array(rows).fill(0).map((_, rowIndex) => (
                        <div key={`row-${rowIndex}`} className="flex justify-between w-full px-4">
                            {/* 6 Groups */}
                            {Array(groups).fill(0).map((_, groupIndex) => (
                                <div key={`group-${rowIndex}-${groupIndex}`} className="flex gap-1">
                                    {/* 2 Columns per group */}
                                    <div className="w-4 h-4 bg-sky-900/60 border border-sky-500/30 rounded shadow-sm hover:bg-sky-800/80 transition-colors" />
                                    <div className="w-4 h-4 bg-sky-900/60 border border-sky-500/30 rounded shadow-sm hover:bg-sky-800/80 transition-colors" />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Axis Row */}
                <div className="w-full px-4 pt-2 relative">
                    {/* Axis Line */}
                    <div className="h-0.5 w-full bg-slate-500 relative flex items-center">
                        <div className="absolute right-0 -mr-1 w-2 h-2 border-t-2 border-r-2 border-slate-500 transform rotate-45"></div>
                    </div>
                    {/* Ticks and Labels */}
                    <div className="flex justify-between text-xs text-slate-400 mt-1 font-mono">
                        <span className="w-8 text-center">0.0</span>
                        <span className="w-8 text-center">0.2</span>
                        <span className="w-8 text-center">0.4</span>
                        <span className="w-8 text-center">0.6</span>
                        <span className="w-8 text-center">0.8</span>
                        <span className="w-8 text-center">1.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
