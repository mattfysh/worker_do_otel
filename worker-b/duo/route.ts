import type { ContinentCode } from '@cloudflare/workers-types'
import type { Env } from '../types'

export type Host = { id: number; conn: string }

export function routeToHost(
  env: Env,
  query: { continent?: ContinentCode; id?: number }
): Host {
  const hosts: Host[] = [
    { id: 0, conn: 'reserved' },
    { id: 1, conn: env.REDIS_HOST_AU },
    { id: 2, conn: env.REDIS_HOST_AS },
    { id: 3, conn: env.REDIS_HOST_EU },
    { id: 4, conn: env.REDIS_HOST_US },
  ]

  const continents: Record<ContinentCode, Host> = {
    AN: hosts[1],
    OC: hosts[1],
    AS: hosts[2],
    AF: hosts[3],
    EU: hosts[3],
    NA: hosts[4],
    SA: hosts[4],
  }

  let host: Host | undefined
  if (query.continent) {
    host = continents[query.continent]
  } else if (typeof query.id === 'number' && query.id !== 0) {
    host = hosts[query.id]
  }

  if (host) {
    return host
  }

  throw new Error(`Unable to resolve host query: ${JSON.stringify(query)}`)
}
