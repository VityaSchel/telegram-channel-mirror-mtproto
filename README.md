# Telegram channel mirror bot (mtproto)

Use this bot to forward or copy messages from target channel A to destination channel B (mirroring).

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

Use config.json to adjust you needs. Config changes require restart. Config is validated using Yup before connecting to API.

### `native_copy`

Controls how bot copies posts from target channel.

Allowed options:

Value|Description
---|---
`true`|Use copyMessage method in API. It's more stable and much simplier, however it only works when channel admin allows to forward messages. Recommended if target channel is controlled by you and it's guaranteed never to have disabled forwards.
`false`|The bot will try to reproduce the same message using various fields from original. Reuploads every media. Unstable, experimental. Use `"auto"` instead, if you're not sure whether target channel ever allow forwards.
`"auto"`|Bot will use copyMessage and fallback to bypass algorithm if gets exception. **Recommended.**
`"auto_LEGACY"`|Bot will resolve contact each time it polls messages and decide based on "noforwards" field. DO NOT USE! Deprecated because Telegram will ban you for 16+ hours if you use resolving frequently.

⚠️ If set to anything except `true`, **you must create a Telegram bot and add to target destination (B) channel as admin with posting permission**. Fill `BOT_TOKEN` in .env with this bot's token. See [this issue](https://github.com/alik0211/mtproto-core/issues/148) for details.

### `report_errors_to_telegram`

Value|Description
---|---
`true`|Report all exceptions via Telegram bot. You must configure `ERROR_HANDLER_USER_ID` and `ERROR_HANDLER_BOT_TOKEN` in .env file. Useful when you want to swiftly fix bugs on production server. Exits process after message was sent.
`false`|Report all exceptions to stderr. Exits process after that.

It is highly recommended to not use auto-restart of process on error, because you may run into FLOOR_WAIT_X exception and restarting can make things worse.

### `interval`

This is how fast the bot will check target channel (A) in milliseconds (1/1000 of second). Recommended value is 5-15 minutes (`300000` - `900000`)

### `limit`

This is how much posts bot will get in target channel (A). Set as high as you want, but remember that message with multiple media (media group) is separate messages! So it's recommended to set it more than 10.

According to MTProto documentation, maximum limit is 100.

## Usage

Node >= 16.13.1

1. Clone this repo: `git clone https://github.com/VityaSchel/telegram-channel-mirror-mtproto`
2. Install dependencies: `npm i`
3. Fill `.env.example` with data taken from my.telegram.org, then rename to `.env`
4. Build bot using `npm run build`
5. Run compiled bot using `node out/index.js`
6. Follow auth flow in order to login with interactive prompts. Use --logout option in future to sign out via mtproto (`node out/index.js --logout`).
7. Run in background, restart each 24hrs

## .env keys

Value|Description
---|---
APP_ID|Grab at my.telegram.org
APP_HASH|Grab at my.telegram.org
PHONE|Leading plus sign required. Example: +71234567890
TWO_FA_PASSWORD|Leave empty if you don't have 2FA password
FROM_USERNAME|Username of target public channel (A). No leading @
TO_USERNAME|Username of destination public channel (B). No leading @
ERROR_HANDLER_USER_ID|Only used if config.report_errors_to_telegram = true. Chat ID that bot sends reports to.
ERROR_HANDLER_BOT_TOKEN|Only used if config.report_errors_to_telegram = true. Bot token that sends reports. No leading "bot".
BOT_TOKEN|Only used if config.native_copy != true. Bot admin of destination channel (B). 
