---
layout: post
title:  "Don’t Trust the Agent. Trust the Verification Loop."
date:   2026-08-16
categories: [blog]
---

*An AI agent can tell you it is done with complete confidence. The code can still be broken.*

***

That sentence sounds obvious, but it is surprisingly easy to forget when an agent has just produced a clean summary, a confident explanation, and a reassuring green-looking status message.

I have been building a small autonomous engineering workflow where different agents take different roles: one plans, one implements, and another reviews. The interesting lesson was not that agents can write code quickly. We already know that. The interesting lesson was discovering what “trust” has to mean when the worker is not a person, the output is probabilistic, and the cost of a mistake can be much larger than the cost of one more check.

The answer is uncomfortable but useful: do not try to trust the agent as an individual. Design the surrounding system so wrong work becomes visible, damage stays bounded, and consequential actions require evidence.

## 0. “Done” Is Not Evidence

Let’s start with the most dangerous completion signal: the agent saying it is finished.

An agent can write:

```text
Implemented the change. Tests pass. Ready to merge.
```

That is a report. It is not proof.

The report may be accurate. It may also be based on a test command that was never run, a partial test suite, the wrong working tree, or an assumption that the requested behavior was obvious. Even when the agent is not deliberately misleading us, it is still generating a plausible description of its own work. Plausible is not the same as verified.

Humans do this too. “I think I fixed it” is not a completion condition for production code. We normally turn that feeling into evidence by running tests, reviewing a diff, checking logs, and asking another engineer to look at the risky parts.

Why would we remove those habits just because the worker is an AI?

A better rule is simple:

> The agent’s confidence can be part of the context. It cannot be the gate.

## 1. Confidence Is Not a Stop Condition

Many agent workflows accidentally loop on confidence. The worker makes a change, says it looks good, and the orchestrator treats that statement as permission to move on.

That creates a feedback loop like this:

```text
agent: “I believe this is correct”
       |
       v
system: “Good enough, continue”
       |
       v
agent: “I believe the next step is correct”
```

Nothing in that loop is anchored to reality.

A verification loop looks different:

```text
spec -> implementation -> deterministic checks
                 |                  |
                 |                  v
                 +---------- independent review
                                    |
                     revise <-------+-------> approve
                                      |
                               human decision
```

The stop condition is not “the model sounds certain.” The stop condition is a collection of observable facts:

- the requested behavior is covered by the change,
- typechecking succeeds,
- tests actually run and pass,
- the project builds,
- an independent reviewer finds no blocking issue,
- and a human approves the consequential action.

This may look slower than accepting a confident answer. In practice, it is much faster than debugging a change that was allowed to escape because everyone mistook fluency for correctness.

## 2. The Worker Should Not Be the Sole Verifier

The person who writes a change can review it, of course. But they should not be the only review mechanism for work that matters. The same is true for an AI worker.

An implementation agent has already formed a theory of the task. It has chosen an approach, created assumptions, and spent effort defending that approach. When asked to review its own work immediately, it tends to inspect the change through the same frame that produced it.

That is not a moral failure. It is a structural problem.

In my workflow, I separate the roles:

```text
PLANNER  -> defines the intended change
   |
   v
WORKER   -> writes the implementation
   |
   v
REVIEWER -> tries to find why it should not be accepted
   |
   v
HUMAN    -> approves merge or deploy
```

The reviewer is not there to produce another friendly summary. Its job is to challenge the implementation. Does the change satisfy the actual requirement? What assumptions are untested? What happens on an error path? Did the implementation quietly change behavior outside the requested scope?

Role separation is useful even with strong models. A second model is not automatically independent, but a fresh task, fresh context, and a different responsibility make independent judgment more likely.

## 3. Fresh Context Beats Shared Confidence

A reviewer should not inherit the worker’s entire reasoning transcript and then simply agree with it. That is how shared confidence turns into shared blind spots.

A fresh-context review starts from the artifacts that matter:

- the task or specification,
- the current diff,
- the relevant source files,
- the project’s normal validation commands,
- and the reviewer’s own questions.

It does not start with: “The previous agent says this is correct.”

That small distinction changes the reviewer’s posture. Instead of validating a story, it investigates a change.

For example, the worker might say:

```text
Added the endpoint and handled invalid input.
```

A fresh reviewer should ask:

```text
- What is the expected behavior for invalid input?
- Is the response shape consistent with nearby endpoints?
- Does the test cover malformed and missing values?
- Is the endpoint registered in the real application path?
- Did the build include the new file?
```

The reviewer is allowed to reach the same conclusion as the worker. Agreement is fine. The important part is that agreement is earned independently rather than copied from the previous explanation.

## 4. Deterministic Anchors Are the Floor

Models are good at interpretation. They are not a replacement for tools that can answer exact questions.

If the question is “does this typecheck?”, use the typechecker. If the question is “does the test suite pass?”, run the tests. If the question is “can this project produce its artifact?”, run the build.

These are deterministic anchors: checks that do not care how persuasive the agent sounds.

A generic implementation gate might look like this:

```bash
npm run typecheck
npm test
npm run build
```

The commands will vary by project. The principle does not. The agent can explain what it changed, but the system should execute the anchors itself and retain their output.

This is also where typed boundaries help. If an agent is allowed to call a tool with a structured input, validate that input before execution. If it proposes a file change, show a diff. If it reports a number, make the number traceable to a source or a command output.

There is an important limit here: passing tests do not prove that the feature is correct. Tests can be incomplete. A build can succeed while the product requirement is misunderstood. Deterministic anchors are the floor, not the entire building.

That is why they work together with independent review. The reviewer checks meaning and scope. The anchors check repeatable mechanical facts. Neither should pretend to cover the other’s blind spots.

## 5. Revision Loops Need a Boundary

A useful review system does not merely return “approved” or “rejected.” It creates a bounded revision loop.

The pattern is straightforward:

1. The worker implements the task.
2. The worker runs the required anchors.
3. The independent reviewer examines the diff and reruns the anchors.
4. If the reviewer finds a blocking issue, the worker revises.
5. The reviewer checks the new result from fresh context.
6. After a small number of failed iterations, the workflow escalates to a human.

The boundary matters. Without one, an autonomous workflow can spend forever trying slightly different versions of the same answer. More retries do not automatically create more correctness. Sometimes the task is ambiguous. Sometimes the requirement is wrong. Sometimes the model is stuck.

A bounded loop turns that into a visible decision:

```text
review -> block -> revise -> review -> block -> revise
                                      |
                         limit reached: escalate
```

Escalation is not a failure of automation. It is a healthy output. The system has learned that the current evidence is insufficient and that a human needs to decide what happens next.

This is one place where an engineering methodology such as Galdr fits naturally: the value is not in giving an agent a grand personality, but in making the workflow explicit, evidence-driven, and repeatable. The method should make it difficult for a model to silently convert uncertainty into progress.

## 6. Human Approval Belongs at the Consequential Edge

There is a difference between allowing an agent to prepare a change and allowing it to release that change.

Creating a branch is reversible. Opening a pull request is visible and reviewable. Merging into the main line has wider impact. Deploying can affect real users, data, money, or availability.

The more consequential and harder-to-reverse the action, the stronger the approval gate should be.

A practical separation looks like this:

| Action | Reasonable automation |
|---|---|
| Read issues and source files | Yes, with scoped access |
| Create a branch and draft changes | Yes |
| Run typecheck, tests, and build | Yes |
| Open a pull request | Usually yes |
| Merge to the main line | Human approval |
| Deploy to production | Human approval |
| Delete data or trigger an external transaction | Explicit human approval |

This does not mean a human must watch every tool call. That would defeat the purpose of delegation. It means the human owns the points where a mistake crosses a meaningful boundary.

In an anonymized personal engineering experiment, the agents could plan work, implement changes, open reviewable proposals, and send status reports. They could not be the final authority for merge or deployment. My job was not to inspect every keystroke. My job was to inspect the evidence at the gate and decide whether the system had earned the next level of access.

That distinction is important. Human-in-the-loop does not mean human-as-keyboard-monitor. It means human-as-accountability-holder.

## 7. Trust Is a Property of the System

We often describe models with personality words: honest, careful, confident, lazy, stubborn. These descriptions can be useful shorthand, but they are not an engineering control.

A model can sound honest and still be wrong. A model can sound uncertain and still produce the best solution. Personality is a weak signal. System design is stronger.

I would rather use a modest model inside a workflow with:

- least-privilege access,
- reversible changes,
- visible diffs,
- deterministic anchors,
- fresh-context review,
- bounded retries,
- useful logs,
- and a human gate for consequential actions,

than use a more impressive model with permission to change everything and no requirement to show its work.

Trust is not a feeling we give to the model. Trust is a property the system demonstrates over time. It comes from making failure observable, limiting the radius of failure, and collecting enough evidence to justify the next action.

That also changes how we evaluate agent products. Do not ask only, “How smart is the model?” Ask:

```text
What can it access?
What does it record?
Which claims are mechanically checked?
Who independently reviews the result?
How many times can it retry?
What happens when it is stuck?
Who must approve the irreversible step?
```

Those questions are less exciting than a demo where an agent edits a project overnight. They are much more useful when the project matters.

## 8. A Practical Checklist

Before letting an agent work on a consequential engineering task, ask:

- Is “done” defined by evidence rather than by a status message?
- Are typecheck, tests, and build run by the system, not merely claimed by the worker?
- Is the reviewer independent and started from fresh context?
- Can the worker and reviewer inspect the same diff and the same artifacts?
- Is the revision loop bounded?
- Does the workflow escalate instead of retrying forever?
- Are changes reversible and access limited by least privilege?
- Does a human approve merge, deploy, deletion, or external transactions?
- Can I reconstruct what happened after something goes wrong?

If the answer to several of these is “no,” the problem is not that the model needs a more confident personality. The system needs a better verification loop.

Do not trust the agent.

Trust the evidence, the boundaries, and the process that makes both visible.
