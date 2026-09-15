# Octopus Notification

Monitor Node.js per la tariffa **OctopusFissa 12M** su https://octopusenergy.it/offerta/tariffe.

Lo script legge i prezzi luce/gas, li confronta con l'ultimo valore salvato in `state.json` e invia una notifica Telegram quando trova una variazione. Ogni variazione viene salvata anche in `history.json` e produce due grafici PNG: andamento luce e andamento gas. L'esecuzione automatica è gestita da GitHub Actions ogni 6 ore.

## Requisiti

- Node.js 18.17 o superiore
- Un bot Telegram creato con [@BotFather](https://t.me/BotFather)
- Il tuo `chat_id` Telegram

## Setup locale

```bash
npm install
npm run scrape
```

`npm run scrape` stampa i prezzi estratti senza inviare notifiche.

Per eseguire il controllo completo con Telegram:

```bash
set TELEGRAM_BOT_TOKEN=123456:token-del-bot
set TELEGRAM_CHAT_ID=123456789
npm run check
```

Su PowerShell usa:

```powershell
$env:TELEGRAM_BOT_TOKEN = "123456:token-del-bot"
$env:TELEGRAM_CHAT_ID = "123456789"
npm run check
```

Per provare confronto e aggiornamento di `state.json` senza inviare messaggi:

```powershell
$env:DRY_RUN = "true"
npm run check
```

Per inviare sempre un messaggio di prova Telegram, senza modificare `state.json` o `history.json`:

```powershell
$env:TELEGRAM_BOT_TOKEN = "123456:token-del-bot"
$env:TELEGRAM_CHAT_ID = "123456789"
npm run test:telegram
```

Per generare solo i grafici con 10 prezzi di esempio:

```powershell
npm run test:chart
```

I PNG vengono creati in `.tmp/charts/luce.png` e `.tmp/charts/gas.png`.

La prima esecuzione con `state.json` vuoto invia una notifica, salva lo stato corrente e aggiunge la prima riga nello storico. Le esecuzioni successive restano silenziose e non modificano `state.json`/`history.json` finche i prezzi non cambiano.

## Secrets GitHub

Nel repository GitHub vai in **Settings > Secrets and variables > Actions > New repository secret** e crea:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Poi apri **Actions > Check Octopus tariffs > Run workflow** per lanciare un controllo manuale. Il workflow aggiorna e committa `state.json` solo quando lo stato cambia.

## Come ottenere il chat id

1. Scrivi un messaggio al bot Telegram.
2. Apri nel browser `https://api.telegram.org/bot<TOKEN>/getUpdates` sostituendo `<TOKEN>` con il token del bot.
3. Cerca `chat.id` nella risposta JSON.

## File principali

- `src/scrape.js`: fetch e parsing della pagina Octopus.
- `src/telegram.js`: invio del messaggio e dei grafici Telegram.
- `src/chart.js`: generazione dei grafici PNG da `history.json`.
- `src/index.js`: confronto con `state.json` e orchestrazione.
- `.github/workflows/check-tariffe.yml`: cron GitHub Actions.