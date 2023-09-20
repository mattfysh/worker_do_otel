import type { Env } from '../types'
import { getRedis } from './redis'
import { routeToHost } from './route'
import { DuoId } from './id'

export type DurableObjectClass = {
  new (state: DurableObjectState, env: any): DurableObject
}

function noimpl(msg: string) {
  return function () {
    throw new Error(`Not implemented: ${msg}`)
  }
}

export function wrapDuo(
  bindingName: string,
  DO: DurableObjectClass,
  env: Env,
  continent?: ContinentCode
): DurableObjectNamespace {
  const defaultHost = routeToHost(env, { continent })

  return {
    newUniqueId: () => DuoId.createUnique(defaultHost),
    idFromString: (id: string) => new DuoId(id),

    idFromName: noimpl('idFromName'),
    getExisting: noimpl('getExisting'),
    jurisdiction: noimpl('jurisdiction'),

    get: (duoId: DuoId) => {
      const host = duoId.getHost(env)
      const connUrl = new URL(host.conn)
      const hashKey = `${bindingName}:${duoId}`
      const redis = getRedis(connUrl.host, connUrl.password, hashKey)

      console.log('getting wrapped counter with id', duoId)
      const state: DurableObjectState = {
        id: duoId,
        waitUntil: (): any => {},
        blockConcurrencyWhile: (): any => {},
        acceptWebSocket: (): any => {},
        getWebSockets: (): any => {},
        setWebSocketAutoResponse: (): any => {},
        getWebSocketAutoResponse: (): any => {},
        getWebSocketAutoResponseTimestamp: (): any => {},
        abort: (): any => {},
        storage: {
          async get(key: string | string[]) {
            if (Array.isArray(key)) {
              throw new Error('no impl: storage.get(keys)')
            }
            return redis.get(key)
          },
          async put(key: any, value: unknown) {
            await redis.put(key, value)
          },
          list: (): any => {},
          delete: (): any => {},
          deleteAll: (): any => {},
          transaction: (): any => {},
          setAlarm: (): any => {},
          getAlarm: (): any => {},
          deleteAlarm: (): any => {},
          sync: (): any => {},
          sql: {} as any,
          transactionSync: (): any => {},
          getCurrentBookmark: (): any => {},
          getBookmarkForTime: (): any => {},
          onNextSessionRestoreBookmark: (): any => {},
        },
      }
      const stub = new DO(state, {})
      return {
        id: duoId,
        async fetch(req: Request) {
          return stub.fetch(new Request(req))
        },
        connect: (): any => {},
        queue: (): any => {},
        scheduled: (): any => {},
      }
    },
  }
}
