import { OneHotLayer } from "OneHotLayer.js";
import { MultiHeadAttention } from "MultiHeadAttention.js";
import { SliceLayer } from "SliceLayer.js";
import { TiedEmbeddingOutput } from "TiedEmbeddingOutput.js";

let datasets = undefined;
let models = undefined;

function generateDatasets({ sentences, test_patterns, correct_answers, mode = "next" }) {
    const maxLen = Math.max(...sentences.map(e => e.split(" ").length));
    const allWords = [...new Set(sentences.join(" ").split(" "))].sort();
    const vocab = { "<PAD>": 0, ...allWords.reduce((a, e, i) => ({ ...a, [e]: i + 1 }), {}) }

    function encode(words) {
        const inputPad = new Array(maxLen - words.length - 1).fill(vocab["<PAD>"]);
        return [...inputPad, ...words.map(w => vocab[w])];
    }
    function toTensor(seq) {
        // disposeが必要、またはtidy内で実行する
        return tf.tensor2d(seq, [seq.length, maxLen - 1], 'int32');
    }
    function decode(code) {
        return allWords[code - 1];
    }
    function tokenize(input) {
        const words = Object.keys(vocab).sort((a, b) => b.length - a.length);
        const chunks = input.trim().split(/\s+/).filter(Boolean);
        const ids = [];
        for (const chunk of chunks) {
            let rest = chunk;
            while (rest.length > 0) {
                let matchedWord = null;
                for (const w of words) {
                    if (rest.startsWith(w)) {
                        matchedWord = w;
                        break;
                    }
                }
                if (!matchedWord) {
                    return { tokens: null, errorMessage: `未知の語が含まれています: "${rest}"（chunk="${chunk}"）` };
                }
                ids.push(vocab[matchedWord]);
                rest = rest.slice(matchedWord.length);
            }
        }
        return { tokens: Array(Math.max(0, maxLen - 1 - ids.length)).fill(0).concat(ids) };
    }

    const sequences = [];
    sentences.forEach(s => {
        const words = s.split(" ");
        const n = words.length;
        if (mode === "next") {
            for (let i = 1; i < n; i++) {
                sequences.push({ inputSeq: encode(words.slice(0, i)), targetWord: vocab[words[i]] });
            }
        } else if (mode === "last") {
            sequences.push({ inputSeq: encode(words.slice(0, n - 1)), targetWord: vocab[words[n - 1]] });
        }
    });

    const inputs = tf.tensor2d(sequences.map(e => e.inputSeq), [sequences.length, maxLen - 1], 'int32');
    const targets = tf.tensor1d(sequences.map(e => e.targetWord), 'float32');
    return { train_x: inputs, train_y: targets, maxLen, vocab, encode, toTensor, decode, sentences, sequences, test_patterns, correct_answers, tokenize };
}

function generateFavoriteDatasets() {
    const objects = [["ポケモン", "ゲーム", "カレー"], ["大学"]];
    const subjects = [["私は", ["好きです", "嫌いです"]], ["俺は", ["好きだ", "嫌いだ"]]];


    const test_patterns = [];
    const correct_answers = [];

    const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
    objects.forEach((objs, objs_i) => {
        const obj = choice(objs);
        subjects.forEach(sub => {
            // 順列
            test_patterns.push([sub[0], obj]);
            correct_answers.push(sub[1][objs_i]);

            // 逆順
            test_patterns.push([obj, sub[0]]);
            correct_answers.push(sub[1][objs_i]);
        })
    })

    const sentences = [];
    objects.map((o, i) => o.map(oi => [oi, i])).flat().forEach(oi => {
        subjects.forEach(([sub, verbs]) => {
            sentences.push(`${sub} ${oi[0]} ${verbs[oi[1]]}`);
            // if (oi[0] === "ゲーム" && sub === "私は" || oi[0] === "大学" && sub === "俺は") {
            // sentences.push(`${verbs[oi[1]]} ${oi[0]} ${sub}`);
            // }
        })
    });
    return generateDatasets({ sentences, test_patterns, correct_answers, mode: "next" });
}
function generateHomonymDatasets() {
    const numSlots = 4; // ハシの前の語数
    const numDataPerType = 64; // 各パターンのデータ数

    const contextGroups = [
        ["道路", "車道", "歩道"],
        ["食事", "食卓", "食器"]
    ];
    const allNoise = ["山", "空", "海", "音", "光", "英", "国", "県", "東", "西", "南", "北", "右", "左", "壱", "弐", "参", "四", "五", "六", "七", "八", "九", "十"];
    const targetWords = ["わたる", "たべる"];

    const half = Math.floor(allNoise.length / 2);
    const contextNoise = allNoise.slice(0, half);
    const noContextNoise = allNoise.slice(half);

    const sentences = [];
    const test_patterns = [];
    const correct_answers = [];

    const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);
    const slotIndices = Array.from({ length: numSlots - 1 }, (_, i) => i + 1);

    // 1. 有効なコンテキストを含むデータの生成
    for (let i = 0; i < numDataPerType * contextGroups.length; i++) {
        const words = shuffle(contextNoise).slice(0, numSlots);
        const ctxIdx = i % contextGroups.length;
        words[shuffle(slotIndices)[0]] = contextGroups[ctxIdx][i % contextGroups[ctxIdx].length];
        sentences.push(`${words.join(" ")} ハシ ${targetWords[ctxIdx]}`);
    }
    // 2. ノイズのみのデータの生成 (128個)
    for (let i = 0; i < numDataPerType; i++) {
        let words = shuffle([...contextNoise, ...noContextNoise]).slice(0, numSlots);
        sentences.push(`${words.join(" ")} ハシ 不明`);
    }

    // contextGroupsにある語を持つレコードを見つける
    const findAndExtract = (hasG0, hasG1, index = 0) => {
        const results = sentences.filter(s => {
            const words = s.split(" ");
            const containsG0 = words.some(w => contextGroups[0].includes(w));
            const containsG1 = words.some(w => contextGroups[1].includes(w));
            return containsG0 === hasG0 && containsG1 === hasG1;
        });
        return results[index] ? results[index].split(" ") : null;
    };

    // noContextNoiseからテストデータを作成
    [...Array(3).keys()].forEach(i => {
        const words = shuffle(noContextNoise).slice(0, numSlots);
        const ctxIdx = i % contextGroups.length;
        words[Math.floor(Math.random() * numSlots)] = contextGroups[ctxIdx][Math.floor(Math.random() * contextGroups[ctxIdx].length)];
        test_patterns.push([...words, "ハシ"]);
        correct_answers.push(targetWords[ctxIdx]);
    });

    // 1語目にコンテキストを入れる
    [...Array(1).keys()].map(i => findAndExtract(i % 2 === 0, i % 2 === 1)).filter(e => e !== null).forEach(seq => {
        test_patterns.push(seq.slice(0, numSlots + 1))
        correct_answers.push(seq[numSlots + 1])

        const ctxWord = seq.find(e => contextGroups.flat().includes(e))
        const ctxIdx = seq.indexOf(ctxWord)
        const tagIdx = 0;
        [seq[tagIdx], seq[ctxIdx]] = [seq[ctxIdx], seq[tagIdx]];
        test_patterns.push(seq.slice(0, numSlots + 1))
        correct_answers.push(seq[numSlots + 1])
    });

    return generateDatasets({ sentences, test_patterns, correct_answers, mode: "last" })
}

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
    const logits = tf.layers.dense({ units: vocabSize }).apply(flat);
    const output = tf.layers.activation({ activation: "softmax" }).apply(logits);
    const model = tf.model({ inputs: input, outputs: output, name: `fnn(${type ?? ""})` });

    model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: "sparseCategoricalCrossentropy",
        metrics: ["accuracy"],
    })
    return { model };
}
function createSimpleGAP({ vocabSize, inputDim, keyDim, learningRate, type, encodingType }) {
    const input = tf.input({ shape: [inputDim], dtype: "int32", name: "char_input" });
    // [Batch, inputDim, embDim]
    // const embedding = encodingType === "embedding" ? tf.layers.embedding({ inputDim: vocabSize, outputDim: keyDim, maskZero: true }) : undefined;
    // const charEmbed = embedding ? embedding.apply(input) : new OneHotLayer({ numClasses: vocabSize }).apply(input);
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
    const logits = tf.layers.dense({ units: vocabSize }).apply(pooled);
    const output = tf.layers.activation({ activation: "softmax" }).apply(logits);
    const model = tf.model({ inputs: input, outputs: output, name: `gap(${type})` });

    model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: "sparseCategoricalCrossentropy",
        metrics: ["accuracy"],
    })
    return { model };
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

    // const logits = tf.layers.dense({ units: vocabSize }).apply(pooled);

    const logits = embedding ? new TiedEmbeddingOutput(embedding).apply(pooled) : pooled;

    const output = tf.layers.activation({ activation: "softmax" }).apply(logits);
    const model = tf.model({ inputs: input, outputs: output, name: `llm(${type})` });

    model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: "sparseCategoricalCrossentropy",
        metrics: ["accuracy"],
    })
    return { model, options: { mha } };
}

function evaluateModel({ model, datasets }) {
    return tf.tidy(() => {
        const inp = datasets.toTensor(datasets.test_patterns.map(e => datasets.encode(e)))
        const probs = model.predict(inp)
        const predIds = probs.argMax(-1).dataSync();
        const predWords = Array.from(predIds).map((e, i) => datasets.decode(e));
        console.log(model.name + "\n" + predWords.map((e, i) => `${datasets.test_patterns[i]} ${e}`).join("\n"));
        return datasets.test_patterns.map((e, i) => ({ test_pattern: datasets.test_patterns[i], predicted: predWords[i], correct_answer: datasets.correct_answers?.[i] }));
    })
}

function setDatasets({ type = "favorite" } = {}) {
    // generateFavoriteDatasets, generateHomonymDatasets

    if (type === "favorite") {
        datasets = generateFavoriteDatasets();
    } else if (type === "homonym") {
        datasets = generateHomonymDatasets();
    }

    // const datasetsElem = setupDatasetsPanel();
    // updateDatasetsPanel({ datasetsElem, datasets })
    return datasets;
}
function setModels({ learningRate = 0.001, verbose = true } = {}) {
    const keyDim = 4;
    // epochs 300, learningRate 0.005, そしてnumHeads 8で感覚的に8割は評価データで成功する。
    const numHeads = 8;
    // encodingType: embedding / onehot
    const encodingType = "onehot";
    models = [
        createSimpleLLM({
            vocabSize: Object.keys(datasets.vocab).length,
            inputDim: datasets.train_x.shape[1],
            keyDim,
            numHeads,
            learningRate,
            type: "nor",
            encodingType,
        }),
        createSimpleLLM({
            vocabSize: Object.keys(datasets.vocab).length,
            inputDim: datasets.train_x.shape[1],
            keyDim,
            numHeads,
            learningRate,
            type: "ext",
            encodingType,
        }),
        createSimpleGAP({
            vocabSize: Object.keys(datasets.vocab).length,
            inputDim: datasets.train_x.shape[1],
            keyDim,
            learningRate,
            type: "ful",
            encodingType,
        }),
        createSimpleGAP({
            vocabSize: Object.keys(datasets.vocab).length,
            inputDim: datasets.train_x.shape[1],
            keyDim,
            learningRate,
            type: "slc",
            encodingType,
        }),
        createSimpleFNN({
            vocabSize: Object.keys(datasets.vocab).length,
            inputDim: datasets.train_x.shape[1],
            keyDim,
            learningRate,
            type: "ful",
            encodingType,
        }),
        createSimpleFNN({
            vocabSize: Object.keys(datasets.vocab).length,
            inputDim: datasets.train_x.shape[1],
            keyDim,
            learningRate,
            type: "slc",
            encodingType,
        }),
    ].filter(e => e !== undefined);
    // if (verbose) {
    //     models.forEach(e => {
    //         tfvis.show.modelSummary({ name: e.model.name }, e.model);
    //     })
    // }
    return models;
}
async function learn({ datasets, learningRate, epochs, verbose = true }) {
    if (datasets === undefined) {
        alert("学習データを生成してください。")
        return;
    }
    setModels({ learningRate });
    // const resultsElem = verbose ? setupResultsPanel({ tfvis, models, test_patterns: datasets.test_patterns, correct_answers: datasets.correct_answers }) : undefined;

    for (let i = 0; i < models.length; i += 1) {
        const model = models[i].model;
        models[i].options?.mha?.setKeepAttentionScores(false);
        const history = await model.fit(datasets.train_x, datasets.train_y, {
            epochs,
            batchSize: 8,
            shuffle: true,
            // callbacks: tfvis.show.fitCallbacks(
            //     { name: "学習回数と誤差" },
            //     ["loss"],
            //     { height: 80, callbacks: ["onEpochEnd"] },
            // ),
        });
        console.log(history);
        models[i].options?.mha?.setKeepAttentionScores(true);
        if (datasets.test_patterns !== undefined) {
            const results = evaluateModel({ model, datasets });
            console.log(results);
            // updateResultsPanel({ modelEntry: models[i], datasets, resultsElem, results })
        }
    }
    function predict({ models, datasets, input }) {
        return tf.tidy(() => {
            const { tokens, errorMessage } = datasets.tokenize(input);
            if (tokens === null) {
                updateModelEvaluationPanel({ modelEvaluationElem, errorMessage });
                return;
            } else if (tokens.length > datasets.maxLen - 1) {
                updateModelEvaluationPanel({ modelEvaluationElem, errorMessage: `語数が多いです。最大 ${datasets.maxLen - 1}` });
                return;
            }
            const x = datasets.toTensor([tokens]);
            const results = {};
            models.map(e => e.model).forEach(model => {
                const probs = model.predict(x)
                const predIds = probs.argMax(-1).dataSync();
                const predWords = Array.from(predIds).map((e, i) => datasets.decode(e));
                console.log(model.name + "\n" + predWords.map((e, i) => `${input} ${e}`).join("\n"));

                results[model.name] = predWords.join(" ");
            })
            console.log(results);
            // updateModelEvaluationPanel({ modelEvaluationElem, results })
        })
    }
    // const modelEvaluationElem = setupModelEvaluationPanel({ predict });
}

setDatasets({ type: "homonym" });
await learn({ datasets, learningRate: 0.005, epochs: 300 });
