export class TiedEmbeddingOutput extends tf.layers.Layer {
  constructor(embeddingLayer, config = {}) {
    super(config);
    this.embeddingLayer = embeddingLayer;
  }

  computeOutputShape(inputShape) {
    return [inputShape[0], this.embeddingLayer.inputDim];
  }

  call(inputs) {
    const x = Array.isArray(inputs) ? inputs[0] : inputs;
    // console.log(this.embeddingLayer)
    // console.log(this.embeddingLayer.embeddings)
    const embMatrix = this.embeddingLayer.embeddings.read();
    return tf.matMul(x, embMatrix, false, true);
  }

  static get className() {
    return "TiedEmbeddingOutput";
  }
}
tf.serialization.registerClass(TiedEmbeddingOutput);
