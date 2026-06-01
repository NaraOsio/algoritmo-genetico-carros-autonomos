const NUM_SENSORES = 20;
const SENSOR_DIST = 230;

class Sensores {
  static ler(carro, pista) {
    const leituras = new Float32Array(NUM_SENSORES);
    const abertura = Math.PI * (120 / 180);
    const base = carro.ang - abertura / 2;
    const step = abertura / (NUM_SENSORES - 1);

    for (let i = 0; i < NUM_SENSORES; i++) {
      const ang = base + i * step;
      let dist = SENSOR_DIST;
      const cx = Math.cos(ang), sy = Math.sin(ang);

      for (let d = 4; d <= SENSOR_DIST; d += 4) {
        const x = carro.x + cx * d;
        const y = carro.y + sy * d;
        let hit = !pista.ehAsfalto(x, y);

        if (!hit) {
          for (const ob of pista.obstaculos) {
            if ((x - ob.x) ** 2 + (y - ob.y) ** 2 <= ob.r ** 2) {
              hit = true;
              break;
            }
          }
        }

        if (hit) {
          dist = d;
          break;
        }
      }

      leituras[i] = dist / SENSOR_DIST;
    }

    return leituras;
  }
}
