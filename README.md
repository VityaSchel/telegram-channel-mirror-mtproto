# Telegram channel mirror bot (mtproto)

Use this bot to forward or copy messages from channel A to channel B (mirroring).

**Also supports forward-protected channels**. This was really much harder to implement than you think, let's just say that Telegram forces you to reupload absolutely everything before posting it somewhere else.

## Config

Set `native_copy` option in config.json to true to use copyMessage method in API. It's more stable and much simplier, however it only works when channel admin allows to forward messages. When admin disallows it, set `native_copy` to false, and the bot will try to reproduce the same message using various fields from original.

Set `report_errors_to_telegram` to true to report all exceptions with telegram bot.

Config changes require restart.

## Usage

Node >= 16.13.1

1. `git clone https://github.com/VityaSchel/telegram-channel-mirror-mtproto`
2. `npm i`
3. Fill `.env.example` with data taken from my.telegram.org
4. `node index.js`
5. Auth flow
6. Run in background, restart each 24hrs

Interval can be adjusted in /index.js:6 (`pollInterval` is ms)

## TODO

- TypeScript
- Ридми на чешском языке