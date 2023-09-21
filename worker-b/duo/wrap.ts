import type { Env } from '../types'
import { getRedis } from './redis'
import { routeToHost } from './route'
import { DuoId } from './id'
import { wrapStorage } from './storage'
import { noimpl } from './utils'

export type DurableObjectClass = {
  new (state: DurableObjectState, env: any): DurableObject
}

export type Options = Partial<{
  optimistic: boolean
}>

export function wrapDuo(
  bindingName: string,
  DO: DurableObjectClass,
  env: Env,
  continent?: ContinentCode,
  opts: Options = {}
): DurableObjectNamespace {
  const nearestHost = routeToHost(env, { continent })

  return {
    newUniqueId: () => DuoId.createUnique(nearestHost),
    idFromString: (id: string) => new DuoId(id),
    idFromName: noimpl('idFromName'),
    getExisting: noimpl('getExisting'),
    jurisdiction: noimpl('jurisdiction'),

    get: (duoId: DuoId) => {
      const host = duoId.getHost(env)
      const connUrl = new URL(host.conn)
      const hashKey = `${bindingName}:${duoId}`
      const redis = getRedis(connUrl.host, connUrl.password, hashKey)
      const { storeControl, storage } = wrapStorage(redis)

      const state: DurableObjectState = {
        id: duoId,
        waitUntil: noimpl('waitUntil'),
        blockConcurrencyWhile: noimpl('blockConcurrencyWhile'),
        acceptWebSocket: noimpl('acceptWebSocket'),
        getWebSockets: noimpl('getWebSockets'),
        setWebSocketAutoResponse: noimpl('setWebSocketAutoResponse'),
        getWebSocketAutoResponse: noimpl('getWebSocketAutoResponse'),
        getWebSocketAutoResponseTimestamp: noimpl(
          'getWebSocketAutoResponseTimestamp'
        ),
        abort: noimpl('abort'),
        storage,
      }

      async function fetch(req: Request) {
        if (opts.optimistic) {
          // optimistic readonly
          try {
            const stub = new DO(state, {})
            return await stub.fetch(new Request(req))
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            console.error('optimistic read failure:', msg)
            if (msg !== 'Writes disabled') {
              return new Response('Internal Server Error', { status: 500 })
            }
          }

          // optimistic write locking (x2)
          for (let i = 0; i < 2; i += 1) {
            const exec = storeControl.optimisticLock()
            try {
              const stub = new DO(state, {})
              const res = await stub.fetch(new Request(req))
              await exec()
              return res
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e)
              console.error('optimistic write locking failure:', msg)
              if (msg !== 'Exec failed') {
                return new Response('Internal Server Error', { status: 500 })
              }
            }
          }
        }

        return new Response('Not implemented: pessimistic write locking', {
          status: 500,
        })
      }

      return {
        id: duoId,
        fetch,
        connect: noimpl('connect'),
        queue: noimpl('queue'),
        scheduled: noimpl('scheduled'),
      }
    },
  }
}
