---
layout: post
title:  "I Built a Methodology Pack So Claude Code Stops Writing Garbage"
date:   2026-07-20
categories: [learnings]
---


*Let's talk honestly about one of the most annoying things about AI coding tools: they'll happily write 400 lines of confident nonsense if you don't fence them in.*

***

You run Claude Code. You give it a rough idea. It goes off and builds something. Then you realize half of it doesn't have tests, the other half references functions that don't exist, and the "working" version only works because it silently swallowed three errors.

We've all been there. And every time, you tell yourself: "I'll add discipline next time." Spoiler: you don't.

So I built **galdr** — a methodology pack that takes a rough idea all the way to a reviewed, merged branch. Old Norse for "incantation." A personal engineering method for Claude Code: routed requests, wave-based TDD plans, evidence gates, and durable memory.

## 0. The Problem: Too Much Process, or None

Most people run AI coding tools one of two ways:
- **No process** — type an idea, pray it works, debug for hours.
- **Too much process** — five overlapping skill packs, competing conventions, a standing context cost you pay on every single session.

Neither matches how I actually work. I want to shape an idea into a spec, turn it into a wave-based TDD plan, run it with subagents behind evidence gates, and keep memory so nothing is lost across a `/clear` or a dead session.

## 1. What galdr Actually Does

galdr routes every substantive request to the right amount of process — no more, no less:

```
rough idea → route → shape → plan → waves → review → branches → merged
```

- **`shape`** — turns a fuzzy idea into a written spec. Grills you one decision at a time, each with a recommendation, until nothing is ambiguous.
- **`plan`** — turns the spec into a wave-based task DAG: write-scoped, independently testable tasks with declared dependencies.
- **`waves`** — executes the tasks with subagents, wave by wave, gating each wave on real evidence, not a subagent's "done."
- **`review`** — a fresh-context reviewer checks the work against the spec first, then against code quality.
- **`branches`** — finishes: full gate run, a manual smoke sheet, and a merge/push decision that is always yours.

## 2. The Part That Keeps It Honest

Three things stop galdr from lying to you:

**Evidence gates.** Every RED, GREEN, gate, and review verdict is a greppable `EV` line in `memory-progress.md`, tied to the commit that produced it. You can't fake "done."

**Durable memory.** State lives in `memory.md` and `memory-progress.md`. A new session reads them first and re-verifies claims with commands — so work survives `/clear`, compaction, and session death.

**Usage-aware.** A pre-dispatch guard parks the run before it burns past your 5-hour / 7-day limit and resumes cleanly. Each wave reports tokens spent and your real usage %.

## 3. Why Pure Markdown

No build step. 17 skills, each also a slash command (`/galdr:<name>`). Small enough to leave on all the time, held to the same standard it holds your code to: every discipline rule was tested against an agent that didn't have it before it shipped.

## The Honest Conclusion

galdr won't make Claude Code smarter. It makes it *disciplined*. If you're tired of reviewing AI-generated slop, fence it in.

→ github.com/nyelonong/galdr
