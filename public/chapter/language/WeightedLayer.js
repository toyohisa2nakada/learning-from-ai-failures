export class WeightedLayer extends tf.layers.Layer {
    constructor(config) {
        super(config);
        this.units = config.units ?? 1;
        this.useBias = config?.useBias ?? true;
        this.embeddingDim = config.embeddingDim;
        this.keepWeights = config.keepWeights ?? false;
    }

    build(inputShape) {
        const inputDim = inputShape[inputShape.length - 1];
        this.kernel = this.addWeight(
            "kernel",
            [inputDim + (this.useBias ? 1 : 0), this.units],
            "float32",
            tf.initializers.glorotUniform()
        );
        super.build(inputShape);
    }

    call(inputs) {
        return tf.tidy(() => {
            const x = Array.isArray(inputs) ? inputs[0] : inputs;

            let xReady;
            if (this.useBias) {
                const ones = tf.ones([x.shape[0], 1]);
                xReady = tf.concat([x, ones], 1); // [batch, inputDim+1]
            } else {
                xReady = x; // [batch, inputDim]
            }

            const xExpanded = xReady.expandDims(2);
            const kernelExpanded = this.kernel.read().expandDims(0);
            const output = xExpanded.mul(kernelExpanded);
            // console.log(output.shape);
            if (this.keepWeights) {
                const [B, L, O] = output.shape;
                const chunkSize = this.embeddingDim;
                const numFullChunks = Math.floor(L / chunkSize);
                const remainder = L % chunkSize;

                const fullPart = output.slice([0, 0, 0], [B, numFullChunks * chunkSize, O]);
                const reshaped = fullPart.reshape([B, numFullChunks, chunkSize, O]);
                const summed = reshaped.sum(2);

                this.backupedWeights = (remainder > 0
                    ? tf.concat([
                        summed,
                        output.slice([0, numFullChunks * chunkSize, 0], [B, remainder, O])
                    ], 1)
                    : summed
                ).arraySync();
            }
            return output;
        });
    }

    computeOutputShape(inputShape) {
        const inputDim = inputShape[inputShape.length - 1];
        return [...inputShape.slice(0, -1), inputDim + (this.useBias ? 1 : 0), this.units];
    }

    getConfig() {
        return { ...super.getConfig(), units: this.units, useBias: this.useBias, embeddingDim: this.embeddingDim, keepWeights: this.keepWeights };
    }

    getKeepWeights() {
        return this.keepWeights;
    }
    setKeepWeights(value) {
        this.keepWeights = value;
    }
    getWeights() {
        return this.backupedWeights;
    }
}