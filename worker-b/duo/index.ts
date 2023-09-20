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
    const continent = (req.cf?.continent ||
      req.headers.get('cf-continent')) as ContinentCode
    for (const [name, DO] of Object.entries(bindings)) {
      Object.assign(env, { [name]: wrapDuo(name, DO, env, continent) })
    }
    return await worker.fetch(req.clone(), env, ctx)
  }

  return { fetch }
}
