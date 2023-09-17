# issues

* rc.12 `isFetcher` throws an error
  * manually patched rc.12 using `pnpm patch`
* service binding is still not auto-instrumented
  * added a flag in `worker-a/index.ts` to control
* subsequent calls to DO within same parent worker are not instrumented
* missing spans occur at a highly-reproducible rate

# setup

```
pnpm install
cd worker-$letter
wrangler deploy
(optional) wrangler secret put HONEYCOMB_API_KEY
```
