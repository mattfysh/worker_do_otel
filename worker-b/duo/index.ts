import type { Env } from '../types'
import { wrapDuo, type DurableObjectClass } from './wrap'

type Bindings = Record<string, DurableObjectClass>

type Options = Partial<{
  optimistic: boolean
}>

export function bindDuo(
  worker: ExportedHandler<Env>,
  bindings: Bindings,
  opts: Options = {}
) {
  const fetch: ExportedHandlerFetchHandler<Env> = async (req, env, ctx) => {
    if (!worker.fetch) {
      throw new Error('Worker must define fetch')
    }
    for (const [name, DO] of Object.entries(bindings)) {
      Object.assign(env, { [name]: wrapDuo(name, DO, env, req.cf?.continent) })
    }
    try {
      return await worker.fetch(req.clone(), env, ctx)
    } catch (e) {
      if (!(e instanceof Error && e.message === 'Cannot write')) {
        throw e
      }
    }

    return new Response('tmp')
  }

  return { fetch }
}
