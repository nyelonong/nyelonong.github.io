---
layout: post
title:  "How I Built a Portable Knowledge Layer for AI Agents"
date:   2026-07-26
categories: [blog]
---

*Let's talk honestly about one of the least glamorous problems in AI agent systems: what happens to knowledge after the conversation ends.*

***

An agent can produce an impressive answer and still leave behind a terrible mess. A raw link, a half-formed idea, a final decision, and a private implementation detail all end up in the same folder. The next agent has to guess what is trustworthy, what is current, and what should never be published.

We often try to solve this with a smarter memory feature. But the harder problem is usually not retrieval. It is the contract around knowledge: where it enters, how it becomes durable, who can see it, and how it gets published safely.

I built a small, deliberately boring knowledge layer around that contract. It is portable because it relies on ordinary files, predictable transitions, and Git-friendly boundaries instead of one magical runtime.

## 0. The Shape of the System

The architecture has four surfaces:

```
raw inbox  ->  knowledge compiler  ->  durable notes  ->  reviewed publish
                  |                       |
                  v                       v
             source links             shared memory

          private runtime memory stays outside the shared surface
```

The key idea is that *capture* and *knowledge* are not the same thing.

A raw inbox is allowed to be messy. Durable notes are not. That separation sounds obvious, but it prevents a surprising amount of confusion when multiple agents or sessions touch the same material.

## 1. Raw Input Is Not Knowledge Yet

The first layer accepts rough material:

- links and bookmarks
- chat dumps
- quick observations
- unfinished ideas
- source documents waiting to be processed

At this stage, the content is only an input. It has not been verified, summarized, or promoted to a durable reference. That distinction matters because raw material often contains duplicates, outdated assumptions, or context that only made sense at capture time.

A simple record can be enough:

```yaml
---
type: capture
status: unprocessed
captured_at: 2026-07-26
source: "https://example.com/article"
---

A rough note about the article and why it might matter.
```

The metadata is intentionally small. The goal is not to create a new database schema. The goal is to make the next step explicit.

## 2. Compile Raw Material into Domain Knowledge

The compiler is where an agent can do more creative work. It reads one or more captures, removes noise, adds context, and produces a useful reference for a specific domain.

That output should preserve its relationship to the source material:

```yaml
---
type: knowledge
status: reviewed
source_captures:
  - capture-2026-07-26-example
related:
  - agent-workflows
  - safe-publishing
---

## Summary

A concise explanation of the idea.

## Why it matters

The practical consequence for the system.

## Follow-up

Questions that still need evidence.
```

This is not a demand for perfect notes. It is a demand for honest boundaries. A summary should be recognizable as a summary, and an unresolved question should not quietly become a fact.

## 3. Durable Notes Need an Index

A durable note is useful only if another agent can find it later. I give durable notes a few boring requirements:

1. They have predictable metadata.
2. They link to related notes.
3. They appear in an index or map of content.
4. They explain what is known, what is assumed, and what still needs work.

The index does not need to be clever. A Markdown map is often enough:

```markdown
# Knowledge Map

## Agent workflows

- [Portable knowledge layer](knowledge/portable-knowledge-layer.md)
- [Safe file publishing](knowledge/safe-file-publishing.md)

## Follow-up

- Compare locking strategies
- Document conflict recovery
```

The benefit is not just navigation. The index becomes a lightweight discovery contract. An agent does not have to scan every file and invent its own taxonomy on every run.

## 4. Publishing Should Be Boring

Reasoning can be flexible. File writes and publishing should be predictable.

My record flow is deliberately procedural:

```
lock writer
    |
pull and rebase
    |
validate metadata and links
    |
update the index
    |
stage only expected paths
    |
run secret checks
    |
commit and push
```

The order matters. A write should not blindly overwrite a file that changed underneath it. A publish operation should not stage an entire working tree just because one note changed. And a successful commit should not be treated as permission to skip the checks before it.

A small shell-style outline makes the contract visible:

```bash
acquire_lock
pull_rebase
validate_note "$NOTE"
update_index "$NOTE"
git add -- "$NOTE" "$INDEX"
run_secret_gate
git diff --cached --check
git commit -m "knowledge: publish reviewed note"
git push origin "$BRANCH"
```

The extra space before `git diff` is not intentional in a real script; it is a useful reminder that examples should be reviewed before becoming automation. The important part is the sequence, not the command vocabulary.

If the remote changes during the operation, retrying a pull-and-rebase once is reasonable. Force-pushing is not. A portable workflow should prefer an explicit conflict over silently replacing someone else's knowledge.

## 5. Shared Memory and Private Memory Are Different

Memory is often described as one thing. It is not.

I separate it into at least three categories:

| Surface | Purpose | Sharing rule |
|---|---|---|
| Shared knowledge | Durable, non-secret facts and references | Safe to publish according to review rules |
| Private runtime memory | Temporary context for one user, session, or machine | Keep outside the shared surface |
| Secret storage | Credentials and sensitive configuration | Use a secret manager or restricted storage |

This separation prevents a common failure mode: treating convenience as authorization. Just because an agent can read a value does not mean that value belongs in a shared note or a Git commit.

The shared layer should contain facts that are safe and useful across devices or agents. Private runtime memory can contain working context. Secrets should not be represented as ordinary knowledge at all.

## 6. Secret Scanning Is a Stage, Not a Promise

A final secret scan is useful, but it should not be the only safety mechanism. I prefer staged checks:

1. Scan captures before compilation.
2. Scan compiled knowledge before it becomes durable.
3. Scan the exact staged diff before commit.
4. Review the diff as a human-readable artifact.

The staged-diff check is especially important. Scanning the entire directory can produce noise, while scanning only the intended change answers the question that matters: *what exactly am I about to publish?*

A generic gate might look like this:

```bash
changed_files=$(git diff --cached --name-only)

if secret_scan $changed_files; then
  echo "secret gate passed"
else
  echo "publish blocked"
  exit 1
fi
```

The scanner is not a substitute for judgment. It is a second pair of eyes that makes accidental publication harder.

## 7. Why Portable Beats Clever Here

A system like this could become a product with a service, a vector database, a dashboard, and a dozen background workers. Those tools can be useful. They also create more infrastructure that an agent must understand before it can safely write anything.

The portable version starts with a simpler bet:

- plain text is inspectable
- Git provides history and review
- Markdown links provide lightweight relationships
- small scripts provide deterministic gates
- conventions are easier to move than hidden state

This does not solve every knowledge problem. It does make the failure modes visible. If a note is missing, we can inspect the index. If a publish is blocked, we can inspect the gate. If two writers conflict, we can inspect the branch and the diff.

That trade-off is worth it to me. Agents should be allowed to be creative while reasoning. The moment they touch durable state, the system should become boring, explicit, and reviewable.

## 8. The Practical Contract

The whole design can be summarized in a few rules:

- Raw captures are inputs, not facts.
- Compilation preserves sources and marks uncertainty.
- Durable notes have metadata, links, and an index entry.
- Shared knowledge is separate from private runtime memory.
- Secrets never become ordinary notes.
- Publishing locks, validates, stages narrowly, scans, and avoids force-pushes.

That is not a flashy memory architecture. It is a contract that multiple agents can follow without guessing.

And honestly, that is the point. The best knowledge layer is not the one that sounds the most intelligent. It is the one that still behaves predictably when the context is messy, the remote has changed, and nobody remembers which agent wrote the file at 2am.
