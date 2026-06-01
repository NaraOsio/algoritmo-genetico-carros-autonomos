const GA = {
  TAM_POP: 200,
  ELITE: 30,
  MUTACAO: 0.03,
  FORCA_MUTACAO: 0.18,
  TORNEIO: 5,

  criarPopulacao() {
    return Array.from({ length: this.TAM_POP }, () => new RedeNeural());
  },

  torneio(pop, fits) {
    let melhor = 0;
    for (let i = 0; i < this.TORNEIO; i++) {
      const idx = Math.floor(Math.random() * pop.length);
      if ((fits[idx] || 0) > (fits[melhor] || 0)) melhor = idx;
    }
    return pop[melhor];
  },

  cruzar(a, b) {
    const g = [];
    for (let i = 0; i < a.genoma.length; i++) {
      g[i] = Math.random() < 0.5 ? a.genoma[i] : b.genoma[i];
      if (Math.random() < this.MUTACAO) {
        g[i] += (Math.random() * 2 - 1) * this.FORCA_MUTACAO;
      }
    }
    return new RedeNeural(g);
  },

  novaGeracao(pop, fits) {
    const ranking = pop
      .map((r, i) => ({ r, f: fits[i] || 0 }))
      .sort((a, b) => b.f - a.f);

    const nova = [];
    for (let i = 0; i < this.ELITE; i++) nova.push(ranking[i].r.clone());

    while (nova.length < this.TAM_POP) {
      const p1 = this.torneio(pop, fits);
      const p2 = this.torneio(pop, fits);
      nova.push(this.cruzar(p1, p2));
    }

    return nova;
  }
};
