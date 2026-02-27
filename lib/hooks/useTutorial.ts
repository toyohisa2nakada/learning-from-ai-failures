import { useRef } from 'react';
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
export type Tutorial = {
    stages: { quiz: Quiz, guide: Guide }[];
}

export const useTutorial = ({ tutorial }: { tutorial: Tutorial }) => {
    const stageRef = useRef(0);

    const showPopup = ({ element, title, description, overlayOpacity = 0.5 }: { element: string, title: string, description: string, overlayOpacity: number }): { destroy: () => void } => {
        const driverObj = driver({
            overlayOpacity,
            steps: [{ element, popover: { title, description } },],
        });
        driverObj.drive();
        return { destroy: driverObj.destroy };
    };

    const startGuide = () => {
        const driverObj = driver({
            steps: tutorial.stages[stageRef.current].guide,
            // overlayOpacity: 0.5,
        });
        driverObj.drive();
    };

    const startQuiz = () => {
        Swal.fire({
            title: tutorial.stages[stageRef.current].quiz.title,
            html: '<div id="quiz-scroll-container" style="text-align: left; max-height: 400px; overflow-y: auto; padding: 10px;">' +
                tutorial.stages[stageRef.current].quiz.problems.map(({ question, choices, correctIndex }, i) => {
                    const choiceType = Array.isArray(correctIndex) ? "checkbox" : "radio";
                    return `<div class="question"><p>問題${i + 1}: ${question}</p>` +
                        choices.map((c, ci) => `<label><input type="${choiceType}" name="${i}" value="${ci}" />${c}</label>`).join("") +
                        "</div>";
                }) + "</div>",
            // html: `
            //     <div id="quiz-scroll-container" style="text-align: left; max-height: 400px; overflow-y: auto; padding: 10px;">
            //     <p>問1: 最初の設定は正解ですか？</p>
            //     <label><input type="radio" name="q1" value="ok"> はい</label>
            //     <label><input type="radio" name="q1" value="ng"> いいえ</label>
            //     <hr>
            //     <p>問2: Reactのフックはどれ？</p>
            //     <label><input type="radio" name="q2" value="useState"> useState</label>
            //     <label><input type="radio" name="q2" value="div"> div</label>
            //     <hr>
            //     <p>問3: Next.jsはフレームワークである</p>
            //     <label><input type="radio" name="q3" value="yes"> はい</label>
            //     <label><input type="radio" name="q3" value="no"> いいえ</label>
            //     <hr>
            //     <p>問4: Gitでファイルを戻すコマンドは？</p>
            //     <label><input type="radio" name="q4" value="checkout"> checkout</label>
            //     <label><input type="radio" name="q4" value="push"> push</label>
            //     <hr>
            //     <p>問5: 不要なパッケージを消すコマンドは？</p>
            //     <label><input type="radio" name="q5" value="prune"> prune</label>
            //     <label><input type="radio" name="q5" value="install"> install</label>
            //     </div>
            // `,
            showCancelButton: true,
            confirmButtonText: '回答チェック',
            preConfirm: () => {
                const problemElems: HTMLDivElement[] = [...(document.querySelectorAll(".question") as NodeListOf<HTMLDivElement>)];
                problemElems.forEach(e => e.style.backgroundColor = "");
                const results: number[][] = tutorial.stages[stageRef.current].quiz.problems.map((_, i) =>
                    [...(problemElems[i].querySelectorAll(`input[name="${i}"]:checked`) as NodeListOf<HTMLInputElement>)].map(e => Number(e.value))
                );

                const isEqual = (a0: any[], a1: any[]) => a0.length === a1.length && a0.every((e, i) => e === a1[i]);

                let isAllCorrect = true;
                results.forEach((result, i) => {
                    const cAnswer = tutorial.stages[stageRef.current].quiz.problems[i].correctIndex;
                    if (!isEqual(result, Array.isArray(cAnswer) ? cAnswer : [cAnswer])) {
                        isAllCorrect = false;
                        problemElems[i].style.backgroundColor = "#ff0000";
                    }
                })

                if ((isAllCorrect as boolean) === false) {
                    // Swal.showValidationMessage('すべての問題に回答してください');
                    return false;
                }

                Swal.getConfirmButton()!.style.display = 'none';
                Swal.getCancelButton()!.innerText = '閉じる';
                const container = Swal.getHtmlContainer();
                if (container) {
                    container.innerHTML += '<div style="color:green; font-weight:bold; margin-top:15px;">全問正解です！次の説明と課題が作成されています。</div>';
                    container.scrollTop = container.scrollHeight;
                }
                stageRef.current += 1;
                return false;
            }
        });
    };
    return { showPopup, startGuide, startQuiz };
};