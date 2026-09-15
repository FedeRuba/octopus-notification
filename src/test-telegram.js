import { readFile } from 'node:fs/promises';
import { generatePriceCharts } from './chart.js';
import { scrapeOctopusFissa, TARIFFE_URL } from './scrape.js';
import { sendTelegramMessage, sendTelegramPhoto } from './telegram.js';

const historyUrl = new URL('../history.json', import.meta.url);

async function readHistory() {
  try {
    return JSON.parse(await readFile(historyUrl, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

function formatEuro(value, unit) {
  return `${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} €/${unit}`;
}

async function main() {
  const current = await scrapeOctopusFissa();
  const history = await readHistory();
  const chartHistory = history.length > 0 ? history : [current];
  const charts = await generatePriceCharts(chartHistory);

  await sendTelegramMessage([
    '<b>Test monitor OctopusFissa 12M</b>',
    '',
    `Luce materia prima: ${formatEuro(current.luce.materiaPrima, 'kWh')}`,
    `Luce commercializzazione: ${formatEuro(current.luce.commercializzazione, 'mese')}`,
    `Gas materia prima: ${formatEuro(current.gas.materiaPrima, 'Smc')}`,
    `Gas commercializzazione: ${formatEuro(current.gas.commercializzazione, 'mese')}`,
    '',
    `Controllato: ${new Date(current.checkedAt).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}`,
    TARIFFE_URL
  ].join('\n'));

  await sendTelegramPhoto(charts[0], 'Test andamento prezzo luce');
  await sendTelegramPhoto(charts[1], 'Test andamento prezzo gas');
  console.log('Messaggio di test Telegram inviato.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});