import { Buffer } from 'node:buffer'
import type { Env } from '../types'
import { routeToHost, type Host } from './route'

export class DuoId implements DurableObjectId {
  static createUnique(host: Host) {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    const last = bytes[bytes.length - 1]
    bytes[bytes.length - 1] = (last & 0xf0) | host.id
    const id = Buffer.from(bytes).toString('hex')
    return new DuoId(id)
  }

  constructor(private id: string) {}

  getHost(env: Env): Host {
    const bytes = new Uint8Array(Buffer.from(this.id, 'hex'))
    const last = bytes[bytes.length - 1]
    const hostId = last & 0x0f
    return routeToHost(env, { id: hostId })
  }

  toString() {
    return this.id
  }

  equals(other: DurableObjectId) {
    return this.toString() === other.toString()
  }
}
