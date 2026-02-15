export class OneHotLayer extends tf.layers.Layer {
    constructor(config) {
        super(config);
        this.numClasses = config.numClasses;
    }

    call(inputs) {
        return tf.oneHot(inputs[0], this.numClasses);
    }

    computeOutputShape(inputShape) {
        return [...inputShape, this.numClasses];
    }

    static get className() {
        return 'OneHotLayer';
    }
}
