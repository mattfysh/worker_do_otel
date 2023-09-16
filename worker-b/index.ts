import type { Env } from './types'
// import { instrument } from './trace'

export { Counter } from './counter'

async function fetch(request: Request, env: Env, context: ExecutionContext) {
  // console.log(
  //   'Worker B received headers',
  //   Object.fromEntries(request.headers.entries())
  // )
  let url = new URL(request.url)
  let idparam = url.searchParams.get('id')
  let name = url.searchParams.get('name')

  console.log('xx', { idparam, name })

  let id
  if (name) {
    id = env.COUNTER.idFromName(name)
  } else if (idparam) {
    id = env.COUNTER.idFromString(idparam)
  } else {
    id = env.COUNTER.newUniqueId()
  }

  let obj = env.COUNTER.get(id)

  return obj.fetch(request.url)

  // let res = await obj.fetch(request.url)
  // let count = parseInt(await res.text())

  // return new Response(
  //   JSON.stringify({
  //     id: obj.id.toString(),
  //     message: `Durable Object -- ${count}`,
  //   }),
  //   {
  //     headers: {
  //       'content-type': 'application/json',
  //     },
  //   }
  // )
}

export default { fetch }
// export default instrument({ fetch })

class Greet {
  fetch() {
    return new Response('hello from do')
  }
}

export { Greet }
