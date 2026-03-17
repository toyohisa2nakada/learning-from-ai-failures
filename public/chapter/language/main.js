const config = {
    modelNames: [
        "fnn",
        // "gap",
        // "llm",
    ],
    learningRate: 0.005,
    epochs: 50,
};
function setModels({ learningRate = 0.001, verbose = true } = {}) {
    const keyDim = 4;
    // encodingType: embedding / onehot
    const encodingType = "onehot";

    const modelMap = {
        fnn: { fn: createSimpleFNN, params: { type: "ful" } },
        gap: { fn: createSimpleGAP, params: { type: "ful" } },
        llm: { fn: createSimpleLLM, params: { type: "nor", numHeads: 8 } },
    };

    const models = config.modelNames.map(name => {
        const { fn, params } = modelMap[name];
        return fn({
            vocabSize: Object.keys(dataset.vocab).length,
            inputDim: dataset.train_x().shape[1],
            keyDim,
            learningRate,
            encodingType,
            ...params,
        });
    });
    return models;
}


import { OneHotLayer } from "OneHotLayer.js";
import { MultiHeadAttention } from "MultiHeadAttention.js";
import { SliceLayer } from "SliceLayer.js";
import { TiedEmbeddingOutput } from "TiedEmbeddingOutput.js";
import { WeightedLayer } from "WeightedLayer.js";
import { SumLayer } from "SumLayer.js";

import { updateProgress } from "updateProgress.js";
import { postLearningStatus } from "postLearningStatus.js";
import { registerExternallyCallableFunction } from "externalCaller.js";
import dataset from "dataset.js";
dataset.setTf(tf);
let models = null;

// vocabSize: 全単語数, inputDim: 入力単語数, numHeads keyDim: MultiHeadAttention paramter, learningRate:学習率
function createSimpleFNN({ vocabSize, inputDim, keyDim, learningRate, type, encodingType }) {
    const input = tf.input({ shape: [inputDim], dtype: "int32", name: "char_input" });
    // [Batch, inputDim, embDim]
    let charEmbed = encodingType === "embedding" ? tf.layers.embedding({ inputDim: vocabSize, outputDim: keyDim, maskZero: true }).apply(input) : new OneHotLayer({ numClasses: vocabSize }).apply(input);

    // [Batch, inputDim*embDim]
    if (type === "slc") {
        charEmbed = (new SliceLayer({ startIndex: charEmbed.shape[1] - 1 })).apply(charEmbed);
    }
    const flat = tf.layers.flatten().apply(charEmbed);
    // const logits = tf.layers.dense({ units: vocabSize }).apply(flat);
    const weighted = (new WeightedLayer({ units: vocabSize, name: "weighted", embeddingDim: charEmbed.shape[2] }));
    const weightedApplied = weighted.apply(flat);
    const logits = (new SumLayer({ name: "sum" })).apply(weightedApplied);
    const output = tf.layers.activation({ activation: "softmax" }).apply(logits);
    const model = tf.model({ inputs: input, outputs: output, name: `fnn(${type ?? ""})` });

    model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: "sparseCategoricalCrossentropy",
        metrics: ["accuracy"],
    })
    return { model, options: { WeightedLayer: weighted } };
}
function createSimpleGAP({ vocabSize, inputDim, keyDim, learningRate, type, encodingType }) {
    const input = tf.input({ shape: [inputDim], dtype: "int32", name: "char_input" });
    // [Batch, inputDim, embDim]
    let charEmbed = encodingType === "embedding" ? tf.layers.embedding({ inputDim: vocabSize, outputDim: keyDim, maskZero: true }).apply(input) : new OneHotLayer({ numClasses: vocabSize }).apply(input);

    // [Batch, embDim, embDim]
    let pooled = undefined;
    if (type === "ful") {
        pooled = tf.layers.globalAveragePooling1d().apply(charEmbed);
    } else if (type === "slc") {
        // 最後の単語だけを使用する
        pooled = (new SliceLayer({ startIndex: charEmbed.shape[1] - 1 })).apply(charEmbed);
        pooled = tf.layers.flatten().apply(pooled);
    }
    // const logits = tf.layers.dense({ units: vocabSize }).apply(pooled);
    // const weighted = undefined;
    const weighted = (new WeightedLayer({ units: vocabSize, name: "weighted", embeddingDim: charEmbed.shape[2] }));
    const weightedApplied = weighted.apply(pooled);
    const logits = (new SumLayer({ name: "sum" })).apply(weightedApplied);
    const output = tf.layers.activation({ activation: "softmax" }).apply(logits);
    const model = tf.model({ inputs: input, outputs: output, name: `gap(${type})` });

    model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: "sparseCategoricalCrossentropy",
        metrics: ["accuracy"],
    })
    return { model, options: { WeightedLayer: weighted } };
}
// type: nor / ext, encodingType: embedding / onehot
function createSimpleLLM({ vocabSize, inputDim, numHeads, keyDim, learningRate, type, encodingType }) {
    const input = tf.input({ shape: [inputDim], dtype: "int32", name: "char_input" });

    // [Batch, inputDim, embDim]
    const embedding = encodingType === "embedding" ? tf.layers.embedding({ inputDim: vocabSize, outputDim: keyDim, maskZero: true }) : undefined;
    const charEmbed = embedding ? embedding.apply(input) : new OneHotLayer({ numClasses: vocabSize }).apply(input);

    // const ln1 = tf.layers.layerNormalization().apply(charEmbed);

    // [Batch, embDim, embDim]
    const mha = new MultiHeadAttention({ keyDim, numHeads, type });

    const attn = mha.apply([charEmbed, charEmbed, charEmbed]);
    const drop = tf.layers.dropout({ rate: 0.2 }).apply(attn);
    const lastAttn = (new SliceLayer({ startIndex: charEmbed.shape[1] - 1 })).apply(drop);

    const lastEmbed = (new SliceLayer({ startIndex: charEmbed.shape[1] - 1 })).apply(charEmbed);
    const added = tf.layers.add().apply([lastAttn, lastEmbed])
    const pooled = tf.layers.flatten().apply(added);

    const logits = embedding ? new TiedEmbeddingOutput(embedding).apply(pooled) : pooled;

    const output = tf.layers.activation({ activation: "softmax" }).apply(logits);
    const model = tf.model({ inputs: input, outputs: output, name: `llm(${type})` });

    model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: "sparseCategoricalCrossentropy",
        metrics: ["accuracy"],
    });
    return { model, options: { MultiHeadAttention: mha } };
}

function evaluateModel({ model, options, dataset }) {
    return tf.tidy(() => {
        options?.MultiHeadAttention?.setKeepAttentionScores(true);
        options?.WeightedLayer?.setKeepWeights(true);

        const inp = dataset.toTensor(dataset.test_patterns.map(e => dataset.encode(e.slice(0, -1))))
        const probs = model.predict(inp);

        const { values, indices } = tf.topk(probs, probs.shape[probs.shape.length - 1], true);
        const topKAllValues = values.arraySync();
        const topKAllIndices = indices.arraySync();
        const predWords = topKAllIndices.map(e => dataset.decode(e[0]));

        const attentionScoresSet = options?.MultiHeadAttention?.getAttentionScores();
        const weightsSet = options?.WeightedLayer?.getWeights();

        return dataset.test_patterns.map((e, i) => ({
            test_pattern: dataset.test_patterns[i].slice(0, -1),
            predicted: predWords[i],
            correct_answer: dataset.test_patterns[i].at(-1),
            topKIndices: topKAllIndices[i],
            topKValues: topKAllValues[i],
            attentionScores: attentionScoresSet?.[i],
            weights: weightsSet?.[i],
        }));
    })
}

function postEvaluation({ model, options, dataset }) {
    const results = evaluateModel({ model, options, dataset });
    window.parent.postMessage({
        type: 'evaluation',
        values: { modelName: model.name.split('(')[0], results }
    });
}

function predict(input) {
    return tf.tidy(() => {
        const { tokens, errorMessage } = dataset.tokenize(input);
        if (tokens === null || tokens.length === 0) {
            return errorMessage;
        } else if (tokens.length > dataset.maxLen - 1) {
            return `語数が多いです。最大 ${dataset.maxLen - 1}`;
        }
        const x = dataset.toTensor([tokens], tf);
        const results = {};
        models.map(e => e.model).forEach(model => {
            const probs = model.predict(x)
            const predIds = probs.argMax(-1).dataSync();
            const predWords = Array.from(predIds).map((e, i) => dataset.decode(e));
            console.log(model.name + "\n" + predWords.map((e, i) => `${input} ${e}`).join("\n"));

            results[model.name] = predWords.join(" ");
        })
        return results;
    })
}

async function learn(dataset, { learningRate, epochs, verbose = true } = {}) {
    if (dataset === undefined) {
        alert("学習データを生成してください。");
        return;
    }
    models = setModels({ learningRate });
    postLearningStatus("started");

    for (let i = 0; i < models.length; i += 1) {
        const { model, options } = models[i];
        options?.MultiHeadAttention?.setKeepAttentionScores(false);
        options?.WeightedLayer?.setKeepWeights(false);
        const history = await model.fit(dataset.train_x(tf), dataset.train_y(tf), {
            epochs,
            batchSize: 8,
            shuffle: true,
            callbacks: {
                onEpochEnd: (epoch) => {
                    postEvaluation({ model, options, dataset });
                    updateProgress(100 * (epoch + 1) / epochs);
                }
            }
        });
    }
    postLearningStatus("ended");
}

await learn(dataset, config);
registerExternallyCallableFunction("predict", predict);
