export class SumLayer extends tf.layers.Layer {
    call(inputs) {
        return tf.tidy(() => {
            const x = Array.isArray(inputs) ? inputs[0] : inputs;
            return x.sum(1); // [batch, inputDim+1, units] → [batch, units]
        });
    }

    computeOutputShape(inputShape) {
        return [inputShape[0], inputShape[2]];
    }
}