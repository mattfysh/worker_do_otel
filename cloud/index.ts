import * as pulumi from '@pulumi/pulumi'
import * as upstash from '@upstash/pulumi'

const regions = {
  au: 'ap-southeast-2',
  as: 'ap-southeast-1',
  us: 'us-west-1',
  eu: 'eu-central-1',
}

const dbEntries = Object.entries(regions).map(([code, region]) => {
  const db = new upstash.RedisDatabase(
    `db-${code}`,
    {
      databaseName: `duo-proto-${code}`,
      region: 'global',
      primaryRegion: region,
      tls: true,
    },
    {
      deleteBeforeReplace: true,
      additionalSecretOutputs: ['readOnlyRestToken'],
    }
  )

  return [
    `REDIS_HOST_${code.toUpperCase()}`,
    pulumi.interpolate`redis://default:${db.password}@${db.endpoint}:${db.port}`,
  ]
})

export const dbs = Object.fromEntries(dbEntries)
