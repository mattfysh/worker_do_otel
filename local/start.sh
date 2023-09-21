set -e

sh local/build.sh

docker compose \
  -f local/compose.yaml \
  --env-file local/cf/.env \
  up --build
