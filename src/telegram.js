import { readFile } from 'node:fs/promises';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

function getTelegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error('Configura TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID nelle variabili ambiente');
  }

  return { token, chatId };
}

export async function sendTelegramMessage(text) {
  const { token, chatId } = getTelegramConfig();

  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Invio Telegram fallito: HTTP ${response.status} ${body}`);
  }
}

export async function sendTelegramPhoto(fileUrl, caption) {
  const { token, chatId } = getTelegramConfig();
  const formData = new FormData();
  const image = await readFile(fileUrl);

  formData.append('chat_id', chatId);
  formData.append('photo', new Blob([image], { type: 'image/png' }), fileUrl.pathname.split('/').at(-1));

  if (caption) {
    formData.append('caption', caption);
  }

  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendPhoto`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Invio grafico Telegram fallito: HTTP ${response.status} ${body}`);
  }
}