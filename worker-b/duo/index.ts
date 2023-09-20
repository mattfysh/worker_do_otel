import type { Env } from '../types'
import './polyfill'
import { getRedis } from './redis'
import { wrapDuo, type DurableObjectClass } from './wrap'

type Bindings = Record<string, DurableObjectClass>

export function bindDuo(worker: ExportedHandler<Env>, bindings: Bindings) {
  const fetch: ExportedHandlerFetchHandler<Env> = (req, env, ctx) => {
    if (!worker.fetch) {
      throw new Error('Worker must define fetch')
    }
    const redis = getRedis(env.REDIS_ADDR, env.REDIS_PASS)
    for (const [name, DO] of Object.entries(bindings)) {
      Object.assign(env, { [name]: wrapDuo(DO, redis) })
    }
    return worker.fetch(req, env, ctx)
  }
  return { fetch }
}
