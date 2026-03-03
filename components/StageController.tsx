"use client";
import { useRef, forwardRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Swal from 'sweetalert2';
import { createTutorial, type Tutorial, type QuizResponse } from "@/lib/Tutorial";
import UnreadBadge from "@/lib/UnreadBadge";

interface StageControllerProps {
    tutorial: Tutorial;
}
export interface StageControllerHandle {
}
interface BadgeState {
    guide: boolean;
    quiz: boolean;
}
const StageControllerPanel = forwardRef<StageControllerHandle, StageControllerProps>(({ tutorial }, ref) => {
    const pathname = usePathname();
    const missionDescriptionRef = useRef<HTMLSpanElement>(null);
    const stagePanelRef = useRef<HTMLSpanElement>(null);
    const stageButtonRef = useRef<HTMLButtonElement[]>([]);

    const defaultBadgeState = tutorial.stages.map((_, i) => [i, { guide: false, quiz: false }] as [number, BadgeState]);

    const badgeStateRef = useRef<Map<number, BadgeState>>(new Map(defaultBadgeState));
    const currentStageIndex = useRef<number>(0);
    // const [isClient, setIsClient] = useState(false); // To prevent hydration mismatch that could happen from localStorage init

    const { startGuide, startQuiz, clearQuizAnswers } = createTutorial({ tutorial, storageKeyPrefix: pathname });

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
    function onStartGuide() {
        const stageIndex = currentStageIndex.current;
        markAsBadgeState(stageIndex, 'guide');
        syncBadgeState();
        startGuide(stageIndex);
    }
    function onStartQuiz() {
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

        drawStageInfo();
        syncBadgeState();
    }, [pathname]);

    // if (!isClient) return null;
    return (
        <section className="action-section flex justify-between items-center">
            <div className="flex gap-1 items-start">
                指令<span ref={missionDescriptionRef}></span>
                <button id="start-guide" onClick={onStartGuide}
                    className="px-3 py-1 text-xs font-semibold bg-slate-800 border border-slate-600 rounded hover:bg-slate-700"
                >説明を見る</button>
                <button id="start-quiz" onClick={onStartQuiz}
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