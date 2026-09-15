import { readFile, writeFile } from 'node:fs/promises';
import { generatePriceCharts } from './chart.js';
import { scrapeOctopusFissa, TARIFFE_URL } from './scrape.js';
import { sendTelegramMessage, sendTelegramPhoto } from './telegram.js';

const stateUrl = new URL('../state.json', import.meta.url);
const historyUrl = new URL('../history.json', import.meta.url);
const watchedFields = [
  ['luce', 'materiaPrima'],
  ['luce', 'commercializzazione'],
  ['gas', 'materiaPrima'],
  ['gas', 'commercializzazione']
];

async function readState() {
  return readJson(stateUrl, {});
}

async function readHistory() {
  return readJson(historyUrl, []);
}

async function readJson(fileUrl, fallback) {
  try {
    return JSON.parse(await readFile(fileUrl, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallback;
    }

    throw error;
  }
}

function hasPreviousPrices(state) {
  return watchedFields.every(([section, field]) => typeof state?.[section]?.[field] === 'number');
}

function hasPriceChanges(previous, current) {
  if (!hasPreviousPrices(previous)) {
    return true;
  }

  return watchedFields.some(([section, field]) => previous[section][field] !== current[section][field]);
}

function appendHistory(history, current) {
  const previousEntry = history.at(-1);

  if (previousEntry && !hasPriceChanges(previousEntry, current)) {
    return history;
  }

  return [...history, current];
}

function formatEuro(value, unit) {
  return `${value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} €/${unit}`;
}

function formatOldNew(previous, current, section, field, unit) {
  const oldValue = previous?.[section]?.[field];
  const oldText = typeof oldValue === 'number' ? formatEuro(oldValue, unit) : 'non presente';

  return `${oldText} -> ${formatEuro(current[section][field], unit)}`;
}

function formatCurrent(current, section, field, unit) {
  return formatEuro(current[section][field], unit);
}

function buildMessage(previous, current) {
  if (!hasPreviousPrices(previous)) {
    return [
      '<b>Primo controllo tariffa OctopusFissa 12M</b>',
      '',
      `Luce materia prima: ${formatCurrent(current, 'luce', 'materiaPrima', 'kWh')}`,
      `Luce commercializzazione: ${formatCurrent(current, 'luce', 'commercializzazione', 'mese')}`,
      `Gas materia prima: ${formatCurrent(current, 'gas', 'materiaPrima', 'Smc')}`,
      `Gas commercializzazione: ${formatCurrent(current, 'gas', 'commercializzazione', 'mese')}`,
      '',
      `Controllato: ${new Date(current.checkedAt).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}`,
      TARIFFE_URL
    ].join('\n');
  }

  const title = hasPreviousPrices(previous)
    ? 'Variazione tariffa OctopusFissa 12M'
    : 'Primo controllo tariffa OctopusFissa 12M';

  return [
    `<b>${title}</b>`,
    '',
    `Luce materia prima: ${formatOldNew(previous, current, 'luce', 'materiaPrima', 'kWh')}`,
    `Luce commercializzazione: ${formatOldNew(previous, current, 'luce', 'commercializzazione', 'mese')}`,
    `Gas materia prima: ${formatOldNew(previous, current, 'gas', 'materiaPrima', 'Smc')}`,
    `Gas commercializzazione: ${formatOldNew(previous, current, 'gas', 'commercializzazione', 'mese')}`,
    '',
    `Controllato: ${new Date(current.checkedAt).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}`,
    TARIFFE_URL
  ].join('\n');
}

async function notify(text) {
  if (process.env.DRY_RUN === 'true') {
    console.log(`[DRY_RUN] Messaggio Telegram:\n${text}`);
    return;
  }

  await sendTelegramMessage(text);
}

async function notifyCharts(chartUrls) {
  if (process.env.DRY_RUN === 'true') {
    console.log(`[DRY_RUN] Grafici generati:\n${chartUrls.map((url) => url.pathname).join('\n')}`);
    return;
  }

  await sendTelegramPhoto(chartUrls[0], 'Andamento prezzo luce');
  await sendTelegramPhoto(chartUrls[1], 'Andamento prezzo gas');
}

async function main() {
  const previous = await readState();
  const history = await readHistory();
  let current;

  try {
    current = await scrapeOctopusFissa();
  } catch (error) {
    const warning = `<b>Errore monitor tariffa OctopusFissa 12M</b>\n\n${error.message}\n${TARIFFE_URL}`;

    if (process.env.DRY_RUN === 'true' || (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)) {
      await notify(warning);
    }

    throw error;
  }

  if (!hasPriceChanges(previous, current)) {
    console.log('Nessuna variazione tariffaria rilevata.');
    return;
  }

  const updatedHistory = appendHistory(history, current);
  const chartUrls = await generatePriceCharts(updatedHistory);

  await notify(buildMessage(previous, current));
  await notifyCharts(chartUrls);
  await writeFile(stateUrl, `${JSON.stringify(current, null, 2)}\n`);
  await writeFile(historyUrl, `${JSON.stringify(updatedHistory, null, 2)}\n`);
  console.log(process.env.DRY_RUN === 'true'
    ? 'Variazione rilevata e notifica Telegram simulata.'
    : 'Variazione rilevata e notifica Telegram inviata.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});