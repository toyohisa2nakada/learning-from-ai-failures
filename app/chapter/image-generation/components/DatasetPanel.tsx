"use client";

import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import { ImageSelect, type ImageOption } from "@/components/ImageSelect";
declare const cv: any;

type PokemonData = {
    id: number;
    name: string;
    canvas: HTMLCanvasElement;
}

export interface DatasetPanelProps {
    imageSelected0: ImageOption | undefined;
    imageSelected1: ImageOption | undefined;
    onImageSelectChange: (index: 0 | 1, newValue: Readonly<ImageOption>) => void;
}

export interface DatasetPanelHandle {
    updatePredictions: (images: Readonly<Record<string, number[]>>) => void;
}

const LEARNING_DATA_SIZE: [number, number] = [48, 48];

async function getMat(url: string, learningDataSize: [number, number]): Promise<any | null> {
    return new Promise((resolve, reject) => {
        const imgElem = document.createElement("img");
        imgElem.crossOrigin = "Anonymous";
        imgElem.src = url;
        imgElem.onload = () => {
            const canvas = document.createElement("canvas");
            if (canvas === null) {
                reject();
                return;
            }
            canvas.width = imgElem.width;
            canvas.height = imgElem.height;
            const ctx = canvas.getContext("2d");
            if (ctx === null) {
                reject();
                return;
            }
            ctx.drawImage(imgElem, 0, 0);
            const src = cv.imread(canvas);
            const dst = new cv.Mat();
            cv.resize(src, dst, new cv.Size(...learningDataSize), 0, 0, cv.INTER_AREA);
            src.delete();
            resolve(dst);
        }
    })
}
async function getPokemonData(pokemonNames: string[], learningDataSize: [number, number]): Promise<PokemonData[]> {
    const pokemonData = [];
    for (let pokemonName of pokemonNames) {
        const pokemon = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${pokemonName}`,
        ).then((r) => r.json());

        const spriteMat = await getMat(pokemon.sprites.front_default, learningDataSize);
        if (spriteMat === null) {
            console.error("Failed to get sprite mat for pokemon", pokemonName);
            continue;
        }
        const canvas = document.createElement('canvas');
        canvas.id = pokemonName;
        cv.imshow(canvas, spriteMat);
        spriteMat.delete();

        pokemonData.push({
            id: pokemon.id,
            name: pokemon.name,
            canvas,
        });
    }
    return pokemonData;
}


const DatasetPanel = React.forwardRef<DatasetPanelHandle, DatasetPanelProps>(({ imageSelected0, imageSelected1, onImageSelectChange }, ref) => {
    const [imageOptions, setImageOptions] = useState<ImageOption[]>([]);
    const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

    useImperativeHandle(ref, () => ({
        updatePredictions: (images: Record<string, number[]>) => {
            Object.entries(images).forEach(([key, data]) => {
                const normalizedKey = parseFloat(key).toFixed(1);
                const canvas = canvasRefs.current[normalizedKey];
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const [width, height] = LEARNING_DATA_SIZE;
                const imageData = ctx.createImageData(width, height);
                for (let i = 0; i < data.length / 3; i++) {
                    imageData.data[i * 4 + 0] = Math.round(data[i * 3 + 0] * 255);
                    imageData.data[i * 4 + 1] = Math.round(data[i * 3 + 1] * 255);
                    imageData.data[i * 4 + 2] = Math.round(data[i * 3 + 2] * 255);
                    imageData.data[i * 4 + 3] = 255;

                    // if (data[i * 3 + 0] < -0.1 || data[i * 3 + 1] < -0.1 || data[i * 3 + 2] < -0.1) {
                    //     console.log(normalizedKey);
                    // }
                }
                ctx.putImageData(imageData, 0, 0);
            });
        }
    }));

    useEffect(() => {
        (async () => {
            // ポケモン名は以下の英語名称を使用する。
            // https://wiki.xn--rckteqa2e.com/wiki/%E3%83%9D%E3%82%B1%E3%83%A2%E3%83%B3%E3%81%AE%E5%A4%96%E5%9B%BD%E8%AA%9E%E5%90%8D%E4%B8%80%E8%A6%A7
            const pokemonData = await getPokemonData(['pikachu', 'raichu', 'bulbasaur', 'mewtwo'], LEARNING_DATA_SIZE)
            const options = pokemonData.map((pokemon) => {
                return {
                    value: pokemon.name,
                    label: pokemon.name,
                    icon: pokemon.canvas,
                };
            });
            setImageOptions(options);
            if (options.length >= 2) {
                onImageSelectChange(0, options[0]);
                onImageSelectChange(1, options[1]);
            }
        })();
    }, [])

    const [activeSelector, setActiveSelector] = useState<0 | 1 | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const FILE_OPTION: ImageOption = { value: 'file', label: 'ファイルから読み込む...', icon: null }; // Icon can be empty or a placeholder
    const optionsWithFile = [...imageOptions, FILE_OPTION];

    const handleImageSelectChange = (index: 0 | 1, newValue: any) => {
        if (newValue.value === 'file') {
            setActiveSelector(index);
            fileInputRef.current?.click();
        } else {
            onImageSelectChange(index, newValue);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeSelector !== null) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const dataUrl = reader.result as string;

                // getMat でリサイズ
                const mat = await getMat(dataUrl, LEARNING_DATA_SIZE);
                if (mat === null) {
                    console.error("Failed to load image from file");
                    return;
                }

                // Canvasに描画
                const canvas = document.createElement('canvas');
                cv.imshow(canvas, mat);
                mat.delete();

                const newOption: ImageOption = {
                    value: 'custom',
                    label: file.name,
                    icon: canvas
                };
                onImageSelectChange(activeSelector, newOption);
            };
            reader.readAsDataURL(file);
        }
        // Reset input so same file can be selected again if needed
        if (e.target) e.target.value = '';
    };

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
                    {['0.0', '0.2', '0.4', '0.6', '0.8', '1.0'].map((val, i) => (
                        <div key={i} className="bg-sky-900/40 border border-sky-500/30 rounded shadow-inner overflow-hidden">
                            <canvas
                                ref={el => { canvasRefs.current[val] = el; }}
                                width={LEARNING_DATA_SIZE[0]}
                                height={LEARNING_DATA_SIZE[1]}
                                className="w-full h-full"
                            />
                        </div>
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
});

DatasetPanel.displayName = 'DatasetPanel';
export default DatasetPanel;
