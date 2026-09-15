import { generatePriceCharts } from './chart.js';

const samplePrices = [
  { date: '2026-01-01T08:00:00.000Z', luce: 0.1712, gas: 0.79 },
  { date: '2026-01-15T08:00:00.000Z', luce: 0.1765, gas: 0.82 },
  { date: '2026-02-01T08:00:00.000Z', luce: 0.1698, gas: 0.81 },
  { date: '2026-02-15T08:00:00.000Z', luce: 0.1811, gas: 0.84 },
  { date: '2026-03-01T08:00:00.000Z', luce: 0.1884, gas: 0.87 },
  { date: '2026-03-15T08:00:00.000Z', luce: 0.184, gas: 0.86 },
  { date: '2026-04-01T08:00:00.000Z', luce: 0.1793, gas: 0.83 },
  { date: '2026-04-15T08:00:00.000Z', luce: 0.1902, gas: 0.89 },
  { date: '2026-05-01T08:00:00.000Z', luce: 0.1867, gas: 0.88 },
  { date: '2026-05-15T08:00:00.000Z', luce: 0.1826, gas: 0.85 }
];

const history = samplePrices.map((price) => ({
  luce: {
    materiaPrima: price.luce,
    commercializzazione: 6
  },
  gas: {
    materiaPrima: price.gas,
    commercializzazione: 7
  },
  checkedAt: price.date
}));

const charts = await generatePriceCharts(history);

console.log(`Grafici generati con ${history.length} prezzi di esempio:`);

for (const chart of charts) {
  console.log(chart.pathname);
}