// ニューロン数、バイアス有無、学習率、学習回数
const config = {
    units: 2,
    useBias: true,
    LearningRate: 0.05,
    epochs: 500,
};

import { trainingData } from "trainingData.js";
import { updateProgress } from "updateProgress.js";
import { postLearningStatus } from "postLearningStatus.js";
async function getDataset(data) {
    if (data === undefined) {
        return {};
    }
    const series = {
        x: data.map((e) => e[0]),
        y: data.map((e) => e[1]),
    };
    return {
        values: data.map((e) => ({ x: e[0], y: e[1] })),
        ranges: {
            x: [Math.min(...series.x) - 0.5, Math.max(...series.x) + 0.5],
            y: [Math.min(...series.y) - 2.5, Math.max(...series.y) + 2.5],
        },
        tensors: {
            x: tf.tensor2d(series.x, [data.length, 1]),
            y: tf.tensor2d(series.y, [data.length, 1]),
        },
    };
}
function postWeights() {
    const weights = {
        w1: model.layers[0].getWeights()[0].dataSync(),
        b: model.layers[0].getWeights()[1]?.dataSync(),
        w2: model.layers[1].getWeights()[0].dataSync(),
    };
    const weightValues = {
        wIn0: weights.w1[0],
        wIn1: weights.w1[1] || 0,
        wOut0: weights.w2[0],
        wOut1: weights.w2[1] || 0,
        b0: weights.b?.[0] || 0,
        b1: weights.b?.[1] || 0,
    }
    window.parent.postMessage({ type: 'weights', values: weightValues });
}
postLearningStatus("started");
const { values, ranges, tensors } = await getDataset(trainingData);
const model = tf.sequential();
model.add(tf.layers.dense({
    inputShape: [1], activation: "tanh",
    units: config.units, useBias: config.useBias,
}),);
model.add(tf.layers.dense({ units: 1, useBias: false }));
model.compile({
    optimizer: tf.train.adam(config.LearningRate),
    loss: tf.losses.meanSquaredError,
    metrics: ["mse"],
});
const history = await model.fit(tensors.x, tensors.y, {
    batchSize: tensors.x.shape[0], shuffle: true,
    epochs: config.epochs,
    callbacks: {
        onEpochEnd: (epoch, logs) => {
            postWeights();
            updateProgress(100 * (epoch + 1) / config.epochs);
        }
    },
});
postLearningStatus("ended");
