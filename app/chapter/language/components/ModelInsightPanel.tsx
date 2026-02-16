"use client";

import { useImperativeHandle, useRef, forwardRef } from 'react';

export interface ModelInsightPanelHandle {
    updateModelInsight: () => void;
}

const ModelInsightPanel = forwardRef<ModelInsightPanelHandle>(({ }, ref) => {

    useImperativeHandle(ref, () => ({
        updateModelInsight: () => {
            console.log('updateModelInsight');
        }
    }));

    return (
        <div>
            <p>ModelInsightPanel Panel</p>
        </div>
    );
});

ModelInsightPanel.displayName = 'ModelInsightPanel';
export default ModelInsightPanel;
