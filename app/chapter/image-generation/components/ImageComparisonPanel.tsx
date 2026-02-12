"use client";

import React, { useState, useRef } from 'react';
import ImageSelect from "@/components/ImageSelect";

const PRESET_OPTIONS = ['A', 'B', 'C', 'D', 'E'];

export default function ImageComparisonPanel() {

    const imageOptions = [
        { value: 'pikachu', label: 'ピカチュウ', icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
        { value: 'raichu', label: 'ライチュウ', icon: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/26.png' },
    ];
    const [imageSelected0, setImageSelected0] = useState(imageOptions[0]);
    const [imageSelected1, setImageSelected1] = useState(imageOptions[1]);
    const [activeSelector, setActiveSelector] = useState<0 | 1 | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const FILE_OPTION = { value: 'file', label: 'ファイルから読み込む...', icon: '' }; // Icon can be empty or a placeholder
    const optionsWithFile = [...imageOptions, FILE_OPTION];

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

    const handleImageSelectChange = (index: 0 | 1, newValue: any) => {
        if (newValue.value === 'file') {
            setActiveSelector(index);
            fileInputRef.current?.click();
        } else {
            if (index === 0) setImageSelected0(newValue);
            else setImageSelected1(newValue);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeSelector !== null) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newOption = {
                    value: 'custom',
                    label: file.name,
                    icon: reader.result as string
                };
                if (activeSelector === 0) setImageSelected0(newOption);
                else setImageSelected1(newOption);
            };
            reader.readAsDataURL(file);
        }
        // Reset input so same file can be selected again if needed
        if (e.target) e.target.value = '';
    };

    // ... existing code ...

    return (
        <div className="flex flex-col h-full w-full gap-2">
            {/* Hidden File Input for ImageSelect */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
            />
            {/* ... existing headers ... */}
            <div className="text-base font-semibold m-0">データセットと予測結果</div>

            {/* Visualization Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
                {/* Top Row: Target Images - Updated to yellow as requested */}
                <div className="flex justify-between w-full mb-4 px-1">
                    <ImageSelect
                        options={optionsWithFile}
                        value={imageSelected0}
                        onChange={(newValue) => handleImageSelectChange(0, newValue)}
                    />
                    <ImageSelect
                        options={optionsWithFile}
                        value={imageSelected1}
                        onChange={(newValue) => handleImageSelectChange(1, newValue)}
                    />
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
