const VEL_MAX = 3.0;
const ACEL = VEL_MAX / 240;
const FREIO = 0.018;
const ATRITO = 0.0035;
const GIRO_BASE = 0.034;
const CAR_W = 12;
const CAR_H = 20;

class Carro {
  constructor(pista, rede = null) {
    this.pista = pista;
    this.rede = rede;
    const ini = pista.posInicial();
    this.x = ini.x;
    this.y = ini.y;
    this.ang = ini.ang;
    this.vx = 0;
    this.vy = 0;
    this.vel = 0;
    this.vivo = true;
    this.frames = 0;
    this.semProgresso = 0;
    this.check = 0;
    this.maxCheck = 0;
    this.repeticoesCheck = 0;
    this.tempoSemNovoCheck = 0;
    this.dist = 0;
    this.fitness = 0;
    this.marcha = 'N';
    this.leituras = new Float32Array(NUM_SENSORES);
    this.ultimoEsterco = 0;
    this.zigzag = 0;
    this.alinhamento = 0;
    this.mediaSensores = 1;
    this.sensorMinimo = 1;
    this.centralidade = 1;
    this.cor = rede ? `hsl(${Math.random()*360},85%,60%)` : '#ff0055';
    this.ultimaZona = { x: this.x, y: this.y, t: 0 };
  }

  updateManual(dt, input) {
    if (!this.vivo) return;
    this.leituras = Sensores.ler(this, this.pista);
    this.mediaSensores = this.leituras.reduce((a, b) => a + b, 0) / this.leituras.length;
    this.sensorMinimo = Math.min(...this.leituras);
    this.centralidade = Math.min(1, this.sensorMinimo * 2.2);
    this.fisica(dt, input);
    this.progresso();
    this.morte();
  }

  updateIA(dt) {
    if (!this.vivo) return;
    this.leituras = Sensores.ler(this, this.pista);
    this.mediaSensores = this.leituras.reduce((a, b) => a + b, 0) / this.leituras.length;
    this.sensorMinimo = Math.min(...this.leituras);
    this.centralidade = Math.min(1, this.sensorMinimo * 2.2);
    const entrada = new Float32Array(NUM_SENSORES + 1);
    for (let i = 0; i < NUM_SENSORES; i++) entrada[i] = this.leituras[i];
    entrada[NUM_SENSORES] = this.vel / VEL_MAX;

    const out = this.rede.forward(entrada);
    this.fisica(dt, {
      esterco: out[0],
      acelerador: out[1],
      frear: false,
      freioMao: false
    });

    this.progresso();
    this.morte();
    this.fitness = fitnessCarro(this);
  }

  fisica(dt, input) {
    const d = Math.min(dt, 3);
    const { acelerador, frear, esterco, freioMao } = input;

    if (typeof acelerador === 'number') {
      if (acelerador > 0.08) {
        this.vel = Math.min(VEL_MAX, this.vel + ACEL * acelerador * d);
      } else if (acelerador < -0.15) {
        this.vel = Math.max(0, this.vel - FREIO * Math.abs(acelerador) * d);
      } else {
        this.vel = Math.max(0, this.vel - ATRITO * d);
      }

      // Pequeno incentivo inicial para evitar carros totalmente parados.
      if (this.frames < 60 && this.vel < 0.18) {
        this.vel = Math.min(0.18, this.vel + ACEL * 0.2 * d);
      }
    } else {
      if (acelerador) this.vel = Math.min(VEL_MAX, this.vel + ACEL * d);
      if (frear) this.vel = Math.max(0, this.vel - FREIO * d);
      if (!acelerador && !frear) this.vel = Math.max(0, this.vel - ATRITO * d);
      if (freioMao) this.vel *= 0.992;
    }

    const velNorm = this.vel / VEL_MAX;
    let giro = GIRO_BASE * (1.95 - velNorm);
    giro = Math.max(GIRO_BASE * 0.42, giro);
    if (freioMao) giro *= 1.7;

    let estercoAtual = 0;

    if (this.vel > 0.04) {
      if (typeof esterco === 'number') {
        estercoAtual = Math.max(-1, Math.min(1, esterco));
        this.ang += estercoAtual * giro * d;
      } else {
        if (esterco === 'esq') estercoAtual = -1;
        if (esterco === 'dir') estercoAtual = 1;
        this.ang += estercoAtual * giro * d;
      }
    }

    this.zigzag += Math.abs(estercoAtual - this.ultimoEsterco);
    this.ultimoEsterco = estercoAtual;

    const fx = Math.cos(this.ang), fy = Math.sin(this.ang);
    const lx = -fy, ly = fx;

    // Aderência maior para pistas técnicas: menos drift involuntário.
    const aderenciaLateral = freioMao ? 0.74 : 0.07;
    const lateral = (this.vx * lx + this.vy * ly) * aderenciaLateral;

    this.vx = fx * this.vel + lx * lateral;
    this.vy = fy * this.vel + ly * lateral;

    this.x += this.vx * d;
    this.y += this.vy * d;
    this.dist += this.vel * d;
    this.frames++;

    if (this.vel < 0.04) this.semProgresso++;
    else this.semProgresso = 0;

    this.marcha = this.vel < 0.05 ? 'N' : this.vel < 0.65 ? '1' : this.vel < 1.25 ? '2' : this.vel < 1.95 ? '3' : this.vel < 2.55 ? '4' : '5';
  }

  progresso() {
    const gates = this.pista.gates;
    let avancou = false;

    for (let k = 1; k < 12; k++) {
      const idx = (this.check + k) % gates.length;
      const g = gates[idx];

      const dx = this.x - g.x;
      const dy = this.y - g.y;

      if (Math.abs(dx * g.ny - dy * g.nx) < this.pista.largura / 2) {
        this.check = idx;
        this.semProgresso = 0;
        this.tempoSemNovoCheck = 0;
        avancou = true;

        if (idx > this.maxCheck || this.maxCheck - idx > gates.length * 0.75) {
          this.maxCheck = Math.max(this.maxCheck, idx);
          this.repeticoesCheck = 0;
        } else {
          this.repeticoesCheck++;
        }

        break;
      }
    }

    if (!avancou) {
      this.tempoSemNovoCheck++;
    }
  }

  morte() {
    if (!this.pista.ehAsfalto(this.x, this.y)) {
      this.vivo = false;
      return;
    }

    for (const ob of this.pista.obstaculos) {
      if ((this.x - ob.x) ** 2 + (this.y - ob.y) ** 2 < (ob.r + 7) ** 2) {
        this.vivo = false;
        return;
      }
    }

    if (this.semProgresso > 280 || this.tempoSemNovoCheck > 650 || this.frames > 6800) this.vivo = false;
  }
}

function fitnessCarro(c) {
  const gates = c.pista.gates;
  const atual = gates[c.check % gates.length];
  const prox = gates[(c.check + 1) % gates.length];

  let alinhamento = 0;

  if (atual && prox) {
    const tx = prox.x - atual.x;
    const ty = prox.y - atual.y;
    const len = Math.hypot(tx, ty) || 1;

    const dirX = tx / len;
    const dirY = ty / len;

    const frenteX = Math.cos(c.ang);
    const frenteY = Math.sin(c.ang);

    alinhamento = Math.max(0, frenteX * dirX + frenteY * dirY);
  }

  c.alinhamento = alinhamento;

  // Menor sensor baixo = carro colado na borda/obstáculo.
  const pertoDaBorda = 1 - c.centralidade;

  // Agora o fitness prioriza progresso REAL, não só sobrevivência.
  const progressoReal = c.maxCheck * 1500;
  const checkpointAtual = c.check * 120;
  const distanciaBonus = c.dist * 0.035;

  // Recompensa dirigir bem: alinhado, centralizado e com velocidade controlada.
  const direcaoBoa = alinhamento * 90;
  const centroPistaBonus = c.centralidade * 75;
  const velocidadeBoa = c.vel * alinhamento * c.centralidade * 55;

  // Suavidade: reduz zig-zag e movimentos nervosos.
  const suavidadeBonus = Math.max(0, 80 - c.zigzag * 0.16);

  const vivoBonus = c.vivo ? 35 : 0;

  // Penalidades fortes contra estratégias ruins.
  const paradoPenalty = c.semProgresso * 1.1;
  const semNovoCheckPenalty = c.tempoSemNovoCheck * 0.65;
  const zigzagPenalty = c.zigzag * 0.28;
  const bordaPenalty = pertoDaBorda * 65;
  const desalinhadoPenalty = (1 - alinhamento) * c.vel * 14;
  const repeticaoPenalty = c.repeticoesCheck * 300;

  return progressoReal
    + checkpointAtual
    + distanciaBonus
    + direcaoBoa
    + centroPistaBonus
    + velocidadeBoa
    + suavidadeBonus
    + vivoBonus
    - paradoPenalty
    - semNovoCheckPenalty
    - zigzagPenalty
    - bordaPenalty
    - desalinhadoPenalty
    - repeticaoPenalty;
}
