# Telegram channel mirror bot (mtproto)

"грабер" сообщений на мтпрото специально для азамата блин

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