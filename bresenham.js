// Рисует отрезок на Canvas через fillRect.
function bresenhamLine(ctx, x0, y0, x1, y1, color = '#000') {
    [x0, y0, x1, y1] = [x0, y0, x1, y1].map(Math.round);
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    ctx.save();
    ctx.fillStyle = color;
    for (;;) {
        ctx.fillRect(x0, y0, 1, 1);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 <  dx) { err += dx; y0 += sy; }
    }
    ctx.restore();
}

// Возвращает массив пикселей [x, y] отрезка.
function bresenhamPixels(x0, y0, x1, y1) {
    [x0, y0, x1, y1] = [x0, y0, x1, y1].map(Math.round);
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    const pixels = [];

    for (;;) {
        pixels.push([x0, y0]);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 <  dx) { err += dx; y0 += sy; }
    }
    return pixels;
}

// Пишет отрезок прямо в ImageData.
function bresenhamLineToImageData(img, x0, y0, x1, y1, rgba = [0, 0, 0, 255]) {
    const { width: w, height: h, data } = img;
    [x0, y0, x1, y1] = [x0, y0, x1, y1].map(Math.round);
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    for (;;) {
        if (x0 >= 0 && y0 >= 0 && x0 < w && y0 < h) {
            const i = (y0 * w + x0) * 4;
            data[i] = rgba[0]; data[i + 1] = rgba[1];
            data[i + 2] = rgba[2]; data[i + 3] = rgba[3];
        }
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 <  dx) { err += dx; y0 += sy; }
    }
}

// Рисует окружность на Canvas (8 симметричных точек).
function bresenhamCircle(ctx, xc, yc, r, color = '#000') {
    [xc, yc, r] = [xc, yc, r].map(Math.round);
    if (r < 0) return;

    ctx.save();
    ctx.fillStyle = color;
    const plot8 = (x, y) => {
        for (const [dx, dy] of [[x,y],[-x,y],[x,-y],[-x,-y],[y,x],[-y,x],[y,-x],[-y,-x]])
            ctx.fillRect(xc + dx, yc + dy, 1, 1);
    };

    for (let x = 0, y = r, d = 3 - 2 * r; x <= y; x++) {
        plot8(x, y);
        if (d < 0) d += 4 * x + 6;
        else { d += 4 * (x - y) + 10; y--; }
    }
    ctx.restore();
}

// Возвращает уникальные пиксели окружности.
function bresenhamCirclePixels(xc, yc, r) {
    [xc, yc, r] = [xc, yc, r].map(Math.round);
    const seen = new Set(), pixels = [];
    const add = (x, y) => {
        const k = x + ',' + y;
        if (!seen.has(k)) { seen.add(k); pixels.push([x, y]); }
    };
    const plot8 = (x, y) => {
        for (const [dx, dy] of [[x,y],[-x,y],[x,-y],[-x,-y],[y,x],[-y,x],[y,-x],[-y,-x]])
            add(xc + dx, yc + dy);
    };

    for (let x = 0, y = r, d = 3 - 2 * r; x <= y; x++) {
        plot8(x, y);
        if (d < 0) d += 4 * x + 6;
        else { d += 4 * (x - y) + 10; y--; }
    }
    return pixels;
}

// Пишет окружность прямо в ImageData.
function bresenhamCircleToImageData(img, xc, yc, r, rgba = [0, 0, 0, 255]) {
    const { width: w, height: h, data } = img;
    [xc, yc, r] = [xc, yc, r].map(Math.round);

    const put = (x, y) => {
        if (x >= 0 && y >= 0 && x < w && y < h) {
            const i = (y * w + x) * 4;
            data[i] = rgba[0]; data[i + 1] = rgba[1];
            data[i + 2] = rgba[2]; data[i + 3] = rgba[3];
        }
    };
    const plot8 = (x, y) => {
        for (const [dx, dy] of [[x,y],[-x,y],[x,-y],[-x,-y],[y,x],[-y,x],[y,-x],[-y,-x]])
            put(xc + dx, yc + dy);
    };

    for (let x = 0, y = r, d = 3 - 2 * r; x <= y; x++) {
        plot8(x, y);
        if (d < 0) d += 4 * x + 6;
        else { d += 4 * (x - y) + 10; y--; }
    }
}