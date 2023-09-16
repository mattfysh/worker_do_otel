import type { Env } from './types'
import { instrument } from './trace'

export { Counter } from './counter'

async function fetch(request: Request, env: Env) {
  console.log(
    'Worker B received headers',
    Object.fromEntries(request.headers.entries())
  )
  let url = new URL(request.url)
  let name = url.searchParams.get('name')
  if (!name) {
    return new Response(
      'Select a Durable Object to contact by using' +
        ' the `name` URL query string parameter. e.g. ?name=A'
    )
  }

  let id = env.COUNTER.idFromName(name)

  let obj = env.COUNTER.get(id)

  let res = await obj.fetch(request.url)
  let count = parseInt(await res.text())

  return new Response(`Durable Object '${name}' ${count}`)
}

export default instrument({ fetch })
