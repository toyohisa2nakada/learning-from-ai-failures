import { forwardRef, useEffect, useRef, useState } from 'react';

interface EditorToggleButtonsProps {
    programmingMode: 'manual' | 'programming';
    onChangeMode?: (mode: 'manual' | 'programming') => void;
    onReset: () => void;
}

interface EditorToggleButtonsHandle {
}

const EditorToggleButtons = forwardRef<EditorToggleButtonsHandle, EditorToggleButtonsProps>(({ programmingMode, onChangeMode, onReset }, ref) => {

    const [detailMenuOpen, setDetailMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const btnStates = ["bg-gray-700 text-gray-100 p-1", "bg-transparent text-gray-500 p-1",];
    const [btnStatusManual, btnStatusProgramming] = programmingMode === 'manual' ? [btnStates[0], btnStates[1]] : [btnStates[1], btnStates[0]];

    // ニューラルネットワークの構造をプログラムモードに変える。⋮ のボタン、かつ、すでにプログラムモードの場合は、詳細メニューを表示する。
    function onChangeNeuralNetworkStructure(id: 'manual' | 'programming' | 'programming_detail') {
        if (id === 'programming_detail' && programmingMode === 'programming') {
            setDetailMenuOpen(true);
        } else {
            onChangeMode?.(id.split('_')[0] as 'manual' | 'programming');
        }
    }

    function handleProgramReset() {
        onReset();
        setDetailMenuOpen(false);
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (detailMenuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setDetailMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [detailMenuOpen]);



    return (
        <div id="programming-mode-toggle" className="text-xs flex">
            <button className={btnStatusManual} onClick={() => onChangeNeuralNetworkStructure('manual')}>構造</button>
            <div className={`${btnStatusProgramming} relative flex`}>
                <button onClick={() => onChangeNeuralNetworkStructure('programming')}>プログラム</button>
                <button onClick={() => onChangeNeuralNetworkStructure('programming_detail')} className="px-1">⋮</button>

                {detailMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 shadow-md z-50" ref={menuRef}>
                        <button
                            onClick={handleProgramReset}
                            className="block w-full px-4 py-2 hover:bg-gray-100 whitespace-nowrap text-black"
                        >
                            リセット
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

EditorToggleButtons.displayName = 'EditorToggleButtons';
export default EditorToggleButtons;
