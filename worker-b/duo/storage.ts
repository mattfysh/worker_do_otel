import type { Redis } from './redis'
import { noimpl } from './utils'

type Mode = 'ro' | 'rw-tx' | 'rw-lock'

const todo = {
  list: noimpl('list'),
  delete: noimpl('delete'),
  deleteAll: noimpl('deleteAll'),
  transaction: noimpl('transaction'),
  setAlarm: noimpl('setAlarm'),
  getAlarm: noimpl('getAlarm'),
  deleteAlarm: noimpl('deleteAlarm'),
  sync: noimpl('sync'),
  transactionSync: noimpl('transactionSync'),
  getCurrentBookmark: noimpl('getCurrentBookmark'),
  getBookmarkForTime: noimpl('getBookmarkForTime'),
  onNextSessionRestoreBookmark: noimpl('onNextSessionRestoreBookmark'),
  sql: {} as any,
}

export function wrapStorage(redis: Redis) {
  let errored = false
  let writeMode: Mode = 'ro'
  let txWrites: Record<string, string> = {}

  const storeControl = {
    optimisticLock() {
      if (!errored) {
        throw new Error('Unexpected store control state')
      }

      errored = false
      writeMode = 'rw-tx'

      redis.watch()

      return async function exec() {
        const res = await redis.writeEntries(txWrites)
        if (Array.isArray(res) && res.at(-1) !== null) {
          return
        }
        errored = true
        throw new Error('Exec failed')
      }
    },
  }

  const storage: DurableObjectStorage = {
    async get(key: string | string[]) {
      if (Array.isArray(key)) {
        errored = true
        throw new Error('Not implemented: storage.get(keys)')
      }
      const json =
        (writeMode === 'rw-tx' && txWrites[key]) || (await redis.get(key))
      return json && JSON.parse(json)
    },

    async put(key: any, value: unknown) {
      if (typeof key !== 'string') {
        errored = true
        throw new Error('Not implemented: storage.put(entries)')
      } else if (writeMode === 'ro') {
        errored = true
        throw new Error('Writes disabled')
      }

      let json = JSON.stringify(value)

      if (writeMode === 'rw-tx') {
        txWrites[key] = json
      } else {
        await redis.put(key, json)
      }
    },

    ...todo,
  }

  return { storeControl, storage }
}
