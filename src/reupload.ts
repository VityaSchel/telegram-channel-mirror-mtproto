import _ from 'lodash'

const partsSizes = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288]
export async function uploadFile(fileBuffer: Buffer) {
  let fileID = ''
  for (let i = 0; i < 19; ++i) fileID += Math.floor(Math.random() * 10)

  const imageSize = Buffer.byteLength(fileBuffer)
  const partMaxSize = imageSize >= _.last(partsSizes) ? _.last(partsSizes) : partsSizes.find(size => imageSize <= size)
  const chunks = Math.ceil(imageSize / partMaxSize)
  for (let i = 0; i < chunks; i++) {
    const partSize = i === chunks - 1 ? imageSize % partMaxSize : partMaxSize
    const part = fileBuffer.slice(i * partMaxSize, i * partMaxSize + partSize)
    await global.api.call('upload.saveFilePart', {
      file_id: fileID,
      file_part: i,
      bytes: part
    })
  }

  return { id: fileID, parts: chunks }
}

export async function downloadFile(type: 'photo' | 'document', id, accessHash, fileReference) {
  const partSize = 524288 * 2
  let dcId
  const downloadPart = async (offset: number) => {
    const file = await global.api.call('upload.getFile', {
      location: type === 'photo' 
        ? { _: 'inputPhotoFileLocation', id, access_hash: accessHash, file_reference: fileReference } 
        : { _: 'inputDocumentFileLocation', id, access_hash: accessHash, file_reference: fileReference },
      offset: offset,
      limit: partSize
    }, dcId && { dcId })
    return file
  }

  let partBytesLength, i = 1
  const fileChunks = []
  while (partBytesLength === undefined || partBytesLength === partSize) {
    try {
      const file = await downloadPart(i * partSize)
      partBytesLength = file.bytes.length
      fileChunks.push(file.bytes)
      i++
    } catch(e) {
      if (e._ === 'mt_rpc_error' && e.error_message.startsWith('FILE_MIGRATE_')) {
        const _dcId = Number(e.error_message.substring('FILE_MIGRATE_'.length))
        dcId = _dcId
        continue
      } else {
        throw e
      }
    }
  } 
  const fileChunksBuffers = fileChunks.map(chunk => Buffer.from(chunk))
  const fileBuffer = Buffer.concat(fileChunksBuffers)
  return fileBuffer
}