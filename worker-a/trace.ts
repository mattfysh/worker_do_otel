import { trace as otel, SpanStatusCode } from '@opentelemetry/api'
import type { ResolveConfigFn } from '@microlabs/otel-cf-workers'
import {
  instrument as i,
  instrumentDO as iDO,
} from '@microlabs/otel-cf-workers'
import type { Env } from './types'

export function trace<Return>(
  name: string,
  fn: () => Return | Promise<Return>
): Promise<Return> {
  const tracer = otel.getTracer('topline')
  return tracer.startActiveSpan(name, async span => {
    try {
      return await fn()
    } catch (e: any) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: e?.message,
      })
      throw e
    } finally {
      span.end()
    }
  })
}

const config: ResolveConfigFn = (env: Env) => {
  const service = { name: 'worker-a' }
  const exporter = {
    url: 'https://api.honeycomb.io/v1/traces',
    headers: { 'x-honeycomb-team': env.HONEYCOMB_API_KEY },
  }
  return { service, exporter }
}

export const instrument = (handler: any) => i(handler, config)
export const instrumentDO = (doClass: any) => iDO(doClass, config)
