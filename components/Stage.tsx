"use client";
import { useImperativeHandle, useRef, forwardRef, useEffect, useState } from 'react';
import { useTutorial, type Tutorial, type QuizResponse } from "@/lib/hooks/useTutorial";
import UnreadBadge from "@/lib/UnreadBadge";

interface StageProps {
    tutorial: Tutorial;
}

export interface StageHandle {
}
const StagePanel = forwardRef<StageHandle, StageProps>(({ tutorial }, ref) => {
    const missionDescriptionRef = useRef<HTMLSpanElement>(null);
    const stageInfoRef = useRef<HTMLSpanElement>(null);
    const currentStageIndex = useRef<number>(0);
    const { startGuide, startQuiz } = useTutorial({ tutorial });
    function drawStageInfo() {
        if (missionDescriptionRef.current && currentStageIndex.current < tutorial.stages.length) {
            missionDescriptionRef.current.innerText = tutorial.stages[currentStageIndex.current]?.description;
        }
        if (stageInfoRef.current) {
            stageInfoRef.current.innerHTML = `[${tutorial.stages.map((_, i) => `<span class=${i < currentStageIndex.current ? "text-gray-500" : (i === currentStageIndex.current ? "text-green-500" : "")}>${i + 1}</span>`).join(' ')}]`;
        }
    }
    function onStartQuiz() {
        startQuiz((result: QuizResponse) => {
            if (result.isAllCorrect) {
                currentStageIndex.current = result.nextStageIndex;
                drawStageInfo();
                if (currentStageIndex.current < tutorial.stages.length) {
                    UnreadBadge.attach('#start-guide');
                    UnreadBadge.attach('#start-quiz');
                } else {
                    UnreadBadge.detach('#start-guide');
                    UnreadBadge.detach('#start-quiz');
                }
            }
        })
    }
    useEffect(() => {
        drawStageInfo();
        UnreadBadge.attach('#start-guide');
        UnreadBadge.attach('#start-quiz');
    }, [])
    return (
        <section className="action-section flex justify-between items-center">
            <div className="flex gap-1 items-start">
                指令<span ref={missionDescriptionRef}></span>
                <button id="start-guide" onClick={startGuide}>説明を見る</button>
                <button id="start-quiz" onClick={onStartQuiz}>課題に挑戦</button>
            </div>
            <div>
                Stage: <span ref={stageInfoRef}></span>
            </div>
        </section>
    );
});

StagePanel.displayName = 'StagePanel';
export default StagePanel;