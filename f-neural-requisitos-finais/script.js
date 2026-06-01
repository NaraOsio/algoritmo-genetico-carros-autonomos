const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let mode = 'manual';
let trackIndex = 0;
let pista = new Pista(PISTAS[trackIndex]);
let manualCar = new Carro(pista);
let raceCars = [];

let zoom = 0.8;
let camX = 30;
let camY = 30;
let dragging = false;
let dragStart = null;
let turbo = false;
let last = 0;

const keys = {};

function resize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resize);
resize();

document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
});
document.addEventListener('keyup', e => keys[e.code] = false);

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  zoom = Math.max(0.35, Math.min(3, zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
}, { passive: false });

canvas.addEventListener('mousedown', e => {
  dragging = true;
  dragStart = { x: e.clientX, y: e.clientY, camX, camY };
});
window.addEventListener('mouseup', () => dragging = false);
window.addEventListener('mousemove', e => {
  if (!dragging) return;
  camX = dragStart.camX + e.clientX - dragStart.x;
  camY = dragStart.camY + e.clientY - dragStart.y;
});

function world(x, y) {
  return { x: x * zoom + camX, y: y * zoom + camY };
}

function inputManual() {
  return {
    acelerador: keys.KeyW || keys.ArrowUp,
    frear: keys.KeyS || keys.ArrowDown,
    freioMao: keys.Space,
    esterco: keys.KeyA || keys.ArrowLeft ? 'esq' : keys.KeyD || keys.ArrowRight ? 'dir' : null
  };
}

function setPista(i) {
  trackIndex = i;
  pista = new Pista(PISTAS[i]);
  manualCar = new Carro(pista);
  Treino.pistaAtual = i;
  if (mode === 'train') Treino.iniciar(pista);
  if (mode === 'race') iniciarCorrida();
}

function iniciarCorrida() {
  const save = Treino.carregar();
  const pop = save?.pop || GA.criarPopulacao();
  raceCars = pop.slice(0, GA.TAM_POP).map(r => new Carro(pista, r));
}

function drawPista() {
  ctx.fillStyle = '#176d2a';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.save();
  ctx.translate(camX, camY);
  ctx.scale(zoom, zoom);

  ctx.beginPath();
  ctx.moveTo(pista.pts[0].x, pista.pts[0].y);
  for (const p of pista.pts) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = pista.largura + 10;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(pista.pts[0].x, pista.pts[0].y);
  for (const p of pista.pts) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.strokeStyle = TRACK_COLOR;
  ctx.lineWidth = pista.largura;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  const a = pista.pts[0];
  const b = pista.pts[6];
  const ang = Math.atan2(b.y-a.y,b.x-a.x);
  const nx = -Math.sin(ang), ny = Math.cos(ang);
  const hw = pista.largura / 2;
  for (let i=0;i<10;i++) {
    for (let j=0;j<2;j++) {
      ctx.fillStyle = (i+j)%2===0 ? '#000' : '#fff';
      const t0 = -hw + i * (pista.largura/10);
      ctx.fillRect(a.x + nx*t0 + j*10, a.y + ny*t0, 10, pista.largura/10);
    }
  }

  for (const ob of pista.obstaculos) {
    ctx.beginPath();
    ctx.arc(ob.x, ob.y, ob.r, 0, Math.PI*2);
    ctx.fillStyle = '#111111';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ob.x, ob.y, ob.r*0.45, 0, Math.PI*2);
    ctx.fillStyle = '#ff8a00';
    ctx.fill();
  }

  ctx.restore();
}

function drawCar(c, alpha=1) {
  const p = world(c.x, c.y);
  ctx.save();
  ctx.globalAlpha = c.vivo ? alpha : 0.18;
  ctx.translate(p.x, p.y);
  ctx.rotate(c.ang);
  ctx.scale(zoom, zoom);
  ctx.fillStyle = c.cor;
  ctx.fillRect(-CAR_H/2, -CAR_W/2, CAR_H, CAR_W);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(CAR_H/2-4, -CAR_W/2, 4, CAR_W);
  ctx.restore();
}

function drawSensores(c) {
  if (!c || !c.vivo) return;
  const base = c.ang - Math.PI/2;
  const step = Math.PI/(NUM_SENSORES-1);
  const s0 = world(c.x, c.y);

  for (let i=0;i<NUM_SENSORES;i++) {
    const a = base + i*step;
    const d = c.leituras[i]*SENSOR_DIST;
    const s1 = world(c.x + Math.cos(a)*d, c.y + Math.sin(a)*d);
    const t = c.leituras[i];
    ctx.beginPath();
    ctx.moveTo(s0.x, s0.y);
    ctx.lineTo(s1.x, s1.y);
    ctx.strokeStyle = `rgba(${255*(1-t)},${255*t},0,0.55)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawCheckpoints() {
  ctx.save();
  ctx.translate(camX, camY);
  ctx.scale(zoom, zoom);
  ctx.strokeStyle = 'rgba(0,255,255,0.25)';
  ctx.lineWidth = 1;
  for (const g of pista.gates) {
    ctx.beginPath();
    ctx.moveTo(g.x - g.nx*pista.largura/2, g.y - g.ny*pista.largura/2);
    ctx.lineTo(g.x + g.nx*pista.largura/2, g.y + g.ny*pista.largura/2);
    ctx.stroke();
  }
  ctx.restore();
}

function updateHud(car, vivos = 0, best = 0) {

  document.getElementById('modeLabel').textContent = mode;
  document.getElementById('trackLabel').textContent = pista.nome;

  // =========================
  // MODO CORRIDA
  // =========================
  if (mode === 'race') {

    document.getElementById('genLabel').textContent = '-';
    document.getElementById('aliveLabel').textContent = '1';
    document.getElementById('fitLabel').textContent = 'IA carregada';

  }

  // =========================
  // MODO TREINO
  // =========================
  else {

    document.getElementById('genLabel').textContent = Treino.geracao;
    document.getElementById('aliveLabel').textContent = vivos;
    document.getElementById('fitLabel').textContent = Math.round(best);

  }


  document.getElementById('speedLabel').textContent =
    car ? Math.round(car.vel * 25) : 0;

  document.getElementById('gearLabel').textContent =
    car ? car.marcha : 'N';
}

function loop(ts) {
  const dt = Math.min((ts-last)/16.67, 3) || 1;
  last = ts;
  const steps = turbo && mode === 'train' ? 10 : 1;

  for (let s=0;s<steps;s++) {
    if (mode === 'manual') {
      manualCar.updateManual(dt, inputManual());
      if (!manualCar.vivo) manualCar = new Carro(pista);
    } else if (mode === 'train') {
      const vivos = Treino.update(dt);
      if (vivos === 0) {
        Treino.novaGeracao();
        pista = new Pista(PISTAS[Treino.pistaAtual]);
        Treino.criarCarros(pista);
      }
    } else if (mode === 'race') {
      for (const c of raceCars) if (c.vivo) c.updateIA(dt);
    }
  }

  drawPista();
  drawCheckpoints();

  if (mode === 'manual') {
    drawSensores(manualCar);
    drawCar(manualCar);
    updateHud(manualCar, 1, manualCar.fitness);
  }

if (mode === 'train') {

  let best = Treino.melhorVivo();

  for (const c of Treino.carros) {
    drawCar(c, c.vivo ? 0.55 : 0.12);
  }

  if (best) {
    drawSensores(best);
  }

  const vivos =
    Treino.carros.filter(c => c.vivo).length;

  const fit =
    Math.max(...Treino.fits, 0);

  updateHud(best, vivos, fit);
}

if (mode === 'race') {

  let leader =
    raceCars.find(c => c.vivo);

  if (leader) {

    drawCar(leader, 1);
    drawSensores(leader);

  }

  updateHud(
    leader,
    raceCars.filter(c => c.vivo).length,
    leader ? leader.fitness : 0
  );
}

  requestAnimationFrame(loop);
}

document.querySelectorAll('.mode').forEach(btn => btn.onclick = () => {
  document.querySelectorAll('.mode').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  mode = btn.dataset.mode;
  if (mode === 'manual') manualCar = new Carro(pista);
  if (mode === 'train') Treino.iniciar(pista);
  if (mode === 'race') iniciarCorrida();
});

document.querySelectorAll('.track').forEach(btn => btn.onclick = () => {
  document.querySelectorAll('.track').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  setPista(Number(btn.dataset.track));
});

document.getElementById('turboBtn').onclick = () => {
  turbo = !turbo;
  document.getElementById('turboBtn').textContent = `Turbo: ${turbo ? 'ON' : 'OFF'}`;
};

document.getElementById('saveBtn').onclick = () => { Treino.salvar(); alert('População treinada salva no navegador.'); };

document.getElementById('loadBtn').onclick = () => {
  const save = Treino.carregar();
  if (save) {
    Treino.pop = save.pop;
    Treino.geracao = save.gen;
    Treino.pistaAtual = save.pista;
    setPista(Treino.pistaAtual);
  }
};

document.getElementById('resetBtn').onclick = () => {
  Treino.reset();
  raceCars = [];
  manualCar = new Carro(pista);
  if (mode === 'train') Treino.iniciar(pista);
  alert('Treino resetado. População antiga removida.');
};

requestAnimationFrame(loop);
