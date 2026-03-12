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

// クイズ1つの回答状態
interface QuizStatus {
    selectedAnswer: number[];
    status: 'unanswered' | 'submitted' | 'incorrect' | 'correct';
    incorrectCount: number;
    inputType: 'radio' | 'checkbox';
}

// StageControllerPanelカスタムタグ
const StageControllerPanel = forwardRef<StageControllerHandle, StageControllerProps>(({ tutorial, quizPanelRef, onStartQuiz }, ref) => {
    console.log("StageControllerPanel");
    const pathname = usePathname();
    const missionDescriptionRef = useRef<HTMLSpanElement>(null);
    const stagePanelRef = useRef<HTMLSpanElement>(null);
    const stageButtonRef = useRef<HTMLButtonElement[]>([]);
    const quizProblemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const quizProblemFieldRef = useRef<HTMLFieldSetElement>(null);
    const quizCheckButtonRef = useRef<HTMLButtonElement>(null);

    function getCurrentStageIndex(): number {
        if (typeof window === 'undefined') return -1;
        return Number(localStorage.getItem(getStorageKey('stage')) ?? 0);
    }
    function getBadgeStatuses(): BadgeState[] {
        if (typeof window === 'undefined') return [];
        const value = localStorage.getItem(getStorageKey('badge'));
        if (value === null) {
            return tutorial.stages.map(() => ({ guide: false, quiz: false }))
        }
        return JSON.parse(value);
    }

    const [currentStageIndex, setCurrentStageIndex] = useState<number>(getCurrentStageIndex());
    const [badgeState, setBadgeState] = useState<BadgeState[]>(getBadgeStatuses());
    const savedQuizStatuses = useMemo(() => {
        return getQuizStatuses(currentStageIndex);
    }, [currentStageIndex]);

    function getStorageKey(type: 'badge' | 'stage' | 'quiz_statuses', stageIndex?: number) {
        return `tutorial_${type}_${pathname}${stageIndex !== undefined ? `_${stageIndex}` : ''}`;
    }

    function saveStateToStorage(newBadgeState: BadgeState[], newStageIndex: number) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(getStorageKey('badge'), JSON.stringify(newBadgeState));
        localStorage.setItem(getStorageKey('stage'), newStageIndex.toString());
    }
    function saveQuizStatuses(stageIndex: number, statuses: QuizStatus[]) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(getStorageKey('quiz_statuses', stageIndex), JSON.stringify(statuses));
    }
    function getQuizStatuses(stageIndex: number): QuizStatus[] {
        if (typeof window === 'undefined') return [];
        const item = localStorage.getItem(getStorageKey('quiz_statuses', stageIndex));
        return item ? JSON.parse(item) : tutorial.stages[stageIndex].quiz.problems.map((problem) => ({
            selectedAnswer: [],
            status: 'unanswered',
            incorrectCount: 0,
            inputType: Array.isArray(problem.correctIndex) ? 'checkbox' : 'radio'
        }));
    }
    function clearQuizStatuses() {
        if (typeof window === 'undefined') return;
        tutorial.stages.forEach((_, i) => {
            localStorage.removeItem(getStorageKey('quiz_statuses', i));
        });
    }

    function syncBadgeState(stageIndex: number, currentBadgeState: BadgeState[]) {
        const state = currentBadgeState[stageIndex];
        if (state.guide) UnreadBadge.detach('#start-guide');
        else UnreadBadge.attach('#start-guide', { autoRemove: false });
        if (state.quiz) UnreadBadge.detach('#start-quiz');
        else UnreadBadge.attach('#start-quiz', { autoRemove: false });
    }

    function markAsBadgeState(stageIndex: number, key: keyof BadgeState) {
        setBadgeState(prev => {
            prev[stageIndex][key] = true;
            saveStateToStorage(prev, currentStageIndex);
            syncBadgeState(stageIndex, prev);
            return prev;
        })
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
                clearQuizStatuses();
                window.location.reload();
            }
        });
    }

    function handleQuizAnswerChange(e: React.ChangeEvent<HTMLInputElement>) {
        const problemIndex = parseInt(e.target.name, 10);
        const checkedNodes = document.querySelectorAll<HTMLInputElement>(`input[name="${problemIndex}"]:checked`);
        const selectedValues = Array.from(checkedNodes).map((node) => Number(node.value));
        savedQuizStatuses[problemIndex].selectedAnswer = selectedValues;
        savedQuizStatuses[problemIndex].status = 'submitted';
        saveQuizStatuses(currentStageIndex, savedQuizStatuses);
    }

    function handleCheckQuiz() {
        // if (quizCheckButtonRef.current!.textContent === '次の課題へ') {
        //     if (currentStageIndex === tutorial.stages.length - 1) {
        //         Swal.fire({
        //             title: 'チュートリアル完了',
        //             text: 'すべての課題をクリアしました。',
        //             icon: 'success',
        //             confirmButtonColor: '#3b82f6',
        //             confirmButtonText: 'OK'
        //         });
        //         return;
        //     }
        //     setCurrentStageIndex(currentStageIndex + 1);
        //     return;
        // }
        const eq = (a: number[], b: number[]): boolean => a.length === b.length && a.every((e, i) => e === b[i]);
        const correctedAnswers = tutorial.stages[currentStageIndex].quiz.problems.map(({ correctIndex }) => Array.isArray(correctIndex) ? correctIndex : [correctIndex]);
        const allCorrected = correctedAnswers.map((correctedAnswer, i) => {
            const ret = eq(savedQuizStatuses[i].selectedAnswer ?? [], correctedAnswer);
            if (ret) {
                savedQuizStatuses[i].status = 'correct';
                quizProblemRefs.current[i]?.classList.remove('bg-red-900');
            } else {
                savedQuizStatuses[i].status = 'incorrect';
                savedQuizStatuses[i].incorrectCount += 1;
                quizProblemRefs.current[i]?.classList.add('bg-red-900');
            }
            return ret;
        });
        saveQuizStatuses(currentStageIndex, savedQuizStatuses);
        if (allCorrected.every(e => e)) {
            markAsBadgeState(currentStageIndex, 'quiz');
            quizProblemFieldRef.current!.setAttribute('disabled', 'true');
            quizCheckButtonRef.current!.textContent = '次の課題へ';

            const driverObj = driver({
                steps: [
                    { "element": quizCheckButtonRef.current!, "popover": { "title": "次のクイズ", "description": "ここを押すと次のクイズが表示されます" } },
                    { "element": "#start-guide", "popover": { "title": "説明の更新", "description": "また説明も更新されています。" } },
                ],
            });
            driverObj.drive();
        }
    }

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
                >クイズに挑戦</button>
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
                <button
                    ref={quizCheckButtonRef}
                    onClick={handleCheckQuiz}
                    className="w-full px-3 py-2 text-sm font-semibold bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 transition">
                    {savedQuizStatuses.every((s) => s.status === 'correct') ? '次の課題へ' : '回答チェック'}
                </button>
            </div>
            <fieldset ref={quizProblemFieldRef} disabled={savedQuizStatuses.every((s) => s.status === 'correct')} className="flex flex-col gap-2 p-1 mt-1">
                {tutorial.stages[currentStageIndex].quiz.problems.map((problem, i) => {
                    const savedAns = savedQuizStatuses[i].selectedAnswer;
                    const correctIndex = problem.correctIndex;
                    const choiceType = Array.isArray(correctIndex) ? "checkbox" : "radio";
                    return (
                        <div key={`${currentStageIndex}_${i}`} className="flex flex-col bg-slate-800 p-2 rounded border border-slate-700">
                            <p className="my-2 font-medium text-sky-300 text-sm leading-relaxed">{tutorial.stages[currentStageIndex].quiz.problems[i].question}</p>
                            <div ref={(e) => { quizProblemRefs.current[i] = e }}
                                className={`${savedQuizStatuses[i].status === 'incorrect' ? 'bg-red-900' : ''} flex flex-col gap-1.5 mt-1 mb-1`}>
                                {tutorial.stages[currentStageIndex].quiz.problems[i].choices.map((c, ci) => (
                                    <label key={ci} className="flex items-start gap-2 cursor-pointer">
                                        <input name={i.toString()} value={ci.toString()}
                                            className={"mt-1"}
                                            type={choiceType}
                                            defaultChecked={savedAns.includes(ci)}
                                            onChange={handleQuizAnswerChange} />
                                        <span className="text-sm text-slate-200">{c}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </fieldset>
        </div>,
        quizPanelRef?.current!) : null;

    return (<>{mainContent}{portalContent}</>);
});

StageControllerPanel.displayName = 'StageControllerPanel';
export default StageControllerPanel;