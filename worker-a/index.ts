import { context, propagation } from '@opentelemetry/api'
import type { Env } from './types'
import { instrument, trace } from './trace'

const INSTRUMENT_SERVICE_BINDING = false
const DELAY = 0

async function delay() {
  if (DELAY) {
    await trace(
      `delay: ${DELAY}ms`,
      () => new Promise(resolve => setTimeout(resolve, DELAY))
    )
  }
}

async function fetch(req: Request, env: Env) {
  function doReq(index: number, id?: string) {
    const url = new URL(req.url)
    if (id) {
      url.searchParams.set('id', id)
    }

    return trace(`make req: ${index}`, async () => {
      const headers: Record<string, string> = {}
      if (req.cf?.continent) {
        headers['cf-continent'] = String(req.cf.continent)
      }
      if (INSTRUMENT_SERVICE_BINDING) {
        propagation.inject(context.active(), headers)
      }
      const res = await env.WORKER_B.fetch(url.toString(), { headers })
      return res.json() as unknown as { id: string; msg: string }
    })
  }

  const { id } = await doReq(1)
  await delay()
  await doReq(2, id)
  await delay()
  const last = await doReq(3, id)
  return new Response(JSON.stringify(last))
}

export default instrument({ fetch })
