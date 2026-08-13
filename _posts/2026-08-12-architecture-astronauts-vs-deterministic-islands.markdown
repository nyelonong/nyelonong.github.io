---
layout: post
title:  "Architecture Astronauts vs Deterministic Islands"
date:   2026-08-12
categories: [blog]
---


*Let's talk honestly about a failure mode that sounds intelligent right up until the system has to do something dangerous: architecture astronautics.*

You draw the boxes. You name the layers. You add an event bus, a policy engine, a workflow runtime, and maybe a service mesh for good measure. Everyone nods.

Then an autonomous coding agent proposes that a pull request is ready to merge because it *looks* ready to merge.

And suddenly the boxes are not helping.

***

# 0. The Problem With Flying Too High

An architecture astronaut is not someone who likes architecture. Architecture is useful. The problem starts when we stay at a high level for so long that we forget the actual problem, constraints, failure modes, cost, and behavior of the real system.

The usual signs are easy to recognize:

- Jargon without clear inputs and outputs.
- Designing for hypothetical scale before measuring current scale.
- Choosing technologies before stating the invariant.
- Drawing only the happy path.
- Treating a diagram as evidence that the system works.

I have learned to use a simple ordering instead:

```text
Problem → Constraint → Invariant → Smallest working design
                                      ↓
                              Measured bottleneck
                                      ↓
                           Additional complexity
```

What problem are we solving? What must always be true? What can be eventually consistent? What happens when a dependency is down? Which complexity are we actually willing to pay for today?

If we cannot answer those questions, a more impressive architecture diagram will not save us.

# 1. The Grounding Pattern: A Deterministic Island

A deterministic island is a deliberately small part of a larger system where the important decision is reproducible and verifiable.

The surrounding system can be probabilistic. A user can be ambiguous. An LLM can suggest the wrong thing. An external API can be slow. But once the system reaches the island, we normalize the input, apply explicit rules, validate facts, and only then allow a side effect.

```text
User / LLM / API
       │
       │ proposal or normalized command
       ▼
┌────────────────────────────┐
│     DETERMINISTIC ISLAND    │
│  schema + rules + state     │
│  policy + idempotency       │
└──────────────┬─────────────┘
               │ verified effect
               ▼
          DB / Git host / API
```

This is not a claim that the whole application must be deterministic. That would be impractical, and sometimes undesirable.

It is a claim about boundaries: the part that decides correctness should not depend on the model's confidence, prose, or memory of what happened.

The model may propose. The external system supplies facts. The policy decides. The executor performs the effect.

# 2. Why Autonomous Coding Makes This More Important

An autonomous coding system is useful precisely because it can operate in uncertain space. It can read an issue, understand intent, generate a patch, inspect a failure, and choose a tool.

Those are good jobs for a probabilistic shell:

```text
┌──────────────────────────────────┐
│       Probabilistic shell         │
│ intent · planning · patch ·       │
│ diagnosis · ranking · tool choice │
└─────────────────┬────────────────┘
                  │ proposal
                  ▼
┌──────────────────────────────────┐
│       Deterministic core          │
│ schema · auth · state transition  │
│ idempotency · invariants · audit  │
│ timeout · cost limit · escalation │
└─────────────────┬────────────────┘
                  │ approved effect
                  ▼
              External system
```

The shell is where flexibility lives. The island is where blast radius is controlled.

The mistake is asking the agent to be both the planner and the source of truth. An agent can say, "the checks passed," but that sentence is not a check result. It is a claim that must be verified against the system that owns the check data.

# 3. A Small Invariant Beats a Large Workflow Diagram

Suppose we have a workflow that moves a work item to `DONE` after an agent finishes a change. The requirement sounds simple:

> Move to `DONE` only when a linked pull request exists, the pull request is actually merged, all required checks pass, and there is no conflict.

That is an invariant. It is much more useful than saying, "the agent handles the delivery lifecycle."

A small policy function makes the boundary visible:

```go
func CanMoveToDone(pr PullRequest) error {
    if pr.ID == "" {
        return ErrMissingPullRequest
    }
    if pr.State != "MERGED" {
        return ErrPullRequestNotMerged
    }
    if !pr.RequiredChecksPassed {
        return ErrChecksNotPassed
    }
    if pr.HasConflict {
        return ErrPullRequestConflicted
    }
    return nil
}
```

The function is not clever. That is the point.

An agent may misread a comment, hallucinate a status, or retry the same request twice. The policy still rejects an unproven transition.

The general form is straightforward:

```text
next_state = transition(current_state, event, verified_facts)
```

Given the same current state, event, and facts, the decision should be the same. A deterministic system can still use a database and an event stream. Deterministic does not mean stateless. It means the decision logic is explicit enough to test and replay.

# 4. State Machines Are Not Overengineering Here

People sometimes hear "state machine" and imagine a framework, a DSL, and several weeks of ceremony. We do not need that.

Even a small table is enough to expose the rules:

| Current state | Event | Verified condition | Next state |
|---|---|---|---|
| `REVIEW` | checks fail | failure is reported by CI | `NEEDS_FIX` |
| `REVIEW` | conflict detected | conflict is confirmed | `NEEDS_REBASE` |
| `REVIEW` | completion requested | merged, checks green, no conflict | `DONE` |
| `REVIEW` | completion requested | any condition is unproven | `REVIEW` |

That last row is important. When evidence is missing, the safe default is usually not success. It is no transition, a retry, or a human escalation.

A good deterministic island usually has these properties:

1. Inputs are normalized into a schema.
2. Facts are fetched from authoritative systems.
3. Policy checks are explicit.
4. Side effects have an idempotency key.
5. Retries have defined semantics.
6. Decisions and evidence are recorded.

This gives us something we can test without asking a model to recreate the same thought twice.

# 5. The Boundary Is the Architecture

Here is the provocative part: the deterministic island is not a minor implementation detail. It is often the most important architectural decision in the system.

The question is not, "How do I make the agent autonomous everywhere?"

The better questions are:

- Where can a wrong decision cause damage?
- Which facts must be fresh?
- Which transitions need authorization?
- Which effects must happen exactly once, or at least appear exactly once?
- Where should ambiguity stop and reach a human?

The more expensive or irreversible the side effect, the closer the final decision should be to the deterministic boundary.

```text
Low risk / reversible                         High risk / irreversible
        │                                                │
        ▼                                                ▼
Model suggestion → validation → preview → approval → side effect
     flexible       explicit       observable   gated     controlled
```

The agent can draft a patch freely. It should not silently merge code because its own summary says the patch is safe.

# 6. What This Does Not Solve

A deterministic island is a grounding pattern, not a magic shield.

External facts can still be stale. Webhooks can arrive late or twice. Two workers can race. A timeout can happen after the remote system accepted the request. A retry can accidentally duplicate an effect if idempotency is missing.

So the island still needs engineering:

- Fetch facts close to the decision.
- Treat duplicate events as normal.
- Use idempotency keys for effects.
- Make retries explicit instead of automatic everywhere.
- Record the evidence used for a decision.
- Put timeouts and cost limits around agent work.
- Escalate when the policy cannot establish correctness.

The goal is not perfect certainty. The goal is to make uncertainty visible and prevent it from pretending to be certainty.

# 7. The Rule I Keep Coming Back To

Architecture astronautics starts with abstractions and hopes reality will fit them later.

A deterministic island starts with an invariant and builds the smallest boundary that can protect it.

For agentic and autonomous coding systems, the division of labor is simple:

```text
Agent       = probabilistic planner and proposal generator
Policy      = deterministic correctness boundary
Human       = exception handler for risk and ambiguity
```

We should not make every part of the system rigid. That would throw away the useful creativity of an agent.

But we should stop asking a probabilistic component to be the final authority on facts it does not own. Keep the shell flexible. Keep the correctness boundary boring, explicit, testable, and replayable.

That is not less ambitious architecture.

It is architecture that has finally landed.
