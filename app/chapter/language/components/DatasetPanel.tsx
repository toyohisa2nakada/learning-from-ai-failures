"use client";

import React, { useEffect, useImperativeHandle } from 'react';

declare namespace tf {
    type Tensor2D = any;
    type Tensor1D = any;
    function tensor2d(data: number[][]): Tensor2D;
    function tensor1d(data: number[]): Tensor1D;
}

export interface Dataset {
    train_x: tf.Tensor2D;
    train_y: tf.Tensor1D;
    maxLen: number;
    vocab: string[];
    encode: (word: string) => string[];
    decode: (code: number) => string;
    toTensor: (data: number[][]) => tf.Tensor2D;
    test_patterns: string[];
    correct_answers: string[];
    sentences: string[];
    tokenize: (text: string) => string[];
}

export interface DatasetPanelProps {
    onDatasetChange: (dataset: Dataset) => void;
}
export interface DatasetPanelHandle {
    updatePredictions: () => void;
}


const DatasetPanel = React.forwardRef<DatasetPanelHandle, DatasetPanelProps>(({ onDatasetChange }, ref) => {

    useImperativeHandle(ref, () => ({
        updatePredictions: () => {
        }
    }));

    useEffect(() => {
        // dummy
        const dataset: Dataset = {
            train_x: tf.tensor2d([[1, 2], [3, 4]]),
            train_y: tf.tensor1d([1, 2, 3]),
            maxLen: 0,
            vocab: [],
            encode: (word: string) => [],
            decode: (code: number) => "",
            toTensor: (data: number[][]) => tf.tensor2d([]),
            test_patterns: [],
            correct_answers: [],
            sentences: [],
            tokenize: (text: string) => []
        };
        onDatasetChange(dataset);
    }, []);

    return (
        <div>
            <p>Dataset Panel</p>
        </div>
    );
});

DatasetPanel.displayName = 'DatasetPanel';
export default DatasetPanel;
