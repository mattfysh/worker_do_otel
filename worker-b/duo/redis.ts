import { Buffer } from 'node:buffer'
import { connect } from 'cloudflare:sockets'

type Queue = ReturnType<(typeof Promise)['withResolvers']>[]

function getClient(addr: string, queue: Queue) {
  const socket = connect(addr, { secureTransport: 'on', allowHalfOpen: false })
  const writer = socket.writable.getWriter()
  const encoder = new TextEncoder()

  setTimeout(async () => {
    for await (const chunk of socket.readable) {
      parse(chunk).forEach(x => {
        const nextCmd = queue.shift()
        if (nextCmd) {
          nextCmd.resolve(x)
        } else {
          console.error(`ERROR: Unmatched redis response`)
        }
      })
    }
  })

  return {
    write: (resp: string) => {
      const buf = encoder.encode(resp)
      return writer.write(buf)
    },
    end: () => writer.close(),
  }
}

export function getRedis(addr: string, pass: string, hashKey: string) {
  const queue: Queue = []
  const client = getClient(addr, queue)

  async function send(...cmd: string[]): Promise<unknown> {
    const resp = build(cmd)
    const p = Promise.withResolvers()
    queue.push(p)
    await client.write(resp)
    return p.promise
  }

  send('AUTH', pass)

  let writes = true

  return {
    enableWrites: async () => {
      await send('WATCH', hashKey)
      writes = true
    },
    async get(key: string) {
      const value = (await send('HGET', hashKey, key)) as null | string
      return value === null ? undefined : JSON.parse(value)
    },
    async put(key: string, value: unknown) {
      if (!writes) {
        throw new Error('Cannot write')
      }
      await send('HSET', hashKey, key, JSON.stringify(value))
      return true
    },
  }
}

function build(cmd: string[]) {
  let resp = ''
  resp += '*' + cmd.length + '\r\n'
  cmd.forEach(arg => {
    resp += '$' + Buffer.byteLength(arg, 'utf8') + '\r\n'
    resp += arg + '\r\n'
  })
  return resp
}

function parse(buf: any) {
  const resp = Buffer.from(buf).toString()
  const lines = resp.split('\r\n').slice(0, -1)
  const res = []
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    const token = line[0]
    const rem = line.slice(1)

    if (token === '+') {
      res.push(rem)
    } else if (token === '$') {
      if (rem === '-1') {
        res.push(null)
        continue
      }
      const len = parseInt(rem)
      i++
      line = lines[i]
      const str = line.slice(0, len)
      res.push(str)
    } else if (token === ':') {
      res.push(parseInt(rem))
    } else {
      throw new Error(`Unknown token: ${token} (${rem})`)
    }
  }
  return res
}
