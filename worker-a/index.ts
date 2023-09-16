import { propagation, context } from '@opentelemetry/api'
import type { Env } from './types'
import { instrument, trace } from './trace'

function doReq(request: Request, env: Env, index: number, id?: string) {
  let url = new URL(request.url)
  if (id) {
    url.searchParams.set('id', id)
  }

  return trace(`make req: ${index}`, async () => {
    const headers = {}
    propagation.inject(context.active(), headers)
    const res = await env.WORKER_B.fetch(url.toString(), { headers })
    return res.json() as unknown as { id: string; message: string }
  })
}

async function fetch(request: Request, env: Env) {
  const { id } = await doReq(request, env, 1)

  await doReq(request, env, 2, id)

  const last = await doReq(request, env, 3, id)
  return new Response(JSON.stringify(last))
}

// export default { fetch }
export default instrument({ fetch })
