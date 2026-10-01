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