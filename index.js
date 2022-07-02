import 'dotenv/config'
import MTProto from '@mtproto/core'
import authorize from './auth.js'
import poll from './poll.js'

const pollInterval = 15 * 60 * 1000

const api = new MTProto({
  api_id: Number(process.env.APP_ID),
  api_hash: process.env.APP_HASH,
  

  storageOptions: { path: './tempdata.json' }
})
global.api = api

const session = await authorize()
const user = session.users[0]
console.log(`Пользователь ${user.first_name} ${user.last_name} авторизирован, бот начинает работу`)

const resolvedPeer = await api.call('contacts.resolveUsername', { username: process.env.FROM_USERNAME })
global.channel = resolvedPeer.chats[0]

const targetPeer = await api.call('contacts.resolveUsername', { username: process.env.TO_USERNAME })
global.target = targetPeer.chats[0]

poll()
setInterval(() => poll(), pollInterval)