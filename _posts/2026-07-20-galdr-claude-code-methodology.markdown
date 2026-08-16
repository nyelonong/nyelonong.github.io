---
layout: post
title:  "I Built a Methodology Pack So Claude Code Stops Writing Garbage"
date:   2026-07-20
categories: [blog]
---

*Let's talk honestly about one of the most annoying things about AI coding tools: they will happily write 400 lines of confident nonsense if you don't make them prove anything.*

***

You give an agent a rough idea. It goes off and builds something. Then you discover half of it has no tests, the other half calls functions that do not exist, and the "working" version works only because it quietly swallowed three errors.

We've all been there. And every time, we tell ourselves: "I'll add discipline next time." Spoiler: we don't.

I started **galdr** from a Claude Code workflow I was already using. It has grown into an evidence-gated engineering methodology for coding agents: it now supports **Claude Code, OpenAI Codex, and Google Antigravity**. The idea is simple: route the request, shape the work, build from a failing test, and do not call anything done without fresh evidence.

## 0. The Problem Is Not That Agents Are Fast

Fast is useful. The problem is that an agent can be fast in the wrong direction.

Most workflows land in one of two places:

- **No process** — type an idea, accept the output, and debug the consequences later.
- **Too much process** — stack several overlapping instruction packs on every session until the agent spends more effort navigating the workflow than doing the work.

Neither is what I want. I want a method that adds structure when the request needs it, stays out of the way when it doesn't, and leaves behind enough evidence for the next session to trust.

That is the job of galdr.

## 1. The Flow: Route → Shape → Plan → Waves → Verify → Memory

The core flow looks like this:

```
rough request
     |
   route       choose the right entry point
     |
   shape       turn ambiguity into an agreed specification
     |
   plan        split the specification into testable waves
     |
   waves       execute bounded work with evidence gates
     |
  verify       collect fresh evidence and run independent review
     |
  memory       record what happened so the next session can resume
```

The names are not decoration. Each stage answers a different question:

- **`route`** — Is this a feature, a bug, a design question, a prototype, or something that needs no ceremony?
- **`shape`** — What exactly are we building? The agent asks one decision at a time, makes a recommendation, and turns the answers into a written spec.
- **`plan`** — How can we build that spec as small, write-scoped, independently testable tasks?
- **`waves`** — Which tasks can run together, and what evidence must exist before the next wave starts?
- **`verify`** — Did the checks actually run? Is the evidence fresh? Does an independent reviewer agree with the spec and the implementation?
- **`memory`** — What was decided, what passed, what failed, and what should the next session verify before continuing?

A rough idea should not jump straight to production code. But a tiny question should not require a ceremony either. Routing is the part that keeps the methodology practical.

## 2. Failing Test First Is the Brake

The most important rule is also the easiest to explain:

> No production code without a failing test first.

That means we start with a focused RED test that expresses the behavior we expect. Only then do we write the smallest implementation that makes it GREEN.

```text
RED   -> write the test and watch it fail for the right reason
GREEN -> implement the smallest behavior that passes
VERIFY -> run the relevant checks again and record fresh evidence
```

Why insist on seeing RED? Because a test that has never failed might not test anything useful. It may be wired to the wrong function, assert the wrong result, or pass for an accidental reason.

The failing test is not bureaucracy. It is the first proof that the test can catch the bug we are trying to prevent.

## 3. "Done" Needs Fresh Evidence

An agent saying "done" is a claim, not evidence.

galdr treats verification as a separate step. The workflow runs the relevant checks, records the result, includes skipped checks in the report, and refuses to quietly convert "I think this works" into "this works."

That distinction matters when a command was not run, when a test was filtered out, or when the code changed after the last successful check. Fresh evidence means evidence from the current state, not a memory of an earlier state.

There is also an independent review pass. A fresh context checks the work against the specification first, then checks the code quality. This is deliberately separate from the agent that wrote the code. Otherwise the same reasoning that produced a mistake is also the only reasoning judging it.

## 4. Memory and Crash Recovery

What happens when the session dies halfway through a task? Or the context gets compacted? Or you close the terminal and return tomorrow?

Without durable memory, the agent has to guess. That is where duplicated work and invented status reports begin.

galdr keeps the important state in a durable record: decisions, task progress, evidence, review verdicts, and the next safe action. A new session reads that record and re-verifies the last claims before continuing.

This also makes crash recovery possible. If a session stops unexpectedly, the next one can inspect what actually landed, separate completed work from in-flight work, and resume from the ledger instead of pretending it remembers the conversation.

## 5. Usage-Aware Execution

An agent should know when to stop.

Long-running work is split into waves, and execution pays attention to usage rather than burning through a limit in the middle of an uncommitted task. When the budget or quota says to pause, the workflow parks cleanly, keeps completed work intact, and leaves a resumable record.

That is a small change in behavior with a big practical effect. "We ran out of context" becomes "we stopped at a known boundary and can continue from there."

## 6. Small Enough to Keep Around

The current public package contains **21 skills**, each available as a slash command. It is pure Markdown with no build step. The skills cover the always-on discipline, the main route-to-merge flow, debugging, review, usage, backlog, and a few on-ramps for work that should not start with a full feature plan.

The same methodology can be installed for the three supported runtimes. The wiring differs between Claude Code, Codex, and Antigravity, but the engineering rules stay the same: failing test first, fresh evidence before done, independent review, durable memory.

That was the point of moving beyond the original Claude Code workflow. The method should travel with the engineer, not be trapped inside one interface.

## 7. The Honest Conclusion

galdr does not make an agent smarter. It makes the agent more accountable.

It gives us a route through ambiguity, a failing test before implementation, evidence instead of optimism, a second set of eyes, and memory that survives the session. That is enough to change the kind of work an agent can safely do.

If you want to see the methodology, the public repository is here:

→ [github.com/nyelonong/galdr](https://github.com/nyelonong/galdr)

## 8. A Separate Toolkit for Pi Users

I also built **[pi-packages](https://github.com/nyelonong/pi-packages)** as a separate public toolkit for people who use Pi. It is **not a Pi port of galdr** and should be treated as its own package.

It includes extensions for `ask_decision` and `council`, workflow skills for `investigate`, `shape`, `implement`, `verify`, and `go-engineering`, plus shortcuts such as `feature-journey` and `task-boundary`.

Different package, same interest: make the agent show its work instead of asking us to trust a confident paragraph.
