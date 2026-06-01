const Treino = {
  pop: null,
  carros: [],
  fits: [],
  geracao: 0,
  pistaAtual: 0,
  rotacao: 35,

  iniciar(pista) {
    if (!this.pop) {
      const salvo = this.carregar();

      this.pop =
        salvo && salvo.pop && salvo.pop.length === GA.TAM_POP
          ? salvo.pop
          : GA.criarPopulacao();

      if (salvo) {
        this.geracao = salvo.gen || 0;
        this.pistaAtual = salvo.pista || 0;
      }
    }

    this.criarCarros(pista);
  },

  criarCarros(pista) {
    this.carros = this.pop.map(r => new Carro(pista, r));
    this.fits = new Array(this.carros.length).fill(0);
  },

  update(dt) {
    let vivos = 0;

  for (let i = 0; i < this.carros.length; i++) {

    const c = this.carros[i];

    if (c.vivo) {
      c.updateIA(dt);
      vivos++;
    }

    // =========================
    // PUNIÇÃO POR ANDAR COLADO
    // =========================
   let penalidadeBorda = 0;

   if (c.vivo && c.sensores && c.sensores.length > 0) {

     const menorSensor =
       Math.min(...c.sensores);

     // Muito perto da parede
     if (menorSensor < 45) {

       penalidadeBorda = 30000;

     }

     // Relativamente perto
     else if (menorSensor < 70) {

       penalidadeBorda = 12000;

     }
   }

   // =========================
   // PUNIÇÃO POR OBSTÁCULO
   // =========================
   let penalidadeObstaculo = 0;

   if (c.vivo && pista.obstaculos) {

     for (const o of pista.obstaculos) {

       const dx = c.x - o.x;
       const dy = c.y - o.y;

       const dist =
         Math.hypot(dx, dy);

       // Muito perto do obstáculo
       if (dist < 90) {

         penalidadeObstaculo += 40000;

       }

       // Relativamente perto
       else if (dist < 130) {

         penalidadeObstaculo += 15000;

       }
     }
   }

   this.fits[i] =
     Math.max(
       0,
       c.fitness
       - (c.vivo ? 0 : 25000)
       - penalidadeBorda
       - penalidadeObstaculo
     );
   }

    return vivos;
  },

  melhorVivo() {
    let best = null;
    let fit = -Infinity;

    for (const c of this.carros) {
      if (c.vivo && c.fitness > fit) {
        best = c;
        fit = c.fitness;
      }
    }

    return best;
  },

  novaGeracao() {
    this.salvar();

    this.pop = GA.novaGeracao(this.pop, this.fits);
    this.geracao++;

    if (this.geracao % this.rotacao === 0) {
      this.pistaAtual =
        (this.pistaAtual + 1) % PISTAS.length;
    }
  },

  salvar() {
    if (!this.pop) return;

    const best = Math.max(...this.fits, 0);

    localStorage.setItem(
      'f-neural-save',
      JSON.stringify({
        gen: this.geracao,
        pista: this.pistaAtual,
        best,
        pop: this.pop.map(r => r.genoma)
      })
    );
  },

  carregar() {
    try {
      const raw = localStorage.getItem('f-neural-save');

      if (!raw) return null;

      const data = JSON.parse(raw);

      return {
        gen: data.gen || 0,
        pista: data.pista || 0,
        best: data.best || 0,
        pop: data.pop
          .map(g => new RedeNeural(g))
          .filter(r => r.genoma.length === r.tamanho)
      };
    } catch {
      return null;
    }
  },

  reset() {
    localStorage.removeItem('f-neural-save');

    this.pop = GA.criarPopulacao();
    this.carros = [];
    this.fits = [];

    this.geracao = 0;
    this.pistaAtual = 0;
  }
};