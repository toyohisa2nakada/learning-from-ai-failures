"use client";

export default function NeuralNetGraph() {
    return (
        <>
            <div className="text-xs text-white">
                入力xに値がセットされ、バイアスには常に1が設定されます。各ニューロンは、その値を使って指定された計算式で値を求め、それらをすべて足し合わせたものが出力yとなります。
            </div>
            <svg width="90%" style={{ height: "auto", margin: "1rem 1rem" }} viewBox="-5 -5 511 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="85" r="25" fill="none" stroke="white" />
                <circle cx="25" cy="180" r="20" fill="none" stroke="white" />

                <path d="M306 20C306 25.5228 301.523 30 296 30C290.477 30 286 25.5228 286 20C286 14.4772 290.477 10 296 10C301.523 10 306 14.4772 306 20Z" fill="#DD0000" />
                <path d="M296 37.32C296 42.8428 291.523 47.32 286 47.32C280.477 47.32 276 42.8428 276 37.32C276 31.7972 280.477 27.32 286 27.32C291.523 27.32 296 31.7972 296 37.32Z" fill="#00DD00" />
                <path d="M316 37.32C316 42.8428 311.523 47.32 306 47.32C300.477 47.32 296 42.8428 296 37.32C296 31.7972 300.477 27.32 306 27.32C311.523 27.32 316 31.7972 316 37.32Z" fill="#0000DD" />
                <path d="M351 20C351 25.5228 346.523 30 341 30C335.477 30 331 25.5228 331 20C331 14.4772 335.477 10 341 10C346.523 10 351 14.4772 351 20Z" fill="#DD0000" />
                <path d="M341 37.32C341 42.8428 336.523 47.32 331 47.32C325.477 47.32 321 42.8428 321 37.32C321 31.7972 325.477 27.32 331 27.32C336.523 27.32 341 31.7972 341 37.32Z" fill="#00DD00" />
                <path d="M361 37.32C361 42.8428 356.523 47.32 351 47.32C345.477 47.32 341 42.8428 341 37.32C341 31.7972 345.477 27.32 351 27.32C356.523 27.32 361 31.7972 361 37.32Z" fill="#0000DD" />
                <path d="M306 193C306 198.523 301.523 203 296 203C290.477 203 286 198.523 286 193C286 187.477 290.477 183 296 183C301.523 183 306 187.477 306 193Z" fill="#DD0000" />
                <path d="M296 210.32C296 215.843 291.523 220.32 286 220.32C280.477 220.32 276 215.843 276 210.32C276 204.797 280.477 200.32 286 200.32C291.523 200.32 296 204.797 296 210.32Z" fill="#00DD00" />
                <path d="M316 210.32C316 215.843 311.523 220.32 306 220.32C300.477 220.32 296 215.843 296 210.32C296 204.797 300.477 200.32 306 200.32C311.523 200.32 316 204.797 316 210.32Z" fill="#0000DD" />
                <path d="M491 23C491 28.5228 486.523 33 481 33C475.477 33 471 28.5228 471 23C471 17.4772 475.477 13 481 13C486.523 13 491 17.4772 491 23Z" fill="#DD0000" />
                <path d="M481 40.32C481 45.8428 476.523 50.32 471 50.32C465.477 50.32 461 45.8428 461 40.32C461 34.7972 465.477 30.32 471 30.32C476.523 30.32 481 34.7972 481 40.32Z" fill="#00DD00" />
                <path d="M501 40.32C501 45.8428 496.523 50.32 491 50.32C485.477 50.32 481 45.8428 481 40.32C481 34.7972 485.477 30.32 491 30.32C496.523 30.32 501 34.7972 501 40.32Z" fill="#0000DD" />
                <path d="M491 193C491 198.523 486.523 203 481 203C475.477 203 471 198.523 471 193C471 187.477 475.477 183 481 183C486.523 183 491 187.477 491 193Z" fill="#DD0000" />
                <path d="M481 210.32C481 215.843 476.523 220.32 471 220.32C465.477 220.32 461 215.843 461 210.32C461 204.797 465.477 200.32 471 200.32C476.523 200.32 481 204.797 481 210.32Z" fill="#00DD00" />
                <path d="M501 210.32C501 215.843 496.523 220.32 491 220.32C485.477 220.32 481 215.843 481 210.32C481 204.797 485.477 200.32 491 200.32C496.523 200.32 501 204.797 501 210.32Z" fill="#0000DD" />
                <path d="M306 60C306 65.5228 301.523 70 296 70C290.477 70 286 65.5228 286 60C286 54.4772 290.477 50 296 50C301.523 50 306 54.4772 306 60Z" fill="#DD0000" />
                <path d="M296 77.32C296 82.8428 291.523 87.32 286 87.32C280.477 87.32 276 82.8428 276 77.32C276 71.7972 280.477 67.32 286 67.32C291.523 67.32 296 71.7972 296 77.32Z" fill="#00DD00" />
                <path d="M316 77.32C316 82.8428 311.523 87.32 306 87.32C300.477 87.32 296 82.8428 296 77.32C296 71.7972 300.477 67.32 306 67.32C311.523 67.32 316 71.7972 316 77.32Z" fill="#0000DD" />

                <line x1="296.5" y1="90" x2="296.5" y2="170" stroke="white" strokeDasharray="2 2" />
                <line x1="481.5" y1="60" x2="481.5" y2="170" stroke="white" strokeDasharray="2 2" />
                <line x1="456" y1="30.5" x2="376" y2="30.5" stroke="white" strokeDasharray="2 2" />
                <line x1="456" y1="202.5" x2="326" y2="202.5" stroke="white" strokeDasharray="2 2" />

                <path d="M160 22L270 29" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M160 22L276 200" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M160 22L270 69" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M160 85L270 29" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M160 85L276 200" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M160 85L270 69" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M160 145L270 29" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M160 145L276 200" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M160 145L270 69" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M160 205L270 29" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M160 205L273 202" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M160 205L270 69" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />

                <path d="M200 22L270 30" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M200 22L270 69" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M200 25L276 200" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />

                <path d="M200 85L270 30" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M200 85L270 69" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M200 85L276 200" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />

                <path d="M200 145L270 30" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M200 145L270 69" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M200 145L276 200" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />

                <path d="M200 205L270 30" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M200 205L270 69" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M200 205L276 200" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />

                <path d="M50 85L109 31" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M50 85L110 85" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M50 85L180 196" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M50 85L180 145" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M50 85L184 75" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M50 85L177 25" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M50 85L110 200" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M50 85L110 142" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />

                <path d="M45 180L110 200" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M45 180L180 32" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M45 180L180 90" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M45 180L180 145" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M45 180L180 205" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M45 180L110 32" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M45 180L110 85" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                <path d="M45 180L110 142" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />

                <circle cx="135" cy="85" r="25" fill="#0A2C47" stroke="#ADD8E6" />
                <circle cx="135" cy="25" r="25" fill="#0A2C47" stroke="#ADD8E6" />
                <circle cx="135" cy="205" r="25" fill="#0A2C47" stroke="#ADD8E6" />
                <circle cx="135" cy="145" r="25" fill="#0A2C47" stroke="#ADD8E6" />
                <circle cx="175" cy="85" r="25" fill="#0A2C47" stroke="#ADD8E6" />
                <circle cx="175" cy="25" r="25" fill="#0A2C47" stroke="#ADD8E6" />
                <circle cx="175" cy="205" r="25" fill="#0A2C47" stroke="#ADD8E6" />
                <circle cx="175" cy="145" r="25" fill="#0A2C47" stroke="#ADD8E6" />

                <text x="408" y="22" fill="white" fontSize="12" fontWeight="normal">48</text>
                <text x="283" y="139" fill="white" fontSize="12" fontWeight="normal">48</text>

                <text x="15" y="85" fill="white" fontSize="12" fontWeight="normal">入力</text>
                <text x="15" y="180" fill="white" fontSize="12" fontWeight="normal">バイアス</text>

                <text x="108" y="20" fill="white" fontSize="12" fontWeight="normal">ニューロン1</text>
                <text x="108" y="80" fill="white" fontSize="12" fontWeight="normal">ニューロン2</text>
                <text x="108" y="140" fill="white" fontSize="12" fontWeight="normal">ニューロン3</text>
                <text x="108" y="200" fill="white" fontSize="12" fontWeight="normal">ニューロン4</text>
                <text x="148" y="35" fill="white" fontSize="12" fontWeight="normal">ニューロン5</text>
                <text x="148" y="95" fill="white" fontSize="12" fontWeight="normal">ニューロン6</text>
                <text x="148" y="155" fill="white" fontSize="12" fontWeight="normal">ニューロン7</text>
                <text x="148" y="215" fill="white" fontSize="12" fontWeight="normal">ニューロン8</text>

                <text x="320" y="120" fill="white" fontSize="12" fontWeight="normal">48(W) * 48(H) * 3(RGB)</text>
            </svg>

            <div>
                <div className="text-xs">
                    AIは、この出力yが教師データと一致するように、自動的に重みwとバイアスの重みbを調整して決定します。なお、このツールの目的は、ユーザーがこれらの重みを直感的に試して手動で求めることです。
                </div>
            </div>
        </>
    );
}
