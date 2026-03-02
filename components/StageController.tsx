"use client";
import { useRef, forwardRef, useEffect } from 'react';
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
    const missionDescriptionRef = useRef<HTMLSpanElement>(null);
    const stagePanelRef = useRef<HTMLSpanElement>(null);
    const stageButtonRef = useRef<HTMLButtonElement[]>([]);
    const badgeStateRef = useRef<Map<number, BadgeState>>(
        new Map(tutorial.stages.map((_, i) => [i, { guide: false, quiz: false }]))
    );
    const currentStageIndex = useRef<number>(0);
    const { startGuide, startQuiz } = createTutorial({ tutorial });

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
                drawStageInfo();
                markAsBadgeState(stageIndex, 'quiz');
                console.log(badgeStateRef.current)
                syncBadgeState();
            }
        })
    }
    useEffect(() => {
        drawStageInfo();
        syncBadgeState();
    }, [])
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
            <div>
                Stage: <span ref={stagePanelRef} className="inline-flex items-center p-1 rounded-md border border-slate-800 ml-2"></span>
            </div>
        </section>
    );
});

StageControllerPanel.displayName = 'StageControllerPanel';
export default StageControllerPanel;