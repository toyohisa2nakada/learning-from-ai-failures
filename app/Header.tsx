"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { CHAPTERS } from "@/constants/chapters";

export default function Header() {
    const [isSectionListOpen, setIsSectionListOpen] = useState(false);
    const pathname = usePathname();
    const currentId = pathname.split("/").pop();
    const basePath = pathname.substring(0, pathname.lastIndexOf("/"));
    const currentIndex = CHAPTERS.indexOf(currentId ?? "");

    const isFirst = currentIndex === 0;
    const isLast = currentIndex === CHAPTERS.length - 1;

    const handleSelect = (chapter: string) => {
        console.log(`${chapter} が選択されました`);
        setIsSectionListOpen(false);
    };

    return (
        <header className="bg-panel border border-line rounded-xl px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3 relative">
                <button
                    onClick={() => setIsSectionListOpen(!isSectionListOpen)}
                    className="text-xs px-3 py-1 rounded-full border border-line text-slate-300 hover:bg-slate-800 transition-colors"
                >
                    NN Basic Lesson
                </button>

                {isSectionListOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsSectionListOpen(false)}
                        />
                        <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-line rounded-lg shadow-xl z-10 py-1">
                            {CHAPTERS.map((chapter) => (
                                <button
                                    key={chapter}
                                    onClick={() => handleSelect(chapter)}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                                >
                                    {chapter}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* <span className="text-xs px-3 py-1 rounded-full border border-line text-slate-300">
                    NN Basic Lesson
                </span> */}
                <div className="text-sm text-slate-400">
                    トップ / Chapter 1 / <span className="text-slate-100 font-semibold">1-1 手で重みを動かす</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded-full border border-line text-slate-400">
                    進捗 3/8
                </span>
                <div className="w-40 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-accent"></div>
                </div>
                {/* <Link href="/chapter/fundamentals" className="px-3 py-1 text-sm rounded-lg border border-line">前へ</Link>
                <Link href="/chapter/image-generation" className="px-3 py-1 text-sm rounded-lg border border-accent bg-accent/20">次へ</Link> */}

                <Link href={isFirst ? "#" : `${basePath}/${CHAPTERS[currentIndex - 1]}`}
                    onClick={(e) => isFirst && e.preventDefault()} // JSでクリックを完全防止
                    title={isFirst ? "前のセクションはありません" : ""}
                    className={`px-3 py-1 text-sm rounded-lg border border-line 
                        ${isFirst
                            ? "opacity-30 cursor-not-allowed"
                            : "hover:bg-slate-800"
                        }`}
                >前へ</Link>
                <Link href={isLast ? "#" : `${basePath}/${CHAPTERS[currentIndex + 1]}`}
                    onClick={(e) => isLast && e.preventDefault()} // JSでクリックを完全防止
                    title={isLast ? "次のセクションはありません" : ""}
                    className={`px-3 py-1 text-sm rounded-lg border border-line 
                        ${isLast
                            ? "opacity-30 cursor-not-allowed"
                            : "hover:bg-slate-800"
                        }`}
                >前へ</Link>
            </div>
        </header>
    );
}
