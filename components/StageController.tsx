"use client";
import { useRef, forwardRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Swal from 'sweetalert2';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import UnreadBadge from "@/lib/UnreadBadge";

export type Guide = {
    element: string;
    popover: {
        title: string;
        description: string;
    };
}[];

export type Quiz = {
    title: string,
    problems: {
        question: string,
        choices: string[],
        correctIndex: number | number[],
    }[],
};

export type QuizResponse = {
    isAllCorrect: boolean,
};

export type QuizResponseCallback = (result: QuizResponse) => void;

export type Tutorial = {
    stages: { description: string, quiz: Quiz, guide: Guide }[];
};

interface StageControllerProps {
    tutorial: Tutorial;
    quizPanelRef?: React.RefObject<HTMLDivElement | null>;
    onStartQuiz?: () => void;
}
export interface StageControllerHandle {
}
interface BadgeState {
    guide: boolean;
    quiz: boolean;
}
const StageControllerPanel = forwardRef<StageControllerHandle, StageControllerProps>(({ tutorial, quizPanelRef, onStartQuiz }, ref) => {
    const pathname = usePathname();
    const missionDescriptionRef = useRef<HTMLSpanElement>(null);
    const stagePanelRef = useRef<HTMLSpanElement>(null);
    const stageButtonRef = useRef<HTMLButtonElement[]>([]);

    const defaultBadgeState = tutorial.stages.map((_, i) => [i, { guide: false, quiz: false }] as [number, BadgeState]);

    const badgeStateRef = useRef<Map<number, BadgeState>>(new Map(defaultBadgeState));
    const currentStageIndex = useRef<number>(0);
    // const [isClient, setIsClient] = useState(false); // To prevent hydration mismatch that could happen from localStorage init

    const showPopup = ({ element, title, description, overlayOpacity = 0.5 }: { element: string, title: string, description: string, overlayOpacity: number }): { destroy: () => void } => {
        const driverObj = driver({
            overlayOpacity,
            steps: [{ element, popover: { title, description } },],
        });
        driverObj.drive();
        return { destroy: driverObj.destroy };
    };

    const showAlreadyFinished = () => {
        Swal.fire({
            title: 'チュートリアルは完了しています',
            text: 'チュートリアルを終了します',
            icon: 'success',
            confirmButtonText: 'OK',
        });
    }

    // --- クイズ選択状態の永続化ヘルパー ---
    function getQuizStorageKey(stageIndex: number) {
        return `tutorial_quiz_answers_${pathname}_${stageIndex}`;
    }

    function saveQuizAnswers(stageIndex: number) {
        const problemElems = document.querySelectorAll(".question");
        const answers: Record<string, number[]> = {};
        problemElems.forEach((_, i) => {
            const checked = [...document.querySelectorAll<HTMLInputElement>(`input[name="${i}"]:checked`)];
            answers[i.toString()] = checked.map(e => Number(e.value));
        });
        localStorage.setItem(getQuizStorageKey(stageIndex), JSON.stringify(answers));
    }

    function restoreQuizAnswers(stageIndex: number) {
        const saved = localStorage.getItem(getQuizStorageKey(stageIndex));
        if (!saved) return;
        try {
            const answers = JSON.parse(saved) as Record<string, number[]>;
            Object.entries(answers).forEach(([name, values]) => {
                values.forEach(val => {
                    const input = document.querySelector<HTMLInputElement>(`input[name="${name}"][value="${val}"]`);
                    if (input) input.checked = true;
                });
            });
        } catch (e) {
            console.error("Failed to restore quiz answers", e);
        }
    }

    const clearQuizAnswers = () => {
        tutorial.stages.forEach((_, i) => {
            localStorage.removeItem(getQuizStorageKey(i));
        });
    };

    const startGuide = (stageIndex: number) => {
        const driverObj = driver({
            steps: tutorial.stages[stageIndex].guide,
        });
        driverObj.drive();
    };

    const startQuiz = (stageIndex: number, onResult: QuizResponseCallback) => {
        const response = {
            isAllCorrect: false,
        };
        Swal.fire({
            title: tutorial.stages[stageIndex].quiz.title,
            html: '<div id="quiz-scroll-container" style="text-align: left; max-height: 400px; overflow-y: auto; padding: 10px;">' +
                tutorial.stages[stageIndex].quiz.problems.map(({ question, choices, correctIndex }, i) => {
                    const choiceType = Array.isArray(correctIndex) ? "checkbox" : "radio";
                    return `<div class="question"><p>問題${i + 1}: ${question}</p>` +
                        choices.map((c, ci) => `<label><input type="${choiceType}" name="${i}" value="${ci}" />${c}</label>`).join("") +
                        "</div>";
                }) + "</div>",
            showCancelButton: true,
            confirmButtonText: '回答チェック',
            didOpen: () => {
                restoreQuizAnswers(stageIndex);
            },
            willClose: () => {
                saveQuizAnswers(stageIndex);
            },
            preConfirm: () => {
                const problemElems: HTMLDivElement[] = [...(document.querySelectorAll(".question") as NodeListOf<HTMLDivElement>)];
                problemElems.forEach(e => e.style.backgroundColor = "");
                const results: number[][] = tutorial.stages[stageIndex].quiz.problems.map((_, i) =>
                    [...(problemElems[i].querySelectorAll(`input[name="${i}"]:checked`) as NodeListOf<HTMLInputElement>)].map(e => Number(e.value))
                );

                const isEqual = (a0: any[], a1: any[]) => a0.length === a1.length && a0.every((e, i) => e === a1[i]);

                let isAllCorrect = true;
                results.forEach((result, i) => {
                    const cAnswer = tutorial.stages[stageIndex].quiz.problems[i].correctIndex;
                    if (!isEqual(result, Array.isArray(cAnswer) ? cAnswer : [cAnswer])) {
                        isAllCorrect = false;
                        problemElems[i].style.backgroundColor = "#ff0000";
                    }
                })
                response.isAllCorrect = isAllCorrect;

                if ((isAllCorrect as boolean) === false) {
                    // Swal.showValidationMessage('すべての問題に回答してください');
                    return false;
                }

                Swal.getConfirmButton()!.style.display = 'none';
                Swal.getCancelButton()!.innerText = '閉じる';
                const container = Swal.getHtmlContainer();
                if (container) {
                    container.insertAdjacentHTML('beforeend', '<div style="color:green; font-weight:bold; margin-top:15px;">全問正解です！</div>');
                    container.scrollTop = container.scrollHeight;
                }
                return false;
            }
        }).then(() => {
            onResult(response);
        });
    };

    function getStorageKey(type: 'badge' | 'stage') {
        return `tutorial_${type}_${pathname}`;
    }

    function saveStateToStorage() {
        // if (!isClient) return;
        localStorage.setItem(getStorageKey('badge'), JSON.stringify(Array.from(badgeStateRef.current.entries())));
        localStorage.setItem(getStorageKey('stage'), currentStageIndex.current.toString());
    }

    function syncBadgeState() {
        const stage = currentStageIndex.current;
        const state = badgeStateRef.current.get(stage) ?? { guide: false, quiz: false };
        if (state.guide) UnreadBadge.detach('#start-guide');
        else UnreadBadge.attach('#start-guide', { autoRemove: false });
        if (state.quiz) UnreadBadge.detach('#start-quiz');
        else UnreadBadge.attach('#start-quiz', { autoRemove: false });
    }
    function markAsBadgeState(stageIndex: number, key: keyof BadgeState) {
        const current = badgeStateRef.current.get(stageIndex);
        if (!current) return;
        console.log("set", stageIndex, key)
        badgeStateRef.current.set(stageIndex, { ...current, [key]: true })
        saveStateToStorage();
    }

    function drawStageInfo() {
        if (missionDescriptionRef.current && currentStageIndex.current < tutorial.stages.length) {
            missionDescriptionRef.current.innerText = tutorial.stages[currentStageIndex.current]?.description;
        }
        if (stagePanelRef.current && stageButtonRef.current) {
            if (stageButtonRef.current.length === 0) {
                stageButtonRef.current = tutorial.stages.map((_, i) => {
                    const btn = document.createElement("button");
                    btn.innerText = (i + 1).toString();
                    btn.onclick = () => {
                        currentStageIndex.current = i;
                        saveStateToStorage();
                        drawStageInfo();
                        syncBadgeState();
                    };
                    stagePanelRef.current!.appendChild(btn);
                    return btn;
                });
            }
            stageButtonRef.current.forEach((e, i) => {
                const isActive = i === currentStageIndex.current;
                const isCompleted = i < currentStageIndex.current;
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
        const stageIndex = currentStageIndex.current;
        markAsBadgeState(stageIndex, 'guide');
        syncBadgeState();
        startGuide(stageIndex);
    }
    function handleStartQuiz() {
        if (onStartQuiz) {
            onStartQuiz();
        }
        return;

        const stageIndex = currentStageIndex.current;
        startQuiz(stageIndex, (result: QuizResponse) => {
            if (result.isAllCorrect) {
                currentStageIndex.current = Math.min(stageIndex + 1, tutorial.stages.length - 1);
                markAsBadgeState(stageIndex, 'quiz');
                saveStateToStorage();
                drawStageInfo();
                console.log(badgeStateRef.current)
                syncBadgeState();
            }
        })
    }
    function onReset() {
        Swal.fire({
            title: '進捗をリセットしますか？',
            text: '現在のチュートリアルの進行状況（ガイド閲覧、クイズクリア）が初期化されます。',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#475569', // slate-600
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

    useEffect(() => {
        // setIsClient(true);
        // Load state from localStorage on mount
        const savedBadge = localStorage.getItem(getStorageKey('badge'));
        if (savedBadge) {
            try {
                const parsed = JSON.parse(savedBadge) as [number, BadgeState][];
                // Handle cases where tutorial.stages structure might have changed (lengthened)
                const newMap = new Map(defaultBadgeState);
                parsed.forEach(([k, v]) => {
                    if (newMap.has(k)) newMap.set(k, v);
                });
                badgeStateRef.current = newMap;
            } catch (e) {
                console.error("Failed to parse badge state", e);
            }
        }

        const savedStage = localStorage.getItem(getStorageKey('stage'));
        if (savedStage) {
            const parsedStage = parseInt(savedStage, 10);
            if (!isNaN(parsedStage) && parsedStage >= 0 && parsedStage < tutorial.stages.length) {
                currentStageIndex.current = parsedStage;
            }
        }

        if (quizPanelRef && quizPanelRef.current) {
            // test
            const div = document.createElement("div");
            div.innerText = "test";
            const input = document.createElement("input");
            input.type = "text";
            div.appendChild(input);
            const button = document.createElement("button");
            button.innerText = "押すな！!!!!!!!!!!!!!!!!!!!!";
            button.onclick = () => {
                alert(input.value);
            };
            div.appendChild(button);
            quizPanelRef.current.appendChild(div);
        }

        drawStageInfo();
        syncBadgeState();
    }, [pathname]);

    // if (!isClient) return null;
    return (
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
                    onClick={onReset}
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
});

StageControllerPanel.displayName = 'StageControllerPanel';
export default StageControllerPanel;