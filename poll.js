import fs from 'fs/promises'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url)) + '/'

export default async function poll() {
  const channel = global.channel
  const target = global.target

  const data = JSON.parse(await fs.readFile(__dirname + 'data.json', 'utf-8'))
  const history = await global.api.call('messages.getHistory', {
    peer: { _: 'inputPeerChannel', channel_id: channel.id, access_hash: channel.access_hash },
    ...(data.last_served_message_id !== null && { min_id: data.last_served_message_id }),
    limit: 3
  })
  const messages = history.messages

  if (!messages.length) return true

  await global.api.call('messages.forwardMessages', {
    drop_author: true,
    from_peer: { _: 'inputPeerChannel', channel_id: channel.id, access_hash: channel.access_hash },
    id: messages.map(msg => msg.id),
    random_id: messages.map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
    to_peer: { _: 'inputPeerChannel', channel_id: target.id, access_hash: target.access_hash }
  })

  await fs.writeFile(__dirname + 'data.json', JSON.stringify({ last_served_message_id: messages[0].id }), 'utf-8')

  return true
}