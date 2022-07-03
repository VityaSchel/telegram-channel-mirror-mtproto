// Source: https://gist.github.com/VityaSchel/77e482daf2ac688c18d39b126583fc86

import readlineSync from 'readline-sync'
import { getUser, sendCode, signIn, getPassword, checkPassword } from './utils.js'

export default async function authorize() {
  let user
  if (process.argv[2] === '--logout') await global.api.call('auth.logOut')
  else user = await getUser()

  if (user) return user
  else {
    const phone = process.env.PHONE
    const { phone_code_hash } = await sendCode(phone)
    const code = readlineSync.question('Код для авторизации: ')

    try {
      const signInResult = await signIn({
        code,
        phone,
        phone_code_hash,
      })

      if (signInResult._ === 'auth.authorizationSignUpRequired') throw 'Аккаунт не найден'
    } catch (error) {
      switch (error.error_message) {
        case 'SESSION_PASSWORD_NEEDED':
          try {
            await twoFA()
          } catch (e) {
            if (e.error_message === 'PASSWORD_HASH_INVALID') throw 'Неправильный пароль 2FA в .env файле'
            else throw error
          }
          return await getUser()

        case 'PHONE_CODE_INVALID':
          console.log('Неправильный код! Попробуйте еще раз')
          return await authorize()

        default:
          throw error
      }
    }
  }
}

async function twoFA() {
  const { srp_id, current_algo, srp_B } = await getPassword()
  const { g, p, salt1, salt2 } = current_algo

  const { A, M1 } = await global.api.crypto.getSRPParams({
    g,
    p,
    salt1,
    salt2,
    gB: srp_B,
    password: process.env.TWO_FA_PASSWORD,
  })

  await checkPassword({ srp_id, A, M1 })
}