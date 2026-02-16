const config = {
    units: 4,
    useBias: true,
    learningRate: 0.05,
    epochs: 200,
};
function getTensor(dataArray) {
    const n = dataArray.length;
    const imgArray = [];
    dataArray.forEach(item => {
        const rgbData = [];
        // item.data is [R, G, B, A, R, G, B, A, ...]
        for (let i = 0; i < item.data.length; i += 4) {
            rgbData.push(item.data[i + 0] / 255);
            rgbData.push(item.data[i + 1] / 255);
            rgbData.push(item.data[i + 2] / 255);
        }
        imgArray.push(rgbData);
    });
    return {
        x: tf.tensor2d([...Array(n).keys()], [n, 1]),
        y: tf.tensor2d(imgArray, [n, dataArray[0].width * dataArray[0].height * 3]),
    };
}
function buildModel({ outputShape }) {
    const model = tf.sequential();
    const intermediateLayer = tf.layers.dense({
        inputShape: [1],
        units: config.units,
        useBias: config.useBias,
        activation: "tanh",
        name: 'intermediate',
    });
    model.add(intermediateLayer);
    model.add(
        tf.layers.dense({
            units: outputShape,
            useBias: false,
        }),
    );
    model.compile({
        optimizer: tf.train.adam(config.learningRate),
        loss: tf.losses.meanSquaredError,
        metrics: ["mse"],
    });

    const intermediateModel = tf.model({
        inputs: model.input,
        outputs: intermediateLayer.output,
    });

    return [model, intermediateModel];
}

import { trainingData } from "trainingData.js";
import { updateProgress } from "updateProgress.js";
const tensors = getTensor(trainingData);
const [model, intermediateModel] = buildModel({ outputShape: tensors.y.shape[1] });
model.summary();
intermediateModel.summary();

function postWeights() {
    const range = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const input = tf.tensor2d(range, [range.length, 1]); // [6,1]

    {
        const images = model.predict(input).arraySync();
        const values = range.reduce((a, e, i) => ({ ...a, [e]: images[i] }), {})
        window.parent.postMessage({ type: 'images', values });
    }

    {
        const intermediateOutput = intermediateModel.predict(input); // [6,8]
        const expanded = intermediateOutput.expandDims(2); // [6, 8, 1]

        const outputLayer = model.layers[1];
        const weights = outputLayer.getWeights()[0]; // [8,6912]
        const weightsExpanded = weights.expandDims(0); // [1, 8, 6912]

        const images = expanded.mul(weightsExpanded).arraySync(); // [6, 8, 6912]
        const values = range.reduce((a, e, i) => ({ ...a, [e]: images[i] }), {});
        window.parent.postMessage({ type: 'intermediateImages', values });

        // test
        // {
        //   const summed = expanded.mul(weightsExpanded).sum(1); // [6, 6912]
        //   const matmulResult = intermediateOutput.matMul(weights); // [6, 6912]
        //   console.log("summed",summed.arraySync());
        //   console.log("matmulResult",matmulResult.arraySync());
        // }
    }

}

const history = await model.fit(tensors.x, tensors.y, {
    batchSize: tensors.x.shape[0],
    epochs: config.epochs,
    shuffle: true,
    callbacks: {
        // onTrainEnd, onEpochEnd
        onEpochEnd: (epoch) => {
            postWeights();
            updateProgress(100 * (epoch + 1) / config.epochs);
        }
    },
});
console.log("history", history);
console.log("last loss", history.history.loss[history.history.loss.length - 1]);
