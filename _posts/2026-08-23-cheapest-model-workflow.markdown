---
layout: post
title:  "The Cheapest Model Is Not Always the Cheapest Workflow"
date:   2026-08-23 01:12:23 +0700
categories: [learnings]
---

*Sometimes the cheapest model creates the most expensive workflow.*

***

When we compare AI models, we usually compare their token prices first.

That makes sense. A cheaper model appears to reduce cost immediately.

But the model is not the whole workflow. We also pay for retries, repair loops, review time, repeated context, and the cost of fixing a wrong result.

So the real question is not:

> Which model is cheapest?

It is:

> Which model completes this type of work with the least total effort and risk?

## 0. Token Cost Is Only One Cost

A useful mental model looks like this:

```text
Total workflow cost =
    model cost
  + repair time
  + review time
  + repeated context
  + cost of mistakes
```

A cheap model can still be the right choice. If the task is low-risk and easy to check, there is no reason to spend more.

But if a cheap model needs three repair rounds, the original saving may disappear quickly.

The model was cheaper.

The workflow was not.

## 1. Not Every Task Needs the Same Model

I stopped treating model selection as a single global default.

Different tasks have different consequences:

| Task | Suitable default | Why |
|---|---|---|
| Drafting or summarizing | Lower-cost model | A human reviews the result |
| Routine implementation | Balanced model | The work has clear checks |
| Architecture or security review | Stronger model | Missing an important issue is expensive |
| Cross-system changes | Stronger model | There are more assumptions and failure modes |
| Ambiguous requirements | Stronger model or clarification | The main risk is misunderstanding the task |

This is not about declaring one model universally better.

It is about matching reasoning capacity to the cost of being wrong.

A short blog summary does not need the same level of reasoning as a migration that can damage production data. Treating both tasks identically is convenient, but it is not a strategy.

## 2. Route by Consequence, Not Excitement

A task can sound complicated without being risky.

Generating a long document may require many tokens but little judgment. Changing one configuration value may require very little output but carry a large consequence.

I prefer to classify work by consequence:

```text
                         consequence
                              │
              low ───────────┼─────────── high
                              │
                         model strength
                       lower       higher
```

The routing rule can be simple:

```yaml
low_risk:
  examples:
    - draft
    - summary
    - formatting
  default: lower_cost

medium_risk:
  examples:
    - routine implementation
    - refactoring
    - documentation change
  default: balanced

high_risk:
  examples:
    - security review
    - data migration
    - cross-system integration
    - ambiguous architecture
  default: stronger_reasoning
```

The exact model names do not matter here. The policy matters more than the names.

## 3. Escalation Is Part of the Design

Routing does not mean choosing once and forgetting.

A task can start as routine and become complicated after the first failed check.

For example:

```text
classify task
      │
      v
choose default model
      │
      v
implement or analyze
      │
      v
run checks
      │
      ├── evidence is clear ───────► finish
      │
      └── ambiguity or repeated failure
                    │
                    v
              escalate reasoning
```

This is important because the first model does not need to solve every possible future problem.

It only needs to be appropriate for the current evidence.

If the task grows beyond its original scope, escalation is cheaper than forcing the same model through repeated repair loops.

## 4. A Global Default Is Convenient, Not Optimal

A single global default has one major advantage: simplicity.

Every task starts in the same place. Configuration is easier. Expectations are predictable.

But the downside is that the default becomes a hidden policy.

If the default is too weak, difficult tasks create repair loops. If it is too strong, simple tasks become unnecessarily expensive.

The better approach is to keep a default for ordinary work while making the exceptions explicit:

```text
ordinary task
      │
      v
balanced default
      │
      ├── low consequence ──► use less expensive path
      ├── high consequence ─► use stronger reasoning
      └── unclear scope ────► clarify or escalate
```

This keeps the system simple without pretending that every task has the same cost of failure.

## 5. Measure the Workflow, Not Just the Model

Token price is easy to see, so it is tempting to optimize only for it.

A better review asks:

- How often was the first result accepted?
- How many repair rounds were needed?
- How much human review was required?
- How often did the model misunderstand the task?
- How long did the complete workflow take?
- Did the cheaper path create more risk?

These measurements do not need to become a complicated dashboard. Even a small record of failed attempts can reveal that a model is cheap per request but expensive per completed task.

The useful unit is not:

```text
cost per response
```

It is closer to:

```text
cost per accepted result
```

That includes the work required to turn the first output into something we can actually use.

## 6. This Is a Policy, Not a Benchmark

There is no universal model-routing table.

Model quality changes. Prices change. Tasks differ. A model that works well for one codebase or writing style may perform poorly in another.

So this should not be read as a claim that one model category is always superior.

It is a decision rule:

1. Start with the least expensive model that is appropriate for the consequence.
2. Verify the result with deterministic checks or human review.
3. Escalate when the evidence is weak, the scope expands, or repair loops begin.
4. Revisit the policy when the work or model quality changes.

The goal is not to spend the most.

The goal is not to spend the least.

The goal is to avoid paying twice: once for the model, and again for the workflow it created.

## Conclusion

A cheaper model is not automatically a cheaper choice.

For low-risk work, it may be exactly what we need. For high-consequence work, the stronger model can be cheaper overall because it reduces repair, review, and recovery costs.

The practical rule is simple:

> Choose model strength based on the cost of being wrong, then verify the result.

That gives us a better workflow than one global default and a better cost model than token price alone.
