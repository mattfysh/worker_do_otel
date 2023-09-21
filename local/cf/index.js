const http = require('node:http')
const { Writable } = require('node:stream')
const { text } = require('node:stream/consumers')
const { Miniflare, Log } = require('miniflare')
const { pick } = require('lodash')

const PORT = process.env['PORT'] || 7000

const envKeys = [
  'REDIS_HOST_AU',
  'REDIS_HOST_AS',
  'REDIS_HOST_EU',
  'REDIS_HOST_US',
  'HONEYCOMB_API_KEY',
]

let mf

function restart() {
  console.log('[miniflare] RESTART')
  mf = new Miniflare({
    log: new Log(),
    verbose: true,
    name: 'worker',
    scriptPath: './worker.js',
    modules: true,
    compatibilityDate: '2023-05-18',
    compatibilityFlags: ['nodejs_compat'],
    bindings: pick(process.env, envKeys),
  })
}

restart()

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/restart') {
      restart()
      res.statusCode = 200
      res.end('worker restarted...\n')
      return
    }

    const url = `http://any${req.originalUrl}`
    let body = (await text(req)) || undefined

    const query = await mf.dispatchFetch(url, {
      method: req.method,
      headers: req.headers,
      body,
    })

    const headers = {}
    for (const [key, value] of query.headers) {
      headers[key.toLowerCase()] = value
    }

    res.writeHead(query.status, query.statusText, headers)
    if (query.body) {
      await query.body.pipeTo(Writable.toWeb(res))
    } else {
      res.end()
    }
  } catch (e) {
    res.statusCode = 500
    res.end(`error: ${e}`)
  }
})

server.listen(PORT, () => {
  console.log(`Cloudflare running at on port ${PORT}`)
})
