SECRETS_JSON="$(cd cloud && pulumi stack output dbs --show-secrets --json)"

(
  cd worker-b
  echo "$SECRETS_JSON" | ../node_modules/.bin/wrangler secret:bulk
)
