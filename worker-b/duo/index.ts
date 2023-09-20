import type { Env } from '../types'
import {
  wrapDuo,
  type DurableObjectClass,
  type Options as WrapOptions,
} from './wrap'

type Bindings = Record<string, DurableObjectClass>

export function bindDuo(
  worker: ExportedHandler<Env>,
  bindings: Bindings,
  wrapOpts: WrapOptions = {}
) {
  const fetch: ExportedHandlerFetchHandler<Env> = async (req, env, ctx) => {
    if (!worker.fetch) {
      throw new Error('Worker must define fetch')
    }

    const continent = (req.cf?.continent ||
      req.headers.get('cf-continent')) as ContinentCode

    for (const [name, DO] of Object.entries(bindings)) {
      Object.assign(env, {
        [name]: wrapDuo(name, DO, env, continent, wrapOpts),
      })
    }

    return worker.fetch(req, env, ctx)
  }

  return { fetch }
}
