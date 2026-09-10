---
layout: post
title:  "Most Go Templates Are Toy Examples. This One Isn't."
date:   2026-07-20
categories: [learnings]
---


*Let's talk honestly about Go service templates. You clone one, excited, and find a "hello world" handler, a TODO comment where the database should be, and a README that says "add your own auth."*

***

We've all been there. You want to start a real service, not re-derive pgx + sqlc + Redis + JWT + OpenTelemetry from scratch for the ninth time. But every "production-ready" template on GitHub is a toy wearing a trench coat.

So I built **go-service-template** — a starting point that actually runs the boring parts so you can skip to the interesting ones.

## 0. The Problem: Templates Lie About "Production"

A template claims production-ready. You open it:
- HTTP server with one `/ping` endpoint
- No real database layer (or a raw `database/sql` with string concatenation)
- Auth is a comment
- Observability is absent

You spend the first two days rebuilding the foundation instead of the feature. The template saved you nothing.

## 1. What's Actually In It

Two binaries out of the box: `cmd/http` and `cmd/rpc` (gRPC). Feature-first layout — `internal/feature/<name>/` holds a slice: handler, service, repo, tests, all scoped to one capability.

Batteries included, and wired:
- **pgx + sqlc** — typed queries, no hand-written row scanning
- **Redis** — cache with a real client, not a wrapper around `SET`
- **S3** — object storage client ready
- **JWT auth** — verified per request, scoped to identity
- **OpenTelemetry** — traces and metrics from the first request

## 2. The Part Worth Stealing: Resilient Outbound Calls

Most templates show you `http.Get` and call it a day. This one ships a six-pillar resilient caller for outbound dependencies (pricing, enrichment, whatever):

```
retry → singleflight+cache → circuit breaker → timeout
```

Each stage has RED observability (rate, errors, duration), and it's composed locally in one file (`pricing_resilient.go`) so you can read the whole strategy without jumping across packages.

Real example from the order-enrichment slice: atomic `WithTx` multi-statement create, a one-to-many joined list query, a CTE aggregation for summaries, keyset pagination, and the resilient pricing call above — all in one reviewable slice.

## 3. Config Without the Foot-Guns

No `config.development.yaml` / `config.production.yaml` split. The loader is layered:

```
defaults() in code ← CONFIG_FILE (non-secrets) ← env vars (always win)
```

Secrets are env-only, and the loader **rejects** a file-layer key matching `secret` / `password` / `token` / `key` or the path `db.url`. Local dev uses built-in defaults; staging/prod sets secrets via the platform secret manager. You can't accidentally commit a credential into the config file because the guard won't let it load.

## 4. Deployment That Isn't Hand-Waving

Three ready-to-adapt targets under `deploy/`:
- Kubernetes (`deploy/k8s/`)
- AWS ECS Fargate (`deploy/ecs/`)
- Bare VM with systemd (`deploy/systemd/`)

Each has its own README with platform-specific caveats. The common runbook covers what's shared: env strategy, secret injection, health checks.

## The Honest Conclusion

A template should save you the boring 80%, not just scaffold a folder tree. If you're starting a Go service and tired of rebuilding the foundation, steal this one.

→ github.com/nyelonong/go-service-template
