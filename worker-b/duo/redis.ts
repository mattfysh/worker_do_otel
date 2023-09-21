import { Buffer } from 'node:buffer'
import { connect } from 'cloudflare:sockets'

type Queue = ReturnType<(typeof Promise)['withResolvers']>[]
export type Redis = ReturnType<typeof getRedis>

function getClient(addr: string, queue: Queue) {
  const useTls = addr !== 'redis:6379'
  const socket = connect(addr, {
    secureTransport: useTls ? 'on' : 'off',
    allowHalfOpen: false,
  })
  const writer = socket.writable.getWriter()
  const encoder = new TextEncoder()

  setTimeout(async () => {
    for await (const chunk of socket.readable) {
      let responses

      try {
        responses = parse(chunk)
      } catch (e) {
        queue[0]?.reject(e)
        break
      }

      responses.forEach(x => {
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
    if (cmd[0] !== 'AUTH') {
      console.log('SENDING:', ...cmd)
    }
    const resp = build(cmd)
    const p = Promise.withResolvers()
    queue.push(p)
    await client.write(resp)

    const timer = new Promise((_, reject) => {
      const timerId = setTimeout(() => {
        reject(new Error('Operation timed out after 1000ms'))
      }, 1000)

      p.promise
        .then(() => clearTimeout(timerId))
        .catch(() => clearTimeout(timerId))
    })

    return Promise.race([p.promise, timer])
  }

  if (pass) {
    send('AUTH', pass)
  }

  return {
    async get(key: string) {
      const value = (await send('HGET', hashKey, key)) as null | string
      return value === null ? undefined : value
    },
    async put(key: string, value: string) {
      await send('HSET', hashKey, key, value)
      return true
    },
    watch() {
      return send('WATCH', hashKey)
    },
    async writeEntries(entries: Record<string, string>) {
      send('MULTI')
      send('HSET', hashKey, ...Object.entries(entries).flat())
      return send('EXEC')
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
    const next = () => lines[++i]
    const value = parseLine(lines[i], next)
    res.push(value)
  }
  return res
}

function parseLine(line: string, next: () => string): any {
  const token = line[0]
  const rem = line.slice(1)

  switch (token) {
    case '+':
      return rem

    case ':':
      return parseInt(rem)

    case '-':
      throw new Error(`Redis error: ${rem}`)

    case '$': {
      if (rem === '-1') {
        return null
      }
      const length = parseInt(rem)
      const str = next()
      return str.slice(0, length)
    }

    case '*': {
      const length = parseInt(rem)
      const arr = []
      for (let i = 0; i < length; i++) {
        const value = parseLine(next(), next)
        arr.push(value)
      }
      return arr
    }

    default:
      throw new Error(`Unknown token: ${token} (${rem})`)
  }
}
