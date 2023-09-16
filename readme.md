# todo

- propagate worker A -> worker B
- inspect honeycomb spans
- setAlarm


# setup

```
pnpm install
```

## 1. Worker B + D/O

```
cd worker-b
wrangler deploy
wrangler secret put HONEYCOMB_API_KEY
```

## 2. Worker A

```
cd worker-a
wrangler deploy
wrangler secret put HONEYCOMB_API_KEY
```


# run

curl https://<worker.dev.url>/?name=foo
