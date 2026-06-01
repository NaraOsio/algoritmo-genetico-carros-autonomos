class RedeNeural {
  constructor(genoma = null) {
    this.entradas = 21;
    this.ocultos = 24;
    this.saidas = 2;
    this.tamanho = this.entradas * this.ocultos + this.ocultos + this.ocultos * this.saidas + this.saidas;
    if (genoma && genoma.length === this.tamanho) {
      this.genoma = [...genoma];
    } else {
      this.genoma = Array.from({ length: this.tamanho }, () => Math.random() * 2 - 1);
    }
  }

  clone() {
    return new RedeNeural(this.genoma);
  }

  forward(input) {
    let k = 0;
    const h = [];

    for (let j = 0; j < this.ocultos; j++) {
      let soma = 0;
      for (let i = 0; i < this.entradas; i++) {
        soma += input[i] * this.genoma[k++];
      }
      soma += this.genoma[k++];
      h[j] = Math.tanh(soma);
    }

    const out = [];

    for (let o = 0; o < this.saidas; o++) {
      let soma = 0;
      for (let j = 0; j < this.ocultos; j++) {
        soma += h[j] * this.genoma[k++];
      }
      soma += this.genoma[k++];
      out[o] = Math.tanh(soma);
    }

    return out;
  }
}
