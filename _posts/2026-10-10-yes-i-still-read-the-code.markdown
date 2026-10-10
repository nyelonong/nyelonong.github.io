---
layout: post
title:  "Yes, I Still Read the Code."
date:   2026-10-10 15:36:04 +0700
categories: [learnings]
---

*If a coding agent writes the patch, do you still read it?*

I do.

Not because I want to prove I can code without AI. Not because I think every generated function is suspicious. I use coding agents because they are useful.

But when a change goes into my project, “the agent wrote it” is not a very good explanation for why I accepted it.

***

## 1. I Want the Summary. Then I Want the Diff.

An agent finishes a task and gives me a neat report:

```text
Implemented the change.
Added tests.
All checks pass.
```

Good. That helps me get oriented.

Now show me the code.

The summary tells me what the agent believes it changed. The diff shows me what it actually changed. Those are related, but they are not interchangeable.

“Handled invalid input” might mean rejecting it. It might mean silently replacing it with a default. Both can look reasonable in a summary. They produce different behavior.

This is why I still read the patch. I want to understand the decisions hiding inside those short sentences.

Did we solve the problem I asked about? Did we quietly change something else? Is the test checking the behavior I care about, or just confirming the implementation’s own assumptions?

Sometimes the patch is perfectly fine. Reading it is how I arrive at that conclusion.

## 2. Reading Code Is Not Retyping It

There is a strange assumption that reviewing AI-written code somehow defeats the purpose of using AI.

Why? We review code written by other humans too.

I don’t need to reproduce the work to evaluate it. I don’t need to type every line myself to understand the result.

My attention goes to the change and its consequences:

- What behavior is different now?
- What happens when something fails?
- Which caller or contract depends on this?
- What evidence supports the intended behavior?

For a small presentation change, the review can be small. For a change involving persistence, authorization, or background work, I need to go beyond the edited lines.

That is not an argument for making every task slow. It is an argument for spending attention where a mistake matters.

The useful part of delegation is not that I stop thinking. It is that I can spend less time producing the patch and more attention deciding whether it belongs.

## 3. So I Made the Review Easier to Read

While building my review tooling, I kept running into very ordinary problems.

The title was hard to read. After scrolling through a long diff, I could lose track of which file I was looking at. The text felt too dense.

None of these sounds like a grand engineering problem.

But if the whole point is for me to read the change, readability is part of whether the tool works.

I wanted a proper review surface: a file list, readable code, inline or side-by-side diffs, and a way to keep my place while moving between changes.

The screenshots below use a small illustrative settings-file example, not a private project or an actual incident.

![Side-by-side review of a settings loader that silently replaces read and JSON errors with empty settings.]({{ site.baseurl }}/images/still-read-code-diff.png)

It looks fairly boring. That is intentional.

I am not looking for a dashboard that celebrates how much code the agent generated. I want to see what changed.

## 4. “Request Changes” Needs More Than a Button

Suppose I notice a problem halfway through a patch.

I could go back to chat and describe the file, function, and relevant lines. Then the agent has to work out which part I mean.

Or I can select the lines and leave the comment there.

For example, a useful comment might be:

```text
Malformed settings now look like a successful load.
Use defaults only when the file is missing, and test invalid JSON.
```

That is much more useful than “please improve error handling.”

The location provides context. The comment provides the concern. The agent still has room to choose the right correction.

![A comment anchored to the broad exception handler asks for missing-file defaults without hiding malformed JSON.]({{ site.baseurl }}/images/still-read-code-comment.png)

In this example, returning empty settings hides more than a missing file. It also hides malformed JSON and other read errors. That difference is easy to miss in a summary saying “added a fallback.”

I also want to distinguish between different decisions.

Sometimes the implementation needs a correction. Sometimes the plan itself is wrong. Sometimes I want to cancel the work.

Those are not all different spellings of “no.”

A review should communicate what happens next, not merely record that I disliked something.

## 5. Approved Which Version?

There is another detail that becomes important once the agent can keep editing.

I review a patch. I approve it. Then another edit happens.

Does my approval still apply?

Not automatically.

The approval needs to refer to the particular change I saw. Otherwise, “approved” becomes a floating permission attached to a conversation rather than a decision about code.

My tooling captures the scoped working-tree change and records a fingerprint. Before proceeding, the workflow checks whether the current state still matches the approved state.

If the reviewed inputs change, that approval no longer matches. The revised change needs review.

Here is the illustrative revision: catch only `FileNotFoundError`. Invalid JSON and other read errors remain visible to the caller. I still need to inspect the revision and its tests before accepting it.

![The revised settings loader catches only FileNotFoundError instead of swallowing all read and JSON errors.]({{ site.baseurl }}/images/still-read-code-revised.png)

There is an important limit here: a fingerprint does not tell us the code is correct.

It answers a narrower question:

> Is this still the change that was approved?

It is also not a sandbox against a process with unrestricted write access. It supports an explicit review workflow; it does not magically enforce trust.

## 6. The Tool Supports the Habit

I built this review surface as **task-review**, part of [agent-workflow](https://github.com/nyelonong/agent-workflow).

It presents the actual working-tree change in a local browser, collects annotations and a decision, and records approval against the captured state.

The repository has the implementation and usage details. But the tool is not the main point of this post.

You can practice the same habit with your editor, a pull request, or a terminal diff.

Read the change. Ask specific questions. Request corrections where needed. Know which version you accepted.

And keep running the checks. Human review can miss defects. Tests can miss requirements. An agent’s explanation can miss both. None of them replaces the others.

I do not want to become a full-time approval-button operator. Clicking a button without understanding the change is not the kind of involvement I mean.

I want the agent to do useful work, and I want a clear view of that work before I accept it.

So yes, I still read the code.

I just don’t have to type all of it anymore.
