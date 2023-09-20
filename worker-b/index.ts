import './polyfill'
import type { Env } from './types'
import { instrument } from './trace'
import { bindDuo } from './duo'
import { Counter } from './counter'
import { Greet } from './greet'

export { Counter, Greet }

const BIND_DUO = true

async function fetch(req: Request, env: Env) {
  const url = new URL(req.url)
  const idparam = url.searchParams.get('id')
  const name = url.searchParams.get('name')

  let id
  if (name) {
    id = env.COUNTER.idFromName(name)
  } else if (idparam) {
    id = env.COUNTER.idFromString(idparam)
  } else {
    id = env.COUNTER.newUniqueId()
  }

  const stub = env.COUNTER.get(id)

  const res = await stub.fetch(req.url)
  if (!res.ok) {
    console.error(`COUNTER response not ok: ${res.status}`)
    return new Response('Internal Server Error', { status: 500 })
  }

  const body = { id: id.toString(), msg: await res.text() }
  const headers = { 'content-type': 'application/json' }
  return new Response(JSON.stringify(body), { headers })
}

let worker: ExportedHandler<Env> = { fetch }
if (BIND_DUO) {
  worker = bindDuo(worker, { COUNTER: Counter }, { optimistic: true })
}

export default instrument(worker)
// export default instrument({ fetch })
