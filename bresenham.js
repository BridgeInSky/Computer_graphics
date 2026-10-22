const W = 400;
const H = 300;

const COLORS = {
  black: [0, 0, 0],       white: [255, 255, 255],
  red: [255, 0, 0],       orange: [255, 165, 0],
  yellow: [255, 255, 0],  green: [0, 200, 0],
  cyan: [0, 255, 255],    blue: [0, 0, 255],
  magenta: [255, 0, 255], pink: [255, 192, 203],
  lime: [0, 255, 0],      violet: [238, 130, 238],
  brown: [165, 42, 42],   indigo: [75, 0, 130],
  salmon: [250, 128, 114],turquoise: [64, 224, 208],
  lavender: [230, 230, 250], coral: [255, 127, 80],
  darkred: [139, 0, 0],   crimson: [220, 20, 60],
  aquamarine: [127, 255, 212], chartreuse: [127, 255, 0],
  tomato: [255, 99, 71],  darkseagreen: [143, 188, 143],
  gray: [128, 128, 128],
};

function color(name) {
  return COLORS[name] || [255, 255, 255];
}

class PixelCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) throw new Error('Canvas не найден: ' + canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.imageData = this.ctx.createImageData(W, H);
    this.pixels = this.imageData.data;
    this.clear();
  }
  clear() {
    for (let i = 0; i < this.pixels.length; i += 4) {
      this.pixels[i] = 0; this.pixels[i + 1] = 0;
      this.pixels[i + 2] = 0; this.pixels[i + 3] = 255;
    }
  }
  setPixel(x, y, r, g, b) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 4;
    this.pixels[i] = r; this.pixels[i + 1] = g;
    this.pixels[i + 2] = b; this.pixels[i + 3] = 255;
  }
  setColor(x, y, name) {
    const [r, g, b] = color(name);
    this.setPixel(x, y, r, g, b);
  }
  getPixel(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= H) return [0, 0, 0];
    const i = (y * W + x) * 4;
    return [this.pixels[i], this.pixels[i + 1], this.pixels[i + 2]];
  }
  flush() {
    this.ctx.putImageData(this.imageData, 0, 0);
  }
}

function normal(v) { return [-v[1], v[0]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }

function pointType(v, vpoly) {
  const f = dot(v, normal(vpoly));
  if (f < 0) return 'in';
  if (f > 0) return 'out';
  return 'parallel';
}

function intersection(xa, ya, xp1, yp1, v, vpoly) {
  return -(-(xa - xp1) * vpoly[1] + (ya - yp1) * vpoly[0]) / dot(v, normal(vpoly));
}

function line(pc, xa, ya, xb, yb, colour = 'white') {
  const [r, g, b] = color(colour);

  xa = Math.round(xa); ya = Math.round(ya);
  xb = Math.round(xb); yb = Math.round(yb);

  let changeAxis = 0;
  if (Math.abs(yb - ya) > Math.abs(xb - xa)) {
    [xa, ya] = [ya, xa]; [xb, yb] = [yb, xb];
    changeAxis = 1;
  }
  if (xa > xb) {
    [xa, xb] = [xb, xa]; [ya, yb] = [yb, ya];
  }

  let x = xa, y = ya, dy = 0;
  const m = yb > ya ? 1 : -1;
  const dx = Math.abs(xb - xa);
  const dyAbs = Math.abs(yb - ya);

  let safety = Math.max(W, H) * 2;

  while (true) {
    if (changeAxis) pc.setPixel(y, x, r, g, b);
    else pc.setPixel(x, y, r, g, b);

    if (x === xb && y === yb) break;
    if (--safety < 0) {
      console.warn('line: превышен лимит итераций', {xa, ya, xb, yb});
      break;
    }

    dy += 2 * dyAbs;
    if (dy >= dx) { y += m; dy -= 2 * dx; }
    x += 1;
  }
}

function circle(pc, cx, cy, R, colour = 'white') {
  R = Math.abs(Math.round(R));
  if (R < 1) return;
  cx = Math.round(cx); cy = Math.round(cy);

  const [r, g, b] = color(colour);
  let x = -R, y = 0, f = 3 - 2 * R;
  let safety = R * 4 + 10;

  while (y < Math.abs(x) && safety-- > 0) {
    const pts = [
      [x + cx, y + cy], [-x + cx, y + cy],
      [x + cx, -y + cy], [-x + cx, -y + cy],
      [y + cx, x + cy], [-y + cx, x + cy],
      [y + cx, -x + cy], [-y + cx, -x + cy],
    ];
    for (const [px, py] of pts) pc.setPixel(px, py, r, g, b);

    if (f < 0) f += 4 * y + 6;
    else { f += 4 * (x + y) + 10; x += 1; }
    y += 1;
  }
}

function poly(pc, polygon, colour = 'white') {
  const n = polygon.length;
  for (let p = 0; p < n; p++) {
    const [x1, y1] = polygon[p];
    const [x2, y2] = polygon[(p + 1) % n];
    line(pc, x1, y1, x2, y2, colour);
  }
}

function cut(pc, xa, ya, xb, yb, polygon, colour = 'white') {
  const v = [xb - xa, yb - ya];
  const inP = [], outP = [];
  const n = polygon.length;

  for (let p = 0; p < n; p++) {
    const xp1 = polygon[p][0], yp1 = polygon[p][1];
    const vp = [
      polygon[(p + 1) % n][0] - xp1,
      polygon[(p + 1) % n][1] - yp1,
    ];
    const t = pointType(v, vp);
    if (t === 'in') inP.push(intersection(xa, ya, xp1, yp1, v, vp));
    else if (t === 'out') outP.push(intersection(xa, ya, xp1, yp1, v, vp));
  }

  if (inP.length === 0) return;
  if (outP.length === 0) { line(pc, xa, ya, xb, yb, colour); return; }

  let start = Math.min(...inP);
  let finish = Math.max(...outP);

  if (!(start < 0 && finish > 1)) {
    start = Math.min(1, Math.max(0, start));
    finish = Math.max(0, Math.min(1, finish));

    const x1 = Math.round(start * (xb - xa) + xa);
    const y1 = Math.round(start * (yb - ya) + ya);
    const x2 = Math.round(finish * (xb - xa) + xa);
    const y2 = Math.round(finish * (yb - ya) + ya);
    line(pc, x1, y1, x2, y2, colour);
  }
}

function floodFill(pc, xs, ys, borderColour, colour = 'white') {
  const [br, bg, bb] = color(borderColour);
  const [fr, fg, fb] = color(colour);
  const stack = [[Math.round(xs), Math.round(ys)]];
  let safety = W * H * 4;

  while (stack.length > 0 && safety-- > 0) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= W || y < 0 || y >= H) continue;
    const [pr, pg, pb] = pc.getPixel(x, y);
    if (pr === br && pg === bg && pb === bb) continue;
    if (pr === fr && pg === fg && pb === fb) continue;
    pc.setPixel(x, y, fr, fg, fb);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

function scanlineFill(pc, polygon, colour = 'white') {
  const [r, g, b] = color(colour);
  const n = polygon.length;
  const ys = polygon.map(p => p[1]);
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(...ys)));

  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < n; i++) {
      const [x1, y1] = polygon[i];
      const [x2, y2] = polygon[(i + 1) % n];
      if (y1 === y2) continue;
      if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
        xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i < xs.length - 1; i += 2) {
      const xS = Math.round(xs[i]);
      const xE = Math.round(xs[i + 1]);
      for (let x = xS; x <= xE; x++) pc.setPixel(x, y, r, g, b);
    }
  }
}

const canvases = {};
const DEFAULT_PENTAGON = [[200, 50], [320, 120], [270, 250], [120, 250], [80, 120]];

function num(id, def = 0) {
  const el = document.getElementById(id);
  if (!el) return def;
  const v = parseFloat(el.value);
  return isNaN(v) ? def : v;
}
function str(id, def = '') {
  const el = document.getElementById(id);
  return el ? el.value : def;
}

function drawLines() {
  const pc = canvases.c1;
  if (!pc) return;
  pc.clear();
  const cx = num('line-cx', 200);
  const cy = num('line-cy', 150);
  const step = Math.max(1, Math.min(180, num('line-step', 22.5)));
  const len = Math.max(1, Math.min(400, num('line-len', 150)));
  const colour = str('line-color', 'white');
  const count = Math.round(360 / step);
  for (let i = 0; i < count; i++) {
    const a = (i * step) * Math.PI / 180;
    line(pc, cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len, colour);
  }
  pc.flush();
}

function drawCircle() {
  const pc = canvases.c2;
  if (!pc) return;
  pc.clear();
  const R = Math.abs(num('circle-r', 100));
  circle(pc, num('circle-cx', 200), num('circle-cy', 150), R,
         str('circle-color', 'coral'));
  pc.flush();
}

function drawPoly() {
  const pc = canvases.c3;
  if (!pc) return;
  pc.clear();
  poly(pc, DEFAULT_PENTAGON, str('poly-color', 'coral'));
  pc.flush();
}

function drawCut() {
  const pc = canvases.c4;
  if (!pc) return;
  pc.clear();
  poly(pc, DEFAULT_PENTAGON, 'gray');
  const segs = [
    [num('cut-xa1', 150), num('cut-ya1', 20), num('cut-xb1', 250), num('cut-yb1', 20), 'darkred'],
    [num('cut-xa2', 180), num('cut-ya2', 150), num('cut-xb2', 220), num('cut-yb2', 180), 'crimson'],
    [num('cut-xa3', 20), num('cut-ya3', 180), num('cut-xb3', 380), num('cut-yb3', 180), 'aquamarine'],
    [num('cut-xa4', 20), num('cut-ya4', 180), num('cut-xb4', 200), num('cut-yb4', 160), 'chartreuse'],
    [num('cut-xa5', 200), num('cut-ya5', 160), num('cut-xb5', 380), num('cut-yb5', 180), 'tomato'],
  ];
  for (const [xa, ya, xb, yb, c] of segs) {
    line(pc, xa, ya, xb, yb, 'gray');
    cut(pc, xa, ya, xb, yb, DEFAULT_PENTAGON, c);
  }
  pc.flush();
}

function drawFlood() {
  const pc = canvases.c5;
  if (!pc) return;
  pc.clear();
  const cx = num('flood-cx', 200);
  const cy = num('flood-cy', 150);
  const R = Math.abs(num('flood-r', 100));
  const border = str('flood-border', 'coral');
  const fill = str('flood-fill', 'darkseagreen');
  const sx = num('flood-sx', cx);
  const sy = num('flood-sy', cy);

  circle(pc, cx, cy, R, border);
  if (border !== fill) {
    floodFill(pc, sx, sy, border, fill);
  }
  pc.flush();
}

function drawScanline() {
  const pc = canvases.c6;
  if (!pc) return;
  pc.clear();
  scanlineFill(pc, DEFAULT_PENTAGON, str('scan-fill', 'darkseagreen'));
  poly(pc, DEFAULT_PENTAGON, str('scan-stroke', 'coral'));
  pc.flush();
}

function drawStar() {
  const pc = canvases.c7;
  if (!pc) return;
  pc.clear();
  const cx = num('star-cx', 200);
  const cy = num('star-cy', 150);
  const rays = Math.max(3, Math.min(64, Math.round(num('star-rays', 16))));
  const R = Math.max(1, Math.min(400, num('star-r', 150)));
  const palette = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue',
                   'magenta', 'pink', 'lime', 'violet', 'brown', 'white',
                   'indigo', 'salmon', 'turquoise', 'lavender'];
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * 2 * Math.PI;
    line(pc, cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R,
         palette[i % palette.length]);
  }
  pc.flush();
}

function drawComposition() {
  const pc = canvases.c8;
  if (!pc) return;
  pc.clear();
  scanlineFill(pc, DEFAULT_PENTAGON, 'darkseagreen');
  poly(pc, DEFAULT_PENTAGON, 'coral');
  const segs = [
    [150, 20, 250, 20, 'darkred'],
    [180, 150, 220, 180, 'crimson'],
    [20, 180, 380, 180, 'aquamarine'],
    [20, 180, 200, 160, 'chartreuse'],
    [200, 160, 380, 180, 'tomato'],
  ];
  for (const [xa, ya, xb, yb, c] of segs) {
    cut(pc, xa, ya, xb, yb, DEFAULT_PENTAGON, c);
  }
  pc.flush();
}

function drawAll() {
  drawLines(); drawCircle(); drawPoly(); drawCut();
  drawFlood(); drawScanline(); drawStar(); drawComposition();
}

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded — инициализация');

  ['c1','c2','c3','c4','c5','c6','c7','c8'].forEach(id => {
    canvases[id] = new PixelCanvas(id);
  });

  Object.assign(window, {
    drawLines, drawCircle, drawPoly, drawCut,
    drawFlood, drawScanline, drawStar, drawComposition, drawAll,
  });

  document.querySelectorAll('[data-redraw]').forEach(btn => {
    btn.addEventListener('click', () => {
      const fn = btn.getAttribute('data-redraw');
      if (typeof window[fn] === 'function') window[fn]();
    });
  });

  const allBtn = document.getElementById('redraw-all');
  if (allBtn) allBtn.addEventListener('click', drawAll);

  drawAll();
  console.log('Все демо отрисованы');
});