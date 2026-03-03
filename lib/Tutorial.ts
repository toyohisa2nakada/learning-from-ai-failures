import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import Swal from 'sweetalert2';

type Guide = {
    element: string;
    popover: {
        title: string;
        description: string;
    };
}[];
type Quiz = {
    title: string,
    problems: {
        question: string,
        choices: string[],
        correctIndex: number | number[],
    }[],
}
export type QuizResponse = {
    isAllCorrect: boolean,
}
export type QuizResponseCallback = (result: QuizResponse) => void;
export type Tutorial = {
    stages: { description: string, quiz: Quiz, guide: Guide }[];
}

export const createTutorial = ({ tutorial, storageKeyPrefix = '' }: { tutorial: Tutorial, storageKeyPrefix?: string }) => {
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
        return `tutorial_quiz_answers_${storageKeyPrefix}_${stageIndex}`;
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
        }
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
    return { showPopup, startGuide, startQuiz, clearQuizAnswers };
};