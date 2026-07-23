# Deployment recommendation

Use the **regional deployment** for this workload:

- It keeps request latency low.
- It supports [automatic failover](https://example.com/failover).
- It can be deployed from the existing pipeline.

```ts
const deployment = {
  regions: ['iad1', 'sfo1'],
  failover: true,
}
```

| Option | Latency | Recovery |
| --- | ---: | ---: |
| Regional | 42 ms | Automatic |
| Single region | 118 ms | Manual |

> Verify database replication before shifting production traffic.

1. Deploy the new region.
2. Run the smoke tests.
3. Shift ten percent of traffic.

The existing configuration remains available as a rollback target.
