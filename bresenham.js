/**
 * Реализация алгоритма Брезенхема для растровой отрисовки отрезков.
 *
 * Алгоритм использует только целочисленную арифметику (сложение,
 * вычитание, сравнение), поэтому работает быстро и точно.
 *
 * Поддерживает все 8 октантов — любое направление отрезка.
 */

/**
 * Рисует отрезок от (x0, y0) до (x1, y1) с помощью алгоритма Брезенхема.
 *
 * @param {CanvasRenderingContext2D} ctx   Контекст рисования Canvas 2D.
 * @param {number} x0                      Начальная координата X.
 * @param {number} y0                      Начальная координата Y.
 * @param {number} x1                      Конечная координата X.
 * @param {number} y1                      Конечная координата Y.
 * @param {string} [color='#000000']       Цвет линии в любом формате CSS.
 */
function bresenhamLine(ctx, x0, y0, x1, y1, color = '#000000') {
    // Приводим координаты к целым числам
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);

    // Разности по осям (по модулю)
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);

    // Направление шага: +1 или -1
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;

    // Накопленная ошибка
    let err = dx - dy;

    // Сохраняем текущие настройки контекста и задаём цвет
    ctx.save();
    ctx.fillStyle = color;

    while (true) {
        // Рисуем текущий пиксель
        ctx.fillRect(x0, y0, 1, 1);

        // Достигли конечной точки — выходим
        if (x0 === x1 && y0 === y1) break;

        const e2 = 2 * err;

        // Шаг по X
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }

        // Шаг по Y
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }

    ctx.restore();
}

/**
 * Возвращает массив пикселей [x, y], которые нужно закрасить,
 * чтобы построить отрезок алгоритмом Брезенхема.
 *
 * Полезно, если нужно проанализировать работу алгоритма
 * (например, посчитать количество пикселей, построить статистику
 * или отрисовать пиксели другим способом).
 *
 * @param {number} x0  Начальная координата X.
 * @param {number} y0  Начальная координата Y.
 * @param {number} x1  Конечная координата X.
 * @param {number} y1  Конечная координата Y.
 * @returns {Array<[number, number]>} Массив пар [x, y].
 */
function bresenhamPixels(x0, y0, x1, y1) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    const pixels = [];

    while (true) {
        pixels.push([x0, y0]);
        if (x0 === x1 && y0 === y1) break;

        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 <  dx) { err += dx; y0 += sy; }
    }

    return pixels;
}

/**
 * Рисует отрезок напрямую в объект ImageData.
 *
 * Использовать, когда нужно нарисовать много отрезков или
 * когда важна максимальная скорость (fillRect для одиночных
 * пикселей медленнее, чем запись в ImageData).
 *
 * Пример использования:
 *
 *     const img = ctx.createImageData(canvas.width, canvas.height);
 *     bresenhamLineToImageData(img, 10, 10, 300, 200, [255, 0, 0, 255]);
 *     ctx.putImageData(img, 0, 0);
 *
 * @param {ImageData} imageData       Объект ImageData.
 * @param {number} x0                 Начальная X.
 * @param {number} y0                 Начальная Y.
 * @param {number} x1                 Конечная X.
 * @param {number} y1                 Конечная Y.
 * @param {number[]} [rgba=[0,0,0,255]] Массив из 4 чисел: R, G, B, A (0..255).
 */
function bresenhamLineToImageData(imageData, x0, y0, x1, y1, rgba = [0, 0, 0, 255]) {
    const { width, height, data } = imageData;
    const [r, g, b, a] = rgba;

    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
        // Проверяем границы, чтобы не выйти за пределы буфера
        if (x0 >= 0 && y0 >= 0 && x0 < width && y0 < height) {
            const i = (y0 * width + x0) * 4;
            data[i]     = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = a;
        }

        if (x0 === x1 && y0 === y1) break;

        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 <  dx) { err += dx; y0 += sy; }
    }
}

    /**
 * Рисует окружность по алгоритму Брезенхема.
 *
 * Использует симметрию: вычисляется только 1/8 окружности,
 * остальные точки получаются отражением.
 *
 * @param {CanvasRenderingContext2D} ctx  Контекст рисования Canvas 2D.
 * @param {number} xc                     Координата X центра.
 * @param {number} yc                     Координата Y центра.
 * @param {number} r                      Радиус (целое число ≥ 0).
 * @param {string} [color='#000000']      Цвет линии.
 */
function bresenhamCircle(ctx, xc, yc, r, color = '#000000') {
    xc = Math.round(xc);
    yc = Math.round(yc);
    r  = Math.round(r);

    if (r < 0) return;

    ctx.save();
    ctx.fillStyle = color;

    // Вспомогательная функция: рисует 8 симметричных точек
    const plot8 = (x, y) => {
        ctx.fillRect(xc + x, yc + y, 1, 1);
        ctx.fillRect(xc - x, yc + y, 1, 1);
        ctx.fillRect(xc + x, yc - y, 1, 1);
        ctx.fillRect(xc - x, yc - y, 1, 1);
        ctx.fillRect(xc + y, yc + x, 1, 1);
        ctx.fillRect(xc - y, yc + x, 1, 1);
        ctx.fillRect(xc + y, yc - x, 1, 1);
        ctx.fillRect(xc - y, yc - x, 1, 1);
    };

    let x = 0;
    let y = r;
    let d = 3 - 2 * r;

    while (x <= y) {
        plot8(x, y);

        if (d < 0) {
            d += 4 * x + 6;
        } else {
            d += 4 * (x - y) + 10;
            y -= 1;
        }
        x += 1;
    }

    ctx.restore();
}

/**
 * Возвращает массив пикселей [x, y] окружности Брезенхема.
 * Полезно для статистики или рисования нестандартным способом.
 *
 * @param {number} xc  Координата X центра.
 * @param {number} yc  Координата Y центра.
 * @param {number} r   Радиус.
 * @returns {Array<[number, number]>} Массив уникальных пикселей.
 */
function bresenhamCirclePixels(xc, yc, r) {
    xc = Math.round(xc);
    yc = Math.round(yc);
    r  = Math.round(r);

    const seen = new Set();
    const pixels = [];

    const add = (x, y) => {
        const key = x + ',' + y;
        if (!seen.has(key)) {
            seen.add(key);
            pixels.push([x, y]);
        }
    };

    const plot8 = (x, y) => {
        add(xc + x, yc + y);
        add(xc - x, yc + y);
        add(xc + x, yc - y);
        add(xc - x, yc - y);
        add(xc + y, yc + x);
        add(xc - y, yc + x);
        add(xc + y, yc - x);
        add(xc - y, yc - x);
    };

    let x = 0;
    let y = r;
    let d = 3 - 2 * r;

    while (x <= y) {
        plot8(x, y);
        if (d < 0) {
            d += 4 * x + 6;
        } else {
            d += 4 * (x - y) + 10;
            y -= 1;
        }
        x += 1;
    }

    return pixels;
}

/**
 * Рисует окружность Брезенхема напрямую в ImageData.
 *
 * @param {ImageData} imageData         Объект ImageData.
 * @param {number} xc                   Координата X центра.
 * @param {number} yc                   Координата Y центра.
 * @param {number} r                    Радиус.
 * @param {number[]} [rgba=[0,0,0,255]] Цвет в формате [R, G, B, A].
 */
function bresenhamCircleToImageData(imageData, xc, yc, r, rgba = [0, 0, 0, 255]) {
    const { width, height, data } = imageData;
    const [rr, gg, bb, aa] = rgba;

    xc = Math.round(xc);
    yc = Math.round(yc);
    r  = Math.round(r);

    const put = (x, y) => {
        if (x >= 0 && y >= 0 && x < width && y < height) {
            const i = (y * width + x) * 4;
            data[i]     = rr;
            data[i + 1] = gg;
            data[i + 2] = bb;
            data[i + 3] = aa;
        }
    };

    const plot8 = (x, y) => {
        put(xc + x, yc + y);
        put(xc - x, yc + y);
        put(xc + x, yc - y);
        put(xc - x, yc - y);
        put(xc + y, yc + x);
        put(xc - y, yc + x);
        put(xc + y, yc - x);
        put(xc - y, yc - x);
    };

    let x = 0;
    let y = r;
    let d = 3 - 2 * r;

    while (x <= y) {
        plot8(x, y);
        if (d < 0) {
            d += 4 * x + 6;
        } else {
            d += 4 * (x - y) + 10;
            y -= 1;
        }
        x += 1;
    }
}
