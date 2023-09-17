import type { Env } from './types'
import { instrument } from './trace'

export { Counter } from './counter'
export { Greet } from './greet'

async function fetch(req: Request, env: Env) {
  const url = new URL(req.url)
  const idparam = url.searchParams.get('id')
  const name = url.searchParams.get('name')

  console.log('xx', { idparam, name })

  let id
  if (name) {
    id = env.COUNTER.idFromName(name)
  } else if (idparam) {
    id = env.COUNTER.idFromString(idparam)
  } else {
    id = env.COUNTER.newUniqueId()
  }

  const obj = env.COUNTER.get(id)

  const msg = await obj.fetch(req.url)

  const body = { id: id.toString(), msg: await msg.text() }
  const headers = { 'content-type': 'application/json' }
  return new Response(JSON.stringify(body), { headers })
}

export default instrument({ fetch })
