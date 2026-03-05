"use client";
/*
用語整理
chapter: 学習項目で2025.03.05時点ではfundamentals, image-generation, llmがある。
stage: 1つのchapter内での学習単位であり、例えば、fundamentalsには(1)手動で重みを調整、(2)プログラムで重みを調整などがある。
quiz: stageごとに用意されるクイズである。quizに正解できなくても次のstageやchapterに移動できる。
guide: stageごとに用意される画面説明である。guideを見ながら画面を操作し、quizに回答することを想定している。
tutorial: chapter全体のユーザへの指令文、stageごとのquiz, guideをまとめたもの。
*/
import { useRef, forwardRef, useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import Swal from 'sweetalert2';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import UnreadBadge from "@/lib/UnreadBadge";

// 画面説明のための情報
export type Guide = {
    element: string;
    popover: {
        title: string;
        description: string;
    };
}[];

// クイズのための情報
export type Quiz = {
    title: string,
    problems: {
        question: string,
        choices: string[],
        correctIndex: number | number[],
    }[],
};

// クイズの回答結果
export type QuizResponse = {
    isAllCorrect: boolean,
};

// クイズの回答結果を渡すためのコールバック関数
export type QuizResponseCallback = (result: QuizResponse) => void;

// チュートリアルの構成、このデータを受け取ってStage管理を行う
export type Tutorial = {
    stages: { description: string, quiz: Quiz, guide: Guide }[];
};

// StageControllerのProps
interface StageControllerProps {
    tutorial: Tutorial;
    quizPanelRef?: React.RefObject<HTMLDivElement | null>;
    onStartQuiz?: () => void;
}
// 親コンポーネントからStageControllerを操作するためのハンドル
export interface StageControllerHandle {
    // 未使用
}
// 未読バッチの表示状態
interface BadgeState {
    guide: boolean;
    quiz: boolean;
}

// StageControllerPanelカスタムタグ
const StageControllerPanel = forwardRef<StageControllerHandle, StageControllerProps>(({ tutorial, quizPanelRef, onStartQuiz }, ref) => {
    console.log("StageControllerPanel");
    const pathname = usePathname();
    const missionDescriptionRef = useRef<HTMLSpanElement>(null);
    const stagePanelRef = useRef<HTMLSpanElement>(null);
    const stageButtonRef = useRef<HTMLButtonElement[]>([]);
    const quizProblemRefs = useRef<(HTMLDivElement | null)[]>([]);

    const defaultBadgeState = tutorial.stages.map((_, i) => [i, { guide: false, quiz: false }] as [number, BadgeState]);

    const [badgeState, setBadgeState] = useState<Map<number, BadgeState>>(new Map(defaultBadgeState));
    const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
    const savedAnswers = useMemo(() => {
        return getQuizAnswers(currentStageIndex);
    }, [currentStageIndex]);

    function getStorageKey(type: 'badge' | 'stage' | 'quiz_answers', stageIndex?: number) {
        return `tutorial_${type}_${pathname}${stageIndex !== undefined ? `_${stageIndex}` : ''}`;
    }

    function saveStateToStorage(newBadgeState: Map<number, BadgeState>, newStageIndex: number) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(getStorageKey('badge'), JSON.stringify(Array.from(newBadgeState.entries())));
        localStorage.setItem(getStorageKey('stage'), newStageIndex.toString());
    }
    function saveQuizAnswers(stageIndex: number, answers: number[][]) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(getStorageKey('quiz_answers', stageIndex), JSON.stringify(answers));
    }
    function getQuizAnswers(stageIndex: number): number[][] {
        if (typeof window === 'undefined') return [];
        const item = localStorage.getItem(getStorageKey('quiz_answers', stageIndex));
        return item ? JSON.parse(item) : [];
    }
    function clearQuizAnswers() {
        if (typeof window === 'undefined') return;
        tutorial.stages.forEach((_, i) => {
            localStorage.removeItem(getStorageKey('quiz_answers', i));
        });
    }

    function syncBadgeState(stageIndex: number, currentBadgeState: Map<number, BadgeState>) {
        const state = currentBadgeState.get(stageIndex) ?? { guide: false, quiz: false };
        if (state.guide) UnreadBadge.detach('#start-guide');
        else UnreadBadge.attach('#start-guide', { autoRemove: false });
        if (state.quiz) UnreadBadge.detach('#start-quiz');
        else UnreadBadge.attach('#start-quiz', { autoRemove: false });
    }

    function markAsBadgeState(stageIndex: number, key: keyof BadgeState) {
        setBadgeState(prev => {
            const current = prev.get(stageIndex) || { guide: false, quiz: false };
            const newMap = new Map(prev);
            newMap.set(stageIndex, { ...current, [key]: true });
            saveStateToStorage(newMap, currentStageIndex);
            syncBadgeState(stageIndex, newMap);
            return newMap;
        });
    }

    function drawStagePanel(stageIndex: number) {
        if (missionDescriptionRef.current && stageIndex < tutorial.stages.length) {
            missionDescriptionRef.current.innerText = tutorial.stages[stageIndex].description;
        }
        if (stagePanelRef.current && stageButtonRef.current) {
            if (stageButtonRef.current.length === 0) {
                stageButtonRef.current = tutorial.stages.map((_, i) => {
                    const btn = document.createElement("button");
                    btn.innerText = (i + 1).toString();
                    btn.onclick = () => {
                        setCurrentStageIndex(i);
                    };
                    stagePanelRef.current!.appendChild(btn);
                    return btn;
                });
            }
            stageButtonRef.current.forEach((e, i) => {
                const isActive = i === stageIndex;
                const isCompleted = i < stageIndex;
                const baseClass = "px-3 py-0.5 mx-0.5 rounded border transition-colors cursor-pointer text-xs font-bold";
                const stateClass = isActive
                    ? "bg-blue-600 border-blue-400 text-white shadow-sm"
                    : isCompleted
                        ? "bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700"
                        : "bg-transparent border-slate-800 text-gray-600 hover:border-slate-700";
                e.className = `${baseClass} ${stateClass}`;
            })
        }
    }

    function handleStartGuide() {
        markAsBadgeState(currentStageIndex, 'guide');
        const driverObj = driver({
            steps: tutorial.stages[currentStageIndex].guide,
        });
        driverObj.drive();
    }

    function handleReset() {
        Swal.fire({
            title: '進捗をリセットしますか？',
            text: '現在のチュートリアルの進行状況（ガイド閲覧、クイズクリア）が初期化されます。',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#475569',
            confirmButtonText: 'リセットする',
            cancelButtonText: 'キャンセル'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem(getStorageKey('badge'));
                localStorage.removeItem(getStorageKey('stage'));
                clearQuizAnswers();
                window.location.reload();
            }
        });
    }

    function handleQuizAnswerChange(e: React.ChangeEvent<HTMLInputElement>) {
        const problemIndex = parseInt(e.target.name, 10);
        const checkedNodes = document.querySelectorAll<HTMLInputElement>(`input[name="${problemIndex}"]:checked`);
        const selectedValues = Array.from(checkedNodes).map(node => Number(node.value));
        savedAnswers[problemIndex] = selectedValues;
        saveQuizAnswers(currentStageIndex, savedAnswers);
    }

    function handleCheckQuiz() {
        const eq = (a: number[], b: number[]): boolean => a.length === b.length && a.every((e, i) => e === b[i]);
        const correctedAnswers = tutorial.stages[currentStageIndex].quiz.problems.map(({ correctIndex }) => Array.isArray(correctIndex) ? correctIndex : [correctIndex]);
        const allCorrected = correctedAnswers.map((correctedAnswer, i) => {
            const ret = eq(savedAnswers[i] ?? [], correctedAnswer);
            if (!ret) {
                quizProblemRefs.current[i]?.classList.add('bg-red-900');
            } else {
                quizProblemRefs.current[i]?.classList.remove('bg-red-900');
            }
            return ret;
        });
        if (allCorrected.every(e => e)) {
            markAsBadgeState(currentStageIndex, 'quiz');
        }
    }

    useEffect(() => {
        let savedBadgeMap = new Map(defaultBadgeState);
        const savedBadge = localStorage.getItem(getStorageKey('badge'));
        if (savedBadge) {
            try {
                const parsed = JSON.parse(savedBadge) as [number, BadgeState][];
                parsed.forEach(([k, v]) => {
                    if (savedBadgeMap.has(k)) savedBadgeMap.set(k, v);
                });
                setBadgeState(savedBadgeMap);
            } catch (e) {
                console.error("Failed to parse badge state", e);
            }
        }

        let initialStage = 0;
        const savedStage = localStorage.getItem(getStorageKey('stage'));
        if (savedStage) {
            const parsedStage = parseInt(savedStage, 10);
            if (!isNaN(parsedStage) && parsedStage >= 0 && parsedStage < tutorial.stages.length) {
                initialStage = parsedStage;
                setCurrentStageIndex(initialStage);
            }
        }

        drawStagePanel(initialStage);
        syncBadgeState(initialStage, savedBadgeMap);

    }, [pathname]);

    useEffect(() => {
        saveStateToStorage(badgeState, currentStageIndex);
        drawStagePanel(currentStageIndex);
        syncBadgeState(currentStageIndex, badgeState);
    }, [currentStageIndex]);

    const mainContent = (
        <section className="action-section flex justify-between items-center">
            <div className="flex gap-1 items-start">
                指令<span ref={missionDescriptionRef}></span>
                <button id="start-guide" onClick={handleStartGuide}
                    className="px-3 py-1 text-xs font-semibold bg-slate-800 border border-slate-600 rounded hover:bg-slate-700"
                >説明を見る</button>
                <button id="start-quiz" onClick={() => onStartQuiz?.()}
                    className="px-3 py-1 text-xs font-semibold bg-slate-800 border border-slate-600 rounded hover:bg-slate-700"
                >課題に挑戦</button>
            </div>
            <div className="flex items-center">
                <span className="text-sm font-medium">Stage:</span>
                <span ref={stagePanelRef} className="inline-flex items-center p-1 rounded-md border border-slate-800 ml-2"></span>
                <button
                    onClick={handleReset}
                    className="ml-3 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                    title="進捗をリセット"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                    </svg>
                </button>
            </div>
        </section>
    );
    const portalContent = quizPanelRef?.current ? createPortal(
        <div className="flex flex-col relative">
            <div className="sticky top-0 z-10 px-1">
                <button onClick={handleCheckQuiz} className="w-full px-3 py-2 text-sm font-semibold bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 transition">
                    回答チェック
                </button>
            </div>
            <div className="flex flex-col gap-2 p-1 mt-1">
                {tutorial.stages[currentStageIndex].quiz.problems.map((problem, i) => {
                    const savedAns = savedAnswers[i] ?? [];
                    console.log(savedAns);
                    const correctIndex = problem.correctIndex;
                    const choiceType = Array.isArray(correctIndex) ? "checkbox" : "radio";
                    return (
                        <div key={`${currentStageIndex}_${i}`} className="flex flex-col bg-slate-800 p-2 rounded border border-slate-700">
                            <p className="my-2 font-medium text-sky-300 text-sm leading-relaxed">{tutorial.stages[currentStageIndex].quiz.problems[i].question}</p>
                            <div ref={(e) => { quizProblemRefs.current[i] = e }} className="flex flex-col gap-1.5 mt-1 mb-1">
                                {tutorial.stages[currentStageIndex].quiz.problems[i].choices.map((c, ci) => (
                                    <label key={ci} className="flex items-start gap-2 cursor-pointer">
                                        <input type={choiceType} className="mt-1" name={i.toString()} value={ci.toString()} defaultChecked={savedAns.includes(ci)} onChange={handleQuizAnswerChange} />
                                        <span className="text-sm text-slate-200">{c}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>,
        quizPanelRef?.current!) : null;

    return (<>{mainContent}{portalContent}</>);
});

StageControllerPanel.displayName = 'StageControllerPanel';
export default StageControllerPanel;