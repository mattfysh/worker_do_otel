import { propagation, context } from '@opentelemetry/api'
import type { Env } from './types'
import { instrument, trace } from './trace'

function doReq(request: Request, env: Env, index: number) {
  return trace(`make req: ${index}`, () => {
    const headers = { 'do-request-number': String(index) }
    propagation.inject(context.active(), headers)
    return env.WORKER_B.fetch(request.url, { headers })
  })
}

async function fetch(request: Request, env: Env) {
  await doReq(request, env, 1)
  await doReq(request, env, 2)
  await doReq(request, env, 3)
  return await doReq(request, env, 4)
}

export default instrument({ fetch })
