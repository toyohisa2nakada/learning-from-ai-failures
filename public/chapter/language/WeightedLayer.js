export class WeightedLayer extends tf.layers.Layer {
    constructor(config) {
        super(config);
        this.units = config.units ?? 1;
        this.useBias = config?.useBias ?? true;
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
            return xExpanded.mul(kernelExpanded);
        });
    }

    computeOutputShape(inputShape) {
        const inputDim = inputShape[inputShape.length - 1];
        return [...inputShape.slice(0, -1), inputDim + (this.useBias ? 1 : 0), this.units];
    }

    getConfig() {
        return { ...super.getConfig(), units: this.units, useBias: this.useBias };
    }
}