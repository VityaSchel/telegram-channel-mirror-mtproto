import fs from 'fs/promises'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { reproduceMessage } from './reproduceMessage.js'

const __dirname = dirname(fileURLToPath(import.meta.url)) + '/'

export default async function poll() {
  await resetNativeCopySetting()

  const channel = global.channel
  
  const data = JSON.parse(await fs.readFile(__dirname + '../data.json', 'utf-8'))
  const history: object[] = await global.api.call('messages.getHistory', {
    peer: { _: 'inputPeerChannel', channel_id: channel.id, access_hash: channel.access_hash },
    ...(data.last_served_message_id !== null && { min_id: data.last_served_message_id }),
    limit: 15
  })
  const messages = history['messages'].filter(msg => msg._ === 'message')

  if (!messages.length) return true

  if (global.force_copy_natively_override) {
    // First time bots run, it can decide using "noforwards prop" (optimisation)
    global.force_copy_natively_override = false
    if (global.copy_natively) {
      await nativeCopy(messages)
    } else {
      await reproduceMessage(messages)
    }
  } else if (global.config.native_copy === 'auto') {
    try {
      await nativeCopy(messages)
    } catch (e) {
      if (e?.error_message === 'CHAT_FORWARDS_RESTRICTED') {
        console.log('Fallback to bypassing algorithm')
        await reproduceMessage(messages)
      } else {
        throw e
      }
    }
  } else if (global.copy_natively) {
    await nativeCopy(messages)
  } else {
    await reproduceMessage(messages)
  }

  await fs.writeFile(__dirname + '../data.json', JSON.stringify({ last_served_message_id: messages[0].id }), 'utf-8')
  return true
}

async function nativeCopy(messages: object[]) {
  const channel = global.channel
  const target = global.target

  await global.api.call('messages.forwardMessages', {
    drop_author: true,
    from_peer: { _: 'inputPeerChannel', channel_id: channel.id, access_hash: channel.access_hash },
    id: messages.map(msg => msg['id']),
    random_id: messages.map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
    to_peer: { _: 'inputPeerChannel', channel_id: target.id, access_hash: target.access_hash }
  })
}

async function resetNativeCopySetting() {
  // In case channel admin decides to change "noforwards" option in channel settings while bot is running,
  // and native_copy is set to "auto", the bot will switch loaded config and notify user.
  if (global.config.native_copy !== 'auto_LEGACY') return
  
  const resolvedPeer = await global.api.call('contacts.resolveUsername', { username: process.env.FROM_USERNAME })
  const channel = resolvedPeer.chats[0]
  if (global.copy_natively !== !channel.noforwards) {
    global.copy_natively = !channel.noforwards
    console.log('config.native_copy was set to "auto". Channel admin changed noforwards settings, switching loaded config in real-time... Bot is now copying messages', channel.noforwards ? 'using bypassing algorithm' : 'natively')
  }
}