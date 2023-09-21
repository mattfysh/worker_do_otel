set -e

esbuild worker-b/index.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  "--external:cloudflare:*" \
  --main-fields=module,main \
  --format=esm \
  --outfile=local/cf/dist/worker.js

sleep 1

curl -X POST http://localhost:7000/restart || echo "Failed to restart worker"
