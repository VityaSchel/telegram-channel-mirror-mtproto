import 'dotenv/config'
import fs from 'fs/promises'
import MTProto from '@mtproto/core'
import authorize from './auth.js'
import poll from './poll.js'
import fetch from 'node-fetch'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url)) + '/'
const config = JSON.parse(await fs.readFile(__dirname + '../config.json', 'utf-8'))
const pollInterval = config['interval'] //15 * 60 * 1000
global.config = config

try {
  const api = new MTProto({ 
    api_id: Number(process.env.APP_ID),
    api_hash: process.env.APP_HASH,
    

    storageOptions: { path: __dirname + '../tempdata.json' }
  })
  global.api = api

  const session = await authorize()
  const user = session.users[0]
  console.log(`User ${user.first_name} ${user.last_name} is authentificated, bot has started working.`)

  const resolvedPeer = await api.call('contacts.resolveUsername', { username: process.env.FROM_USERNAME })
  if (global.config.native_copy === 'auto') {
    global.config.native_copy = !resolvedPeer.noforwards
    console.log('config.native_copy was set to "auto". Bot is going to copy messages', resolvedPeer.noforwards ? 'using bypassing algorithm' : 'natively')
  }
  global.channel = resolvedPeer.chats[0]

  const targetPeer = await api.call('contacts.resolveUsername', { username: process.env.TO_USERNAME })
  global.target = targetPeer.chats[0]

  await poll()
  setInterval(() => poll(), pollInterval)
} catch(e) {
  if (config.report_errors_to_telegram) {
    await fetch(`https://api.telegram.org/bot${process.env.ERROR_HANDLER_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        chat_id: process.env.ERROR_HANDLER_USER_ID,
        text: e.message || JSON.stringify(e, Object.getOwnPropertyNames(e)) || e
      })
    })
  } else {
    throw e
  }
  process.exit(0)
}