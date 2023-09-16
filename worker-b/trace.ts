import type { ResolveConfigFn } from '@microlabs/otel-cf-workers'
import {
  instrument as i,
  instrumentDO as iDO,
} from '@microlabs/otel-cf-workers'
import type { Env } from './types'

const config: ResolveConfigFn = (env: Env) => {
  const service = { name: 'worker-b' }
  const exporter = {
    url: 'https://api.honeycomb.io/v1/traces',
    headers: { 'x-honeycomb-team': env.HONEYCOMB_API_KEY },
  }
  return { service, exporter }
}

export const instrument = (handler: any) => i(handler, config)
export const instrumentDO = (doClass: any) => iDO(doClass, config)
