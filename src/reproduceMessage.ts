
import clone from 'just-clone'
import reuploadFile, { downloadFile } from './reupload.js'
import fetch from 'node-fetch'
import FormData from 'form-data'
import { mtprotoEntitiesToBotAPI } from './utils.js'

export async function reproduceMessage(messages: object[]) {
  const target = global.target

  const _messages = groupMessages(messages).reverse()
  for (const message of _messages) {
    const sharedOptions = {
      peer: { _: 'inputPeerChannel', channel_id: target.id, access_hash: target.access_hash },
      random_id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
      entities: message['entities'],
      message: message['message']
    }

    if (!message['media'].length) {
      await global.api.call('messages.sendMessage', sharedOptions)
    } else if (message['media'].length === 1) {
      const media = await msgMediaToInputMedia(message['media'][0])
      if (!media) {
        if (!sharedOptions.message) return console.error('Message is empty, hence skipping this post')
        await global.api.call('messages.sendMessage', sharedOptions)
      } else {
        await global.api.call('messages.sendMedia', {
          media: await msgMediaToInputMedia(message['media'][0]),
          ...sharedOptions
        })
      }
    } else if (message['media'].length > 1) {
      // UNCOMMENT WHEN https://github.com/alik0211/mtproto-core/issues/148 FIXED
      // const mediaArray = []
      // for(const media of message['media']) {
      //   mediaArray.push({
      //     _: 'inputSingleMedia',
      //     media: await msgMediaToInputMedia(media),
      //     random_id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
      //     message: ''
      //   })
      // }
      // console.log(mediaArray)
      // await global.api.call('messages.sendMultiMedia', {
      //   multi_media: mediaArray,
      //   ...sharedOptions
      // })

      let mediaArray: string | object[] = []
      const body = new FormData()
      body.append('chat_id', '@' + process.env.TO_USERNAME)
      let i = 0
      for (const media of message['media']) {
        const file = await msgMediaToInputMedia(media, true)
        const fieldID = String('file_' + Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
        const type = {
          'messageMediaDocument': 'document',
          'messageMediaPhoto': 'photo'
        }[media['_']]
        mediaArray.push({
          type,
          media: 'attach://' + fieldID,
          ...(type === 'photo' && i === 0 && {
            caption: message['message'],
            caption_entities: mtprotoEntitiesToBotAPI(message['entities'])
          })
        })
        body.append(fieldID, file, { filename: 'unicorn.png' })
        i++
      }
      mediaArray = JSON.stringify(mediaArray)
      body.append('media', mediaArray)
      const res = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMediaGroup`, {
        method: 'POST',
        body
      })
      if (res.status !== 200) throw 'Error while uploading images to Telegram Bots API. ' + await res.text()
    }
  }
}

function groupMessages(messagesSrc): object[] {
  const messages = clone(messagesSrc)
  const _messages = []
  const _media = []
  for (const message of messages) {
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
    _messages[originalIndex]?.media.push(msgMedia)
  }

  return _messages
}

async function msgMediaToInputMedia(messageMedia, botsAPI = false): Promise<Buffer | object | void> {
  const type = messageMedia._
  switch(type){
    case 'messageMediaDocument':
      return await (async () => {
        const file = messageMedia.document
        if (botsAPI) {
          const fileBuffer = await downloadFile('document', file.id, file.access_hash, file.file_reference)
          return fileBuffer
        } else {
          const { id, parts } = await reuploadFile('document', file.id, file.access_hash, file.file_reference)
          return {
            _: 'inputMediaUploadedDocument',
            file: {
              _: 'inputFile',
              id: id,
              parts: parts,
              name: id,
            },
            mime_type: file.mime_type
          }
        }
      })()

    case 'messageMediaPhoto':
      return await (async () => {
        const file = messageMedia.photo
        const photoSize = file.sizes.find(size => size._ === 'photoSizeProgressive').type
        if (botsAPI) {
          const fileBuffer = await downloadFile('photo', file.id, file.access_hash, file.file_reference, photoSize)
          return fileBuffer
        } else {
          const { id, parts } = await reuploadFile('photo', file.id, file.access_hash, file.file_reference, photoSize)
          return {
            _: 'inputMediaUploadedPhoto',
            file: {
              _: 'inputFile',
              id: id,
              parts: parts,
              name: id + '.jpeg'// + {'.png'}
            }
          }
        }
      })()

    case 'messageMediaWebPage':
      return null
  
    default:
      console.error('Unknown media', messageMedia, Date.now())
      return null
  }
}