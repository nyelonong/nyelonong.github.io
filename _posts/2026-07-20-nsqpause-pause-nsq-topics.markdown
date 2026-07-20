---
layout: post
title:  "Need to Pause an NSQ Topic During a Deploy? Here's the Tool."
date:   2026-07-20
categories: [learnings]
---


*Let's talk honestly about message queues in production. You deploy a new version, and suddenly your half-migrated consumer is eating messages it can't process yet. The topic keeps firing. You watch the error count climb.*

***

We've all been there. NSQ is great until you need to freeze a topic mid-deploy and there's no built-in "pause everything" button you trust. You could `nsqadmin` click around, but that's manual, per-channel, and easy to forget one.

So I built **nsqpause** — pause and unpause NSQ topics and channels from one CLI, with a worker pool so it scales to however many targets you throw at it.

## 0. The Problem: NSQ Has Pause, but No Batch

NSQ topics and channels support paused state. But pausing is per-resource, via the HTTP API or nsqadmin UI. If you run ten topics with multiple channels each, a deploy freeze means ten-plus manual pauses — and unpausing them all after is just as tedious.

Worse: you want to pause *before* you roll, not after errors start. The tool has to be fast and scriptable.

## 1. What nsqpause Does

Four actions:
- `pause` — pause topics or channels
- `unpause` — resume them
- `empty` — drain a topic/channel
- `info` / `check` — inspect current state

Targets are an array of topics or channels:
```
topic: topicsatu
channel: topicsatu/channelsatu
```

Example run:
```
╰─$ ./nsqpause
nsqpause is ready.
topicsatu/channeldua is paused
topicsatu/channelsatu is paused
topicdua is paused
```

## 2. The Worker Pool

This is the part that makes it useful at scale. The pool size `n` is bounded:

```
1 <= n <= len(targets)
0 = unlimited (as fast as the client allows)
```

So you can pause fifty channels safely without hammering the nsqd HTTP API, or go unlimited for a small set. The flag is one number.

## 3. Why a CLI and Not a Script

Because it's repeatable and reviewable. A deploy runbook can call `./nsqpause pause topicsatu topicsatu/channelsatu` as step one, and `./nsqpause unpause ...` as the last step. No clicking, no "did I unpause channeldua?" guesswork. It's also docker-compose ready for local testing:

```bash
docker-compose up -d
go build
./nsqpause
```

## The Honest Conclusion

NSQ gives you pause primitives. nsqpause gives you a batch button you can trust in a runbook. If you run NSQ in production and deploy more than once a month, this saves you from the error-count climb.

→ github.com/nyelonong/nsqpause
