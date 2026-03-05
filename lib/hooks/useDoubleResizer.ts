import { useState, useRef, useEffect, useCallback } from 'react';

export function useDoubleResizer({
    initialLeft = 33,
    initialRight = 33,
    minLeft = 10,
    minRight = 10,
    minCenter = 10
}: {
    initialLeft?: number;
    initialRight?: number;
    minLeft?: number;
    minRight?: number;
    minCenter?: number;
}) {
    const [leftWidth, setLeftWidth] = useState<number>(initialLeft);
    const [rightWidth, setRightWidth] = useState<number>(initialRight);
    const isResizingLeft = useRef(false);
    const isResizingRight = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleLeftMouseDown = useCallback(() => {
        isResizingLeft.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleRightMouseDown = useCallback(() => {
        isResizingRight.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        if (isResizingLeft.current) {
            const newLeft = ((e.clientX - rect.left) / rect.width) * 100;
            const maxLeft = 100 - rightWidth - minCenter;
            setLeftWidth(Math.min(maxLeft, Math.max(minLeft, newLeft)));
        } else if (isResizingRight.current) {
            const newRight = ((rect.right - e.clientX) / rect.width) * 100;
            const maxRight = 100 - leftWidth - minCenter;
            setRightWidth(Math.min(maxRight, Math.max(minRight, newRight)));
        }
    }, [leftWidth, rightWidth, minLeft, minRight, minCenter]);

    const handleMouseUp = useCallback(() => {
        if (isResizingLeft.current || isResizingRight.current) {
            isResizingLeft.current = false;
            isResizingRight.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return {
        leftWidth,
        rightWidth,
        containerRef,
        handleLeftMouseDown,
        handleRightMouseDown
    };
}
