import { useRef } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import Swal from 'sweetalert2';

export type Guide = {
    element: string;
    popover: {
        title: string;
        description: string;
    };
};

export const useGuide = ({ guides }: { guides: Guide[][] }) => {
    const stepRef = useRef(0);

    const showPopup = ({ element, title, description, overlayOpacity = 0.5 }: { element: string, title: string, description: string, overlayOpacity: number }): { destroy } => {
        const driverObj = driver({
            overlayOpacity,
            steps: [{ element, popover: { title, description } },],
            onDestroyed: () => {
                console.log("destroyed")
            }
        });
        driverObj.drive();
        return { destroy: driverObj.destroy };
    };

    const startGuide = () => {
        console.log("startGuide")
        const driverObj = driver({
            steps: guides[stepRef.current],
            overlayOpacity: 0.5,
        });
        driverObj.drive();
    };

    const startQuiz = () => {
        Swal.fire({
            title: 'クイズ',
            html: `
                <div id="quiz-scroll-container" style="text-align: left; max-height: 400px; overflow-y: auto; padding: 10px;">
                <p>問1: 最初の設定は正解ですか？</p>
                <label><input type="radio" name="q1" value="ok"> はい</label>
                <label><input type="radio" name="q1" value="ng"> いいえ</label>
                <hr>
                <p>問2: Reactのフックはどれ？</p>
                <label><input type="radio" name="q2" value="useState"> useState</label>
                <label><input type="radio" name="q2" value="div"> div</label>
                <hr>
                <p>問3: Next.jsはフレームワークである</p>
                <label><input type="radio" name="q3" value="yes"> はい</label>
                <label><input type="radio" name="q3" value="no"> いいえ</label>
                <hr>
                <p>問4: Gitでファイルを戻すコマンドは？</p>
                <label><input type="radio" name="q4" value="checkout"> checkout</label>
                <label><input type="radio" name="q4" value="push"> push</label>
                <hr>
                <p>問5: 不要なパッケージを消すコマンドは？</p>
                <label><input type="radio" name="q5" value="prune"> prune</label>
                <label><input type="radio" name="q5" value="install"> install</label>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '回答チェック',
            preConfirm: () => {
                const results: (string | undefined)[] = [
                    (document.querySelector('input[name="q1"]:checked') as HTMLInputElement)?.value,
                    (document.querySelector('input[name="q2"]:checked') as HTMLInputElement)?.value,
                    (document.querySelector('input[name="q3"]:checked') as HTMLInputElement)?.value,
                    (document.querySelector('input[name="q4"]:checked') as HTMLInputElement)?.value,
                    (document.querySelector('input[name="q5"]:checked') as HTMLInputElement)?.value,
                ];

                if (results.includes(undefined)) {
                    Swal.showValidationMessage('すべての問題に回答してください');
                    return false;
                }

                const isAllCorrect = results[0] === 'ok' && results[1] === 'useState' &&
                    results[2] === 'yes' && results[3] === 'checkout' &&
                    results[4] === 'prune';

                if (isAllCorrect) {
                    Swal.getConfirmButton()!.style.display = 'none';
                    Swal.getCancelButton()!.innerText = '閉じる';
                    const container = Swal.getHtmlContainer();
                    if (container) {
                        container.innerHTML += '<div style="color:green; font-weight:bold; margin-top:15px;">全問正解です！お疲れ様でした。</div>';
                        container.scrollTop = container.scrollHeight;
                    }
                    stepRef.current += 1;
                    return false;
                } else {
                    Swal.showValidationMessage('不正解が含まれています。見直してください。');
                    return false;
                }
            }
        });
    };
    return { showPopup, startGuide, startQuiz };
};