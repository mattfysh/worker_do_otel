type Env = {
  GREET: DurableObjectNamespace
}

function timer() {
  const start = Date.now()
  function log(msg: string) {
    console.log(`[timer log] ${msg}:`, Date.now() - start)
  }
  return { log }
}

async function fetch(req: Request, env: Env) {
  const t = timer()

  const url = new URL(req.url)
  const reqName = url.searchParams.get('name')
  const reqId = url.searchParams.get('id')

  const id = reqName
    ? env.GREET.idFromName(reqName)
    : reqId
    ? env.GREET.idFromString(reqId)
    : env.GREET.newUniqueId()

  const obj = env.GREET.get(id)

  const msg = await obj.fetch(req.url)
  t.log('Greet responded')

  const body = { id: id.toString(), msg: await msg.text() }
  const headers = { 'content-type': 'application/json' }
  return new Response(JSON.stringify(body), { headers })
}

export default { fetch }

export class Greet {
  fetch() {
    return new Response('hello from do')
  }
}
