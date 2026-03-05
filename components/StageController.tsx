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
    function getQuizAnswers(stageIndex: number): number[][] | null {
        if (typeof window === 'undefined') return null;
        const item = localStorage.getItem(getStorageKey('quiz_answers', stageIndex));
        return item ? JSON.parse(item) : null;
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

    function handleStartQuiz() {
        if (onStartQuiz) onStartQuiz();
        if (!quizPanelRef || !quizPanelRef.current) return;

        // test
        if (1 === 1) return;

        const container = quizPanelRef.current;
        container.innerHTML = '';

        const stageIndex = currentStageIndex;
        const quiz = tutorial.stages[stageIndex].quiz;

        // チェックボタンを一番上に配置
        const checkBtn = document.createElement("button");
        checkBtn.innerText = "回答チェック";
        checkBtn.onclick = () => {
            const problemElems = [...container.querySelectorAll(".question")] as HTMLDivElement[];
            problemElems.forEach(e => e.style.backgroundColor = "");

            const results: number[][] = quiz.problems.map((_, i) =>
                [...(problemElems[i].querySelectorAll(`input[name="q${i}"]:checked`) as NodeListOf<HTMLInputElement>)].map(e => Number(e.value))
            );

            const isEqual = (a0: any[], a1: any[]) => a0.length === a1.length && a0.every((e, idx) => e === a1[idx]);
            let isAllCorrect = true;

            results.forEach((result, i) => {
                const cAnswer = quiz.problems[i].correctIndex;
                if (!isEqual(result, Array.isArray(cAnswer) ? cAnswer : [cAnswer])) {
                    isAllCorrect = false;
                    problemElems[i].style.backgroundColor = "#ff0000";
                }
            });

            if (isAllCorrect) {
                checkBtn.style.display = 'none';
                const nextStageIndex = Math.min(stageIndex + 1, tutorial.stages.length - 1);
                setCurrentStageIndex(nextStageIndex);
                markAsBadgeState(stageIndex, 'quiz');

                const msg = document.createElement("div");
                msg.style.color = "green";
                msg.style.fontWeight = "bold";
                msg.style.marginTop = "15px";
                msg.innerText = "全問正解です！";
                container.appendChild(msg);
            }
        };
        container.appendChild(checkBtn);

        const scrollContainer = document.createElement("div");
        scrollContainer.id = "quiz-scroll-container";

        const savedAnswers = getQuizAnswers(stageIndex);

        const handleChange = () => {
            const problemElems = [...scrollContainer.querySelectorAll(".question")] as HTMLDivElement[];
            const currentAnswers: number[][] = quiz.problems.map((_, i) =>
                [...(problemElems[i].querySelectorAll(`input[name="q${i}"]:checked`) as NodeListOf<HTMLInputElement>)].map(e => Number(e.value))
            );
            saveQuizAnswers(stageIndex, currentAnswers);
        };

        quiz.problems.forEach(({ question, choices, correctIndex }, i) => {
            const questionDiv = document.createElement("div");
            questionDiv.className = "question";

            const qText = document.createElement("p");
            qText.innerText = `問題${i + 1}: ${question}`;
            questionDiv.appendChild(qText);

            const choiceType = Array.isArray(correctIndex) ? "checkbox" : "radio";
            const savedAns = savedAnswers ? savedAnswers[i] : [];

            choices.forEach((c, ci) => {
                const label = document.createElement("label");
                const input = document.createElement("input");
                input.type = choiceType;
                input.name = `q${i}`;
                input.value = ci.toString();
                if (savedAns && savedAns.includes(ci)) {
                    input.checked = true;
                }
                input.addEventListener('change', handleChange);

                label.appendChild(input);
                label.appendChild(document.createTextNode(c));
                questionDiv.appendChild(label);
            });

            scrollContainer.appendChild(questionDiv);
        });

        container.appendChild(scrollContainer);
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

    function handleCheckQuiz() {

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
                <button id="start-quiz" onClick={handleStartQuiz}
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
        <div className="">
            <button onClick={handleCheckQuiz} className="px-3 py-1 text-xs font-semibold bg-slate-800 border border-slate-600 rounded hover:bg-slate-700">回答チェック</button>
            {tutorial.stages[currentStageIndex].quiz.problems.map((_, i) => {
                const savedAns = savedAnswers ? savedAnswers[i] : [];
                return (
                    <div key={i}>
                        <p className="my-2 text-sky-300">{tutorial.stages[currentStageIndex].quiz.problems[i].question}</p>
                        {tutorial.stages[currentStageIndex].quiz.problems[i].choices.map((c, ci) => (
                            <label key={ci}>
                                <input type="radio" name={`q${i}`} value={ci} checked={savedAns.includes(ci)} onChange={handleCheckQuiz} />
                                {c}
                            </label>
                        ))}
                    </div>
                );
            })}
        </div>,
        quizPanelRef?.current!) : null;

    return (<>{mainContent}{portalContent}</>);
});

StageControllerPanel.displayName = 'StageControllerPanel';
export default StageControllerPanel;