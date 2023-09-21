# docker usage

Uses local miniflare, as wrangler dev is unable to connect to local redis instance

```
pnpm install
pnpm start
```

While running local environment, running `pnpm build` will rebuild & restart the worker inside the container

Run tests from outside the container with `curl http://localhost:7000`

# durable upstash objects (duo)

- upstash-backed durable objects
- uses a global network of redis db's for storage
- optional optimistic mode for faster performance replays durable object request
  in a number of client modes until success
    1. read only
    2. optimistic lock (redis WATCH/MULTI/EXEC)
    3. pessimistic lock (redis SETNX on lock key)


# otel issues

* none 🎉

# setup

```
pnpm install
cd worker-$letter
wrangler deploy
(optional) wrangler secret put HONEYCOMB_API_KEY
```
