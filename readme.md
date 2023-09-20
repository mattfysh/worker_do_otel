# durable upstash objects (duo)

* optimistic locking
* pessimistic locking
* `id:key` string vs `id` hash
* create pulumi stack, one upstash db per region
* route `newUniqueId` to closest
* route `idFromString` to db embedded in id
* global `idFromName` owner check

# otel issues

* none 🎉

# setup

```
pnpm install
cd worker-$letter
wrangler deploy
(optional) wrangler secret put HONEYCOMB_API_KEY
```
