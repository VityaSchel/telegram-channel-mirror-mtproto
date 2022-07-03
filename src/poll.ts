import fs from 'fs/promises'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import clone from 'just-clone'
import { downloadFile, uploadFile } from './reupload.js'

const __dirname = dirname(fileURLToPath(import.meta.url)) + '/'

export default async function poll() {
  const channel = global.channel
  const target = global.target

  const data = JSON.parse(await fs.readFile(__dirname + '../data.json', 'utf-8'))
  const history: object[] = await global.api.call('messages.getHistory', {
    peer: { _: 'inputPeerChannel', channel_id: channel.id, access_hash: channel.access_hash },
    ...(data.last_served_message_id !== null && { min_id: data.last_served_message_id }),
    limit: 15
  })
  const messages = history['messages']

  if (!messages.length) return true

  if (global.config.native_copy) {
    await global.api.call('messages.forwardMessages', {
      drop_author: true,
      from_peer: { _: 'inputPeerChannel', channel_id: channel.id, access_hash: channel.access_hash },
      id: messages.map(msg => msg.id),
      random_id: messages.map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
      to_peer: { _: 'inputPeerChannel', channel_id: target.id, access_hash: target.access_hash }
    })
  } else {
    const _messages = groupMessages(messages)

    for (const message of _messages) {
      // const sharedOptions = { 
      //   peer: { _: 'inputPeerChannel', channel_id: target.id, access_hash: target.access_hash },
      //   random_id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
      //   entities: message.entities,
      //   message: message.message
      // }
      // console.log(message)
      // if(!message.media.length) {
      //   await global.api.call('messages.sendMessage', sharedOptions)
      // } else if (message.media.length === 1) {
      //   await global.api.call('messages.sendMedia', {
      //     media: await msgMediaToInputMedia(message.media[0]),
      //     ...sharedOptions
      //   })
      // } else if (message.media.length > 1) {
      //   await global.api.call('messages.sendMultiMedia', {
      //     multi_media: message.media,
      //     ...sharedOptions
      //   })
      // }
      if (!message['media'].length) continue
      const c = message['media'][0].document
      const file = await downloadFile('document', c.id, c.access_hash, c.file_reference)
      const { id, parts } = await uploadFile(file)
    }
  }

  await fs.writeFile(__dirname + 'data.json', JSON.stringify({ last_served_message_id: messages[0].id }), 'utf-8')
  return true
}

function groupMessages(messagesSrc): object[] {
  const messages = clone(messagesSrc)
  const _messages = []
  const _media = []
  for(const message of messages) {
    if (message.grouped_id && !message.message && message.media) {
      _media.push([message.grouped_id, message.media])
    } else {
      let media = []
      if (message.media) media = [clone(message.media)]
      _messages.push({ ...message, media })
    }
  }
  for (const [groupedID, msgMedia] of _media) {
    const originalIndex = _messages.findIndex(msg => msg.grouped_id === groupedID && msg.message)
    _messages[originalIndex].media.push(msgMedia)
  }

  return _messages
}

async function msgMediaToInputMedia(messageMedia) {
  const type = messageMedia._
  if (type === 'messageMediaDocument') {
    const { id, parts } = await uploadFile(messageMedia)
    Buffer.from(await fs.readFile('/Users/You/Desktop/testfile.png'))
    return {
      _: 'inputMediaDocument',
      id: {
        _: 'inputDocument',
        id: messageMedia.document.id,
        access_hash: messageMedia.document.access_hash,
        file_reference: messageMedia.document.file_reference,
      }
    }
  }
}