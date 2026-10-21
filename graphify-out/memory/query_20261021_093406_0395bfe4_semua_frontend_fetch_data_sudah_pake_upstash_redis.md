---
type: "query"
date: "2026-10-21T09:34:06.794509+00:00"
question: "semua frontend fetch data sudah pake upstash redis?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["SmartCache", "get_redis_client", "acquire_idempotency_lock"]
---

# Q: semua frontend fetch data sudah pake upstash redis?

## Answer

Expanded from original query via vocab: [redis, cache, fetch, proxy, client, frontend, product, order]. Traversed graph and analyzed backend caching architecture: Upstash Redis is deployed on the backend as a central distributed cache (SmartCache) and idempotency lock layer. Frontends (user, admin, sales) do not call Redis directly for security and business logic reasons; instead, all frontend data-fetching hooks (products catalog, product detail, banners, payment configuration, active campaigns) query the FastAPI backend, which serves responses from Upstash Redis with HTTP ETag / 304 validation.

## Outcome

- Signal: useful

## Source Nodes

- SmartCache
- get_redis_client
- acquire_idempotency_lock