import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import pngjs from 'pngjs';

const { PNG } = pngjs;
const chartDirectory = new URL('../.tmp/charts/', import.meta.url);

const width = 1200;
const height = 720;
const padding = { top: 132, right: 88, bottom: 124, left: 148 };
const palette = {
  background: [243, 247, 251],
  panel: [255, 255, 255],
  grid: [224, 230, 238],
  axis: [95, 111, 132],
  text: [20, 33, 61],
  muted: [96, 112, 133],
  positive: [180, 35, 24],
  negative: [6, 118, 71],
  luce: [245, 158, 11],
  gas: [2, 132, 199],
  white: [255, 255, 255]
};

const font = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '00000', '01100', '01000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000']
};

function pointValue(entry, section) {
  return entry?.[section]?.materiaPrima;
}

function setPixel(image, x, y, color) {
  const roundedX = Math.round(x);
  const roundedY = Math.round(y);

  if (roundedX < 0 || roundedY < 0 || roundedX >= width || roundedY >= height) {
    return;
  }

  const index = (roundedY * width + roundedX) * 4;

  image.data[index] = color[0];
  image.data[index + 1] = color[1];
  image.data[index + 2] = color[2];
  image.data[index + 3] = 255;
}

function fill(image, color) {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      setPixel(image, x, y, color);
    }
  }
}

function drawRect(image, x, y, rectWidth, rectHeight, color) {
  for (let row = y; row < y + rectHeight; row += 1) {
    for (let column = x; column < x + rectWidth; column += 1) {
      setPixel(image, column, row, color);
    }
  }
}

function measureText(text, scale) {
  return String(text).length * 6 * scale - scale;
}

function drawText(image, text, x, y, scale, color, align = 'left') {
  const normalized = String(text).toUpperCase();
  let currentX = align === 'right' ? x - measureText(normalized, scale) : x;

  if (align === 'center') {
    currentX = x - measureText(normalized, scale) / 2;
  }

  for (const character of normalized) {
    const glyph = font[character] ?? font[' '];

    glyph.forEach((row, rowIndex) => {
      for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
        if (row[columnIndex] === '1') {
          drawRect(
            image,
            currentX + columnIndex * scale,
            y + rowIndex * scale,
            scale,
            scale,
            color
          );
        }
      }
    });

    currentX += 6 * scale;
  }
}

function formatDecimal(value, digits = 4) {
  return value.toLocaleString('it-IT', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function formatDate(value) {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Rome'
  }).format(new Date(value));
}

function drawCircle(image, centerX, centerY, radius, color) {
  for (let y = centerY - radius; y <= centerY + radius; y += 1) {
    for (let x = centerX - radius; x <= centerX + radius; x += 1) {
      if ((x - centerX) ** 2 + (y - centerY) ** 2 <= radius ** 2) {
        setPixel(image, x, y, color);
      }
    }
  }
}

function drawLine(image, fromX, fromY, toX, toY, color, thickness = 1) {
  const steps = Math.max(Math.abs(toX - fromX), Math.abs(toY - fromY));

  if (steps === 0) {
    drawCircle(image, fromX, fromY, Math.ceil(thickness / 2), color);
    return;
  }

  for (let step = 0; step <= steps; step += 1) {
    const ratio = step / steps;
    const x = fromX + (toX - fromX) * ratio;
    const y = fromY + (toY - fromY) * ratio;

    drawCircle(image, x, y, Math.floor(thickness / 2), color);
  }
}

function drawChart(history, section, config) {
  const image = new PNG({ width, height });
  const color = palette[section];
  const points = history
    .filter((entry) => typeof pointValue(entry, section) === 'number' && entry.checkedAt)
    .map((entry) => ({ value: pointValue(entry, section), checkedAt: entry.checkedAt }));

  if (points.length === 0) {
    throw new Error(`Nessun dato storico disponibile per ${section}`);
  }

  fill(image, palette.background);
  drawRect(image, 34, 30, width - 68, height - 60, palette.panel);

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || Math.max(max * 0.1, 0.01);
  const yMin = Math.max(0, min - range * 0.18);
  const yMax = max + range * 0.18;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xFor = (index) => padding.left + (points.length === 1 ? plotWidth / 2 : (plotWidth * index) / (points.length - 1));
  const yFor = (value) => padding.top + plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight;
  const chartPoints = points.map((point, index) => ({ x: xFor(index), y: yFor(point.value) }));
  const current = points.at(-1);
  const previous = points.at(-2);
  const delta = previous ? current.value - previous.value : 0;
  const deltaColor = delta > 0 ? palette.positive : delta < 0 ? palette.negative : palette.muted;

  drawText(image, config.title, padding.left, 44, 5, palette.text);
  drawText(image, `ASSE Y EUR/${config.unit} - ASSE X DATA`, padding.left, 90, 3, palette.muted);
  drawText(image, `ATTUALE ${formatDecimal(current.value)} EUR/${config.unit}`, width - padding.right, 44, 3, palette.text, 'right');
  drawText(image, `${delta >= 0 ? '+' : ''}${formatDecimal(delta)} DAL PRECEDENTE`, width - padding.right, 78, 2, deltaColor, 'right');

  for (let index = 0; index <= 4; index += 1) {
    const y = padding.top + (plotHeight * index) / 4;
    const value = yMax - ((yMax - yMin) * index) / 4;

    drawLine(image, padding.left, y, width - padding.right, y, palette.grid, 2);
    drawText(image, formatDecimal(value), padding.left - 18, y - 9, 2, palette.muted, 'right');
  }

  drawLine(image, padding.left, padding.top, padding.left, height - padding.bottom, palette.axis, 4);
  drawLine(image, padding.left, height - padding.bottom, width - padding.right, height - padding.bottom, palette.axis, 4);

  if (chartPoints.length === 1) {
    drawCircle(image, chartPoints[0].x, chartPoints[0].y, 15, color);
    drawCircle(image, chartPoints[0].x, chartPoints[0].y, 7, palette.white);
  } else {
    for (let index = 1; index < chartPoints.length; index += 1) {
      drawLine(
        image,
        chartPoints[index - 1].x,
        chartPoints[index - 1].y,
        chartPoints[index].x,
        chartPoints[index].y,
        color,
        8
      );
    }

    for (const point of chartPoints) {
      drawCircle(image, point.x, point.y, 11, palette.white);
      drawCircle(image, point.x, point.y, 7, color);
    }
  }

  const latest = chartPoints.at(-1);

  drawCircle(image, latest.x, latest.y, 18, color);
  drawCircle(image, latest.x, latest.y, 9, palette.white);
  drawText(image, formatDecimal(current.value), latest.x, Math.max(padding.top - 32, latest.y - 42), 2, palette.text, 'center');

  for (let index = 0; index < points.length; index += 1) {
    const x = xFor(index);

    drawLine(image, x, height - padding.bottom, x, height - padding.bottom + 12, palette.axis, 3);
    drawText(image, formatDate(points[index].checkedAt), x, height - padding.bottom + 26, 2, palette.muted, 'center');
  }

  drawText(image, 'DATA RILEVAZIONE', padding.left + plotWidth / 2, height - 42, 2, palette.muted, 'center');

  return PNG.sync.write(image);
}

async function renderChart(history, section, filename) {
  await mkdir(chartDirectory, { recursive: true });

  const outputUrl = new URL(filename, chartDirectory);
  const config = section === 'luce'
    ? { title: 'ANDAMENTO LUCE', unit: 'KWH' }
    : { title: 'ANDAMENTO GAS', unit: 'SMC' };
  const buffer = drawChart(history, section, config);

  await writeFile(fileURLToPath(outputUrl), buffer);

  return outputUrl;
}

export async function generatePriceCharts(history) {
  return [
    await renderChart(history, 'luce', 'luce.png'),
    await renderChart(history, 'gas', 'gas.png')
  ];
}