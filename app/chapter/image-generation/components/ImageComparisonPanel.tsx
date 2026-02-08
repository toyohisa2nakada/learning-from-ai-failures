"use client";

import React, { useState, useRef } from 'react';

const PRESET_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

export default function ImageComparisonPanel() {
    const [image1, setImage1] = useState(PRESET_OPTIONS[0]);
    const [image2, setImage2] = useState(PRESET_OPTIONS[1]);
    const [customImage1, setCustomImage1] = useState<string | null>(null);
    const [customImage2, setCustomImage2] = useState<string | null>(null);

    const fileInput1Ref = useRef<HTMLInputElement>(null);
    const fileInput2Ref = useRef<HTMLInputElement>(null);

    const handleImage1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setImage1(value);
        if (value === 'file' && fileInput1Ref.current) {
            fileInput1Ref.current.click();
        }
    };

    const handleImage2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setImage2(value);
        if (value === 'file' && fileInput2Ref.current) {
            fileInput2Ref.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setCustomImage: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const renderImageContent = (selection: string, customImage: string | null) => {
        if (selection === 'file' && customImage) {
            return <img src={customImage} alt="Uploaded" className="w-full h-full object-contain" />;
        }
        return <span className="text-2xl font-bold text-gray-800">{selection}</span>;
    };

    return (
        <div className="flex flex-col h-full w-full gap-2">
            <div className="text-base font-semibold m-0">データセットと予測結果</div>

            {/* Header / Controls */}
            <div className="flex justify-between px-1 py-2">
                <div className="flex flex-col gap-1 w-[40%]">
                    <label className="text-xs text-slate-400">画像1</label>
                    <select
                        value={image1}
                        onChange={handleImage1Change}
                        className="bg-slate-800 border border-slate-700 rounded px-1 py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        {PRESET_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        <option value="file">ファイルから読み込む...</option>
                    </select>
                    <input
                        type="file"
                        ref={fileInput1Ref}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setCustomImage1)}
                    />
                </div>

                <div className="flex flex-col gap-1 w-[40%]">
                    <label className="text-xs text-slate-400">画像2</label>
                    <select
                        value={image2}
                        onChange={handleImage2Change}
                        className="bg-slate-800 border border-slate-700 rounded px-1 py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        {PRESET_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        <option value="file">ファイルから読み込む...</option>
                    </select>
                    <input
                        type="file"
                        ref={fileInput2Ref}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setCustomImage2)}
                    />
                </div>
            </div>

            {/* Visualization Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
                {/* Top Row: Target Images - Updated to yellow as requested */}
                <div className="flex justify-between w-full mb-4 px-1">
                    {/* Image 1 Box */}
                    <div className="w-9 h-9 bg-yellow-300 border-2 border-slate-900 rounded flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                        {renderImageContent(image1, customImage1)}
                    </div>
                    {/* Image 2 Box */}
                    <div className="w-9 h-9 bg-yellow-300 border-2 border-slate-900 rounded flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                        {renderImageContent(image2, customImage2)}
                    </div>
                </div>

                {/* Middle Row: Interpolation Steps */}
                <div className="flex justify-between w-full mb-6 px-1 items-end h-16">
                    {/* 6 Intermediate Boxes */}
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="w-8 h-8 bg-sky-900/40 border border-sky-500/30 rounded shadow-inner" />
                    ))}
                </div>

                {/* Bottom Row: Axis */}
                <div className="w-full px-1 relative">
                    {/* Axis Line */}
                    <div className="h-0.5 w-full bg-slate-500 relative flex items-center">
                        <div className="absolute right-0 -mr-1 w-2 h-2 border-t-2 border-r-2 border-slate-500 transform rotate-45"></div>
                    </div>
                    {/* Ticks and Labels */}
                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                        <span>0.0</span>
                        <span>0.2</span>
                        <span>0.4</span>
                        <span>0.6</span>
                        <span>0.8</span>
                        <span>1.0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
