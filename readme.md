# issues

* rc.12 `isFetcher` throws an error
* manually patched rc.12, service binding is still not auto-instrumented

make spans for req 2 + 3 show up

# setup

```
pnpm install
cd worker-$letter
wrangler deploy
(optional) wrangler secret put HONEYCOMB_API_KEY
```



# run

curl https://<worker.dev.url>/?name=foo
