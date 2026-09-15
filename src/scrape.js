import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

export const TARIFFE_URL = 'https://octopusenergy.it/offerta/tariffe';

const USER_AGENT = 'Mozilla/5.0 (compatible; OctopusTariffMonitor/1.0; +https://github.com/actions)';

function parseItalianNumber(value) {
  return Number(value.replace(',', '.'));
}

function extractMatch(text, regex, label) {
  const match = text.match(regex);

  if (!match) {
    throw new Error(`Impossibile estrarre ${label}: markup tariffa non riconosciuto`);
  }

  return match;
}

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

export function parseOctopusFissa(html) {
  const $ = load(html);
  const pageText = normalizeText($('body').text());
  const offerTitle = /Octopus\s*Fissa\s*12M/i.exec(pageText);

  if (!offerTitle) {
    throw new Error('Tariffa OctopusFissa 12M non trovata nella pagina');
  }

  const offerStart = offerTitle.index;
  const restText = pageText.slice(offerStart + offerTitle[0].length);
  const nextOfferTitle = /Octopus\s*Flex/i.exec(restText);
  const nextOfferStart = nextOfferTitle ? offerStart + offerTitle[0].length + nextOfferTitle.index : -1;
  const offerText = nextOfferStart === -1
    ? pageText.slice(offerStart)
    : pageText.slice(offerStart, nextOfferStart);

  const luce = extractMatch(
    offerText,
    /Materia prima Luce\s*([0-9]+,[0-9]+)\s*€\/kWh\s*Commercializzazione\s*([0-9]+(?:,[0-9]+)?)\s*€\/mese/i,
    'prezzi luce'
  );

  const gas = extractMatch(
    offerText,
    /Materia prima Gas\s*([0-9]+,[0-9]+)\s*€\/Smc\s*Commercializzazione\s*([0-9]+(?:,[0-9]+)?)\s*€\/mese/i,
    'prezzi gas'
  );

  return {
    luce: {
      materiaPrima: parseItalianNumber(luce[1]),
      commercializzazione: parseItalianNumber(luce[2])
    },
    gas: {
      materiaPrima: parseItalianNumber(gas[1]),
      commercializzazione: parseItalianNumber(gas[2])
    }
  };
}

export async function scrapeOctopusFissa() {
  const response = await fetch(TARIFFE_URL, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml'
    }
  });

  if (!response.ok) {
    throw new Error(`Fetch tariffe fallita: HTTP ${response.status}`);
  }

  const html = await response.text();

  return {
    ...parseOctopusFissa(html),
    checkedAt: new Date().toISOString()
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  scrapeOctopusFissa()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}