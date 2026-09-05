"use client";
import { useTranslation } from "@/components/TranslationProvider";

export default function NeuralNetGraph() {
    const translated = useTranslation();

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="text-xs shrink-0 mb-2">
                入力xに値がセットされ、バイアスには常に1が設定されます。各ニューロンは、その値を使って指定された計算式で値を求め、それらをすべて足し合わせたものが出力yとなります。
            </div>
            <div className="flex-1 min-h-0">
                <svg id="circleSvg" viewBox="0 0 300 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5"
                            markerHeight="5" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#888888" />
                        </marker>
                    </defs>

                    <line x1="50" y1="30" x2="130.3" y2="26.94" stroke="#888888" strokeWidth="0.8"
                        markerEnd="url(#arrowhead)" />

                    <line x1="50" y1="30" x2="130.3" y2="70.06" stroke="#888888" strokeWidth="0.8"
                        markerEnd="url(#arrowhead)" />

                    <line x1="50" y1="70" x2="130.3" y2="29.94" stroke="#888888" strokeWidth="0.8"
                        markerEnd="url(#arrowhead)" />

                    <line x1="50" y1="70" x2="130.3" y2="74.06" stroke="#888888" strokeWidth="0.8"
                        markerEnd="url(#arrowhead)" />

                    <line x1="150" y1="30" x2="235.3" y2="47.06" stroke="#888888" strokeWidth="0.8"
                        markerEnd="url(#arrowhead)" />

                    <line x1="150" y1="70" x2="235.3" y2="52.94" stroke="#888888" strokeWidth="0.8"
                        markerEnd="url(#arrowhead)" />

                    <text x="110" y="25" textAnchor="middle" fontSize="6" fill="#cbd5e1">w1 </text>
                    <text x="110" y="38" textAnchor="middle" fontSize="6" fill="#cbd5e1">b </text>
                    <text x="110" y="57" textAnchor="middle" fontSize="6" fill="#cbd5e1">w1 </text>
                    <text x="110" y="72" textAnchor="middle" fontSize="6" fill="#cbd5e1">b </text>
                    <text x="210" y="35" textAnchor="middle" fontSize="6" fill="#cbd5e1">w2 </text>
                    <text x="210" y="65" textAnchor="middle" fontSize="6" fill="#cbd5e1">w2 </text>


                    <circle cx="50" cy="30" r="15" fill="#0f172a" stroke="#888888" strokeWidth="1.5" />
                    <circle cx="50" cy="70" r="10" fill="#0f172a" stroke="#888888" strokeWidth="1.5" />

                    <circle cx="150" cy="25" r="20" fill="#291221" stroke="#f472b6" strokeWidth="1.5" />

                    <circle cx="150" cy="75" r="20" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />

                    <circle cx="250" cy="50" r="15" fill="#065f46" stroke="#22c55e" strokeWidth="1.5" />

                    <text x="50" y="32" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#e2e8f0">{translated ? "Input x" : "入力 x"}</text>
                    <text x="50" y="72" textAnchor="middle" fontSize="8" fontWeight="bold"
                        fill="#e2e8f0">{translated ? "Bias" : "バイアス"}</text>

                    <text x="150" y="27" textAnchor="middle" fontSize="8" fontWeight="bold"
                        fill="#e2e8f0">{translated ? "Neuron 1" : "ニューロン 1"}</text>
                    <text x="150" y="77" textAnchor="middle" fontSize="8" fontWeight="bold"
                        fill="#e2e8f0">{translated ? "Neuron 2" : "ニューロン 2"}</text>

                    <text x="250" y="52" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#e2e8f0">{translated ? "Output y" : "出力 y"}</text>
                </svg>
            </div>
            <div className="shrink-0 mt-2">
                <div className="text-xs">
                    AIは、この出力yが教師データと一致するように、自動的に重みwとバイアスの重みbを調整して決定します。なお、このツールの目的は、ユーザーがこれらの重みを直感的に試して手動で求めることです。
                </div>
            </div>
        </div>
    );
}
