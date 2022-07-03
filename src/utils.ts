// Source: https://gist.github.com/VityaSchel/77e482daf2ac688c18d39b126583fc86

export async function getUser() {
  try {
    const user = await global.api.call('users.getFullUser', {
      id: {
        _: 'inputUserSelf',
      },
    })

    return user
  } catch (error) {
    return null
  }
}

export function sendCode(phone) {
  return global.api.call('auth.sendCode', {
    phone_number: phone,
    settings: {
      _: 'codeSettings',
    },
  })
}

export function signIn({ code, phone, phone_code_hash }) {
  return global.api.call('auth.signIn', {
    phone_code: code,
    phone_number: phone,
    phone_code_hash: phone_code_hash,
  })
}

export function signUp({ phone, phone_code_hash }) {
  return global.api.call('auth.signUp', {
    phone_number: phone,
    phone_code_hash: phone_code_hash,
    first_name: 'MTProto',
    last_name: 'Core',
  })
}

export function getPassword() {
  return global.api.call('account.getPassword')
}

export function checkPassword({ srp_id, A, M1 }) {
  return global.api.call('auth.checkPassword', {
    password: {
      _: 'inputCheckPasswordSRP',
      srp_id,
      A,
      M1,
    },
  })
}

export function mtprotoEntitiesToBotAPI(mtprotoEntities: object[]): object[] {
  return mtprotoEntities.map(mtprotoEntity => {
    let entity = {}
    switch (mtprotoEntity['_']) {
      case 'messageEntityBold':
        entity = { type: 'bold' }
        break

      case 'messageEntityTextUrl':
        entity = { type: 'text_link', url: mtprotoEntity['url'] }
        break

      case 'messageEntityUrl':
        entity = { type: 'url' }
        break

      case 'messageEntityItalic':
        entity = { type: 'italic' }
        break

      case 'messageEntityUnderline':
        entity = { type: 'underline' }
        break

      case 'messageEntityCode':
        entity = { type: 'code' }
        break

      case 'messageEntityPre':
        entity = { type: 'pre', language: mtprotoEntity['language'] }
        break

      case 'messageEntityStrike':
        entity = { type: 'strikethrough' }
        break

      case 'messageEntityBlockquote':
        entity = { type: 'code' }
        break

      case 'messageEntitySpoiler':
        entity = { type: 'spoiler' }
        break

      default:
        return null
    }
    return { ...entity, offset: mtprotoEntity['offset'], length: mtprotoEntity['length'] }
  }).filter(Boolean)
}