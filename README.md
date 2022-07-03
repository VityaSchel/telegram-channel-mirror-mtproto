# Telegram channel mirror bot (mtproto)

Use this bot to forward or copy messages from channel A to channel B (mirroring).

## Features

- TypeScript
- Supports Forward-protected channels
  - Documents (videos, audio etc)
  - Photos
  - Media group (only bot api
  - All text entities
- Reporting exceptions via Telegram bot or to console

**Also supports forward-protected channels**. This was really much harder to implement than you think, let's just say that Telegram forces you to reupload absolutely everything before posting it somewhere else.

## Config

Use config.json to adjust you needs.

Key|Description
---|---
native_copy|Set to `true` to use copyMessage method in API. It's more stable and much simplier, however it only works when channel admin allows to forward messages. When admin disallows it, set to `false`, and the bot will try to reproduce the same message using various fields from original. Set to `"auto"` and bot will decide this itself based on "noforwards" field of resolved peer (recommended). ⚠️ If set to `false` or `"auto"` **you must create a bot and add to target destination (B) channel**. See [this issue](https://github.com/alik0211/mtproto-core/issues/148) for details.
report_errors_to_telegram|Set to true to report all exceptions via Telegram bot. you must configure `ERROR_HANDLER_USER_ID` and `ERROR_HANDLER_BOT_TOKEN` in .env
interval|This is how fast the bot will check target channel (A) in milliseconds (1/1000 of second). Recommended value is 5-15 minutes (`300000` - `900000`)

Config changes require restart.

## Usage

Node >= 16.13.1

1. Clone this repo: `git clone https://github.com/VityaSchel/telegram-channel-mirror-mtproto`
2. Install dependencies: `npm i`
3. Fill `.env.example` with data taken from my.telegram.org, then rename to `.env`
4. Build bot using `npm run build`
5. Run compiled bot using `node index.js`
6. Follow auth flow in order to login. Use --logout option in future to sign out via mtproto (`node index.js --logout`).
7. Run in background, restart each 24hrs

## TODO

- TypeScript
- Ридми на чешском языке