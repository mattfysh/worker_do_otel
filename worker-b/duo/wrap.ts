import type { getRedis } from './redis'

export type DurableObjectClass = {
  new (state: DurableObjectState, env: any): DurableObject
}

export type Redis = ReturnType<typeof getRedis>

class DuoId implements DurableObjectId {
  constructor(private id: string) {}

  toString() {
    return this.id
  }

  equals(other: DurableObjectId) {
    return this.toString() === other.toString()
  }
}

export function wrapDuo(
  DO: DurableObjectClass,
  redis: Redis
): DurableObjectNamespace {
  return {
    newUniqueId: () => new DuoId('newUniqueId'),
    idFromString: (id: string) => new DuoId(id),
    idFromName: (name: string) => new DuoId(`IDFOR:${name}`),
    getExisting: (): any => {},
    jurisdiction: (): any => {},
    get: (duoId: DurableObjectId) => {
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
            return redis.get(`${duoId}:${key}`)
          },
          async put(key: any, value: unknown) {
            await redis.put(`${duoId}:${key}`, value)
            return undefined
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
