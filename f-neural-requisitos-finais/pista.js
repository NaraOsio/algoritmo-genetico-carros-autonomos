const TRACK_W = 130;
const TRACK_COLOR = '#9B9B9B';

const PISTAS = [
  {
    nome: 'Interlagos',
    pontos: [
      {x:170,y:155},{x:410,y:90},{x:760,y:95},{x:1080,y:100},{x:1280,y:190},
      {x:1360,y:350},{x:1320,y:540},{x:1160,y:665},{x:960,y:650},{x:900,y:520},
      {x:980,y:390},{x:850,y:300},{x:720,y:360},{x:760,y:540},{x:610,y:730},
      {x:360,y:790},{x:140,y:705},{x:80,y:500},{x:90,y:300}
    ],
    obstaculosT: [0.08,0.22,0.38,0.55,0.72,0.88]
  },
  {
    nome: 'Monza',
    pontos: [
      {x:130,y:210},{x:380,y:100},{x:840,y:115},{x:1210,y:190},{x:1340,y:390},
      {x:1260,y:610},{x:950,y:760},{x:480,y:750},{x:160,y:620},{x:70,y:390}
    ],
    obstaculosT: [0.12,0.34,0.58,0.78]
  },
 {
   nome: 'Mônaco',
   pontos: [
     {x:180,y:210},{x:390,y:110},{x:650,y:150},{x:760,y:290},{x:670,y:420},
     {x:900,y:500},{x:1160,y:410},{x:1270,y:560},{x:1060,y:735},{x:720,y:690},
     {x:540,y:560},{x:310,y:670},{x:110,y:520},{x:95,y:330}
   ],
   obstaculosT: [0.11,0.26,0.52,0.61,0.80]
 }
];

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return {
    x: 0.5 * ((2*p1.x) + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
    y: 0.5 * ((2*p1.y) + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
  };
}

class Pista {
  constructor(def) {
    this.def = def;
    this.nome = def.nome;
    this.largura = TRACK_W;
    this.pts = [];
    this.gates = [];
    this.obstaculos = [];
    this.maskCanvas = document.createElement('canvas');
    this.maskCanvas.width = 1500;
    this.maskCanvas.height = 900;
    this.amostrar();
    this.gerarMascara();
    this.gerarGates();
    this.gerarObstaculos();
  }

  amostrar() {
    const ps = this.def.pontos;
    const n = ps.length;
    for (let i = 0; i < n; i++) {
      const p0 = ps[(i - 1 + n) % n];
      const p1 = ps[i];
      const p2 = ps[(i + 1) % n];
      const p3 = ps[(i + 2) % n];
      for (let j = 0; j < 18; j++) this.pts.push(catmullRom(p0, p1, p2, p3, j / 18));
    }
  }

  gerarMascara() {
    const m = this.maskCanvas.getContext('2d');
    m.fillStyle = '#000';
    m.fillRect(0,0,1500,900);
    m.beginPath();
    m.moveTo(this.pts[0].x, this.pts[0].y);
    for (const p of this.pts) m.lineTo(p.x, p.y);
    m.closePath();
    m.strokeStyle = '#fff';
    m.lineWidth = this.largura;
    m.lineJoin = 'round';
    m.lineCap = 'round';
    m.stroke();
    this.mask = m.getImageData(0,0,1500,900).data;
  }

  ehAsfalto(x, y) {
    const xi = Math.round(x), yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= 1500 || yi >= 900) return false;
    return this.mask[(yi * 1500 + xi) * 4] > 128;
  }

  gerarGates() {
    const step = Math.max(1, Math.floor(this.pts.length / 120));
    for (let i = 0; i < this.pts.length; i += step) {
      const a = this.pts[i];
      const b = this.pts[(i + 4) % this.pts.length];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      this.gates.push({ x: a.x, y: a.y, nx: -dy / len, ny: dx / len });
    }
  }

 gerarObstaculos() {
   for (const t of this.def.obstaculosT) {
     const idx = Math.floor(t * this.pts.length) % this.pts.length;
     const a = this.pts[idx];
     const b = this.pts[(idx + 3) % this.pts.length];

     const dx = b.x - a.x;
     const dy = b.y - a.y;

     const len = Math.hypot(dx, dy) || 1;

     const nx = -dy / len;
     const ny = dx / len;

     const r = 13;

     // Obstáculo sempre mais para a direita/lateral da pista
     const lado = 1;

     const off = (this.largura / 2 - r - 4) * lado;

     this.obstaculos.push({
       x: a.x + nx * off,
       y: a.y + ny * off,
       r
     });
   }
 }

  posInicial() {
    const a = this.pts[0], b = this.pts[6];
    return { x: a.x, y: a.y, ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }
}
