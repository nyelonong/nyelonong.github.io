---
layout: post
title:  "Why You Should Switch Git Identities Per Project (Using git includeIf)"
date:   2026-07-12
categories: [learnings]
---


*Let's talk honestly about one of the most annoying git problems: committing with the wrong email.*

***

You clone a repo. You make some changes. You `git commit` without thinking. Then you push and notice — *oh no* — the commit shows up under your personal name on a work repo, or worse, your work email on a personal open-source project.

We've all been there. And every time, you tell yourself: "I'll check my git config before every commit from now on." Spoiler: you don't.

The fix is simpler than you think, and it's built into git itself: **`includeIf`**.

## 0. The Problem: One Global Identity Doesn't Fit

By default, most of us set up git like this:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@personal.com"
```

And that works fine... until you start working on projects that need a different identity. Your personal side-project should use `you@personal.com`. Your day-job code should use `you@company.com`. Your client work should use... well, you get it.

The obvious solution is `git config user.name` inside each repo:

```bash
cd ~/work/company-project
git config user.name "Your Work Name"
git config user.email "you@company.com"
```

But this is manual. You'll forget. Or you'll clone a new repo at 2am and push six commits before you realize the mistake.

There's a better way.

## 1. What Is includeIf?

Since git 2.13, you can conditionally include other config files based on the repo's directory path. It looks like this in `~/.gitconfig`:

```ini
[includeIf "gitdir:~/work/"]
    path = ~/.gitconfig-work
```

The rule is simple: any repo under `~/work/` will also load the config from `~/.gitconfig-work`. Any repo **outside** that path uses only the global defaults.

This means:
- Your global `~/.gitconfig` holds the fallback identity (e.g. personal)
- Each "zone" (`~/work/`, `~/clients/`, etc.) gets its own config file with a different identity
- Git auto-switches — you never think about it again

## 2. The Setup

### Step 1: Strip identity from your global config

Your `~/.gitconfig` keeps everything **except** `user.name` / `user.email`. Or keep them as your personal defaults and override per zone.

```ini
[user]
    name = You (Personal)
    email = you@personal.com

[core]
    editor = nvim

[init]
    defaultBranch = main
```

### Step 2: Create per-context config files

For work projects:

```bash
cat > ~/.gitconfig-work << 'EOF'
[user]
    name = Your Work Name
    email = you@company.com
EOF
```

For client projects:

```bash
cat > ~/.gitconfig-clients << 'EOF'
[user]
    name = You (Client Work)
    email = you+clients@consulting.com
EOF
```

### Step 3: Wire them with includeIf

Add to `~/.gitconfig`:

```ini
; Personal identity is the default (defined at the top)

; Work projects ~/work/ uses work identity
[includeIf "gitdir:~/work/"]
    path = ~/.gitconfig-work

; Client projects under ~/clients/ use client identity
[includeIf "gitdir:~/clients/"]
    path = ~/.gitconfig-clients
```

That's it. Commit from anywhere under `~/work/some-repo/` and git uses the work email. No manual config. No second-guessing.

## 3. How It Works Under the Hood

When git reads config, it processes files in order:

```
          ┌─────────────────────┐
          │  ~/.gitconfig       │  ← loaded first (system → global)
          │  (default identity) │
          └────────┬────────────┘
                   │
                   ▼
          ┌─────────────────────┐
          │  Check cwd path     │
          │  against each       │
          │  includeIf rule     │
          └────────┬────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   ┌────────────────┐  ┌──────────────┐
   │ Matches rule?  │  │ No match:    │
   │ Include extra  │  │ skip, use    │
   │ config file    │  │ default only │
   └────────┬───────┘  └──────────────┘
            │
            ▼
   ┌────────────────────┐
   │  ~/.gitconfig-work │  ← loaded after global;
   │  (overrides user.*)│    later values win
   └────────────────────┘
            │
            ▼
   ┌────────────────────┐
   │  .git/config       │  ← repo-local config
   │  (repo overrides)  │    always wins last
   └────────────────────┘
```

Chain of precedence (last wins): `~/.gitconfig` → `includeIf` target → `.git/config`.

So a personal repo at `~/personal/my-project` picks up the default identity, and a work repo at `~/work/company-app` picks up the work identity — and you can still override at the repo level if a specific project needs something different.

## 4. Pro Tips

### a) Multiple paths for the same zone

You can stack `includeIf` rules. If work repos live in both `~/work/` and `~/src/work/`:

```ini
[includeIf "gitdir:~/work/"]
    path = ~/.gitconfig-work

[includeIf "gitdir:~/src/work/"]
    path = ~/.gitconfig-work
```

### b) Trailing slash matters

`gitdir:~/work/` matches any repo inside `~/work/`. Without the slash, `gitdir:~/work` would match a repo at exactly `~/work` too — the trailing slash means "directory contents".

### c) Nested overrides

You can chain includeIf rules. A team repo inside `~/work/` could include an additional team-specific config on top of the work identity:

```ini
[includeIf "gitdir:~/work/team-infra/"]
    path = ~/.gitconfig-team-infra
```

Git processes all matching `includeIf` blocks in order, so `~/.gitconfig-team-infra` is loaded after `~/.gitconfig-work` and can override specific keys.

### d) Verify before you commit

```bash
git config user.name
git config user.email
```

Run these once after cloning a new repo to confirm the right identity is active. If you see the wrong one, check your includeIf paths.

## 5. Why Bother?

Two reasons, and neither is theoretical.

**Clean commit history.** Squashing commits is painful enough. You don't want to rebase an entire PR just because your name is wrong on half the commits. `includeIf` eliminates that entire category of mistake.

**Professional boundaries.** When you switch between personal and work projects multiple times a day (hour?), your brain is already juggling context. Git identity should not be one more thing to track. Set it once, forget it.

And honestly? It takes two minutes to set up. The first time it saves you from a "oops, that was my personal email on the client repo" conversation, you'll wonder why you didn't do it sooner.

## 6. The Catch

`includeIf` works by **directory path only**. If your repo layout is chaotic — work projects mixed with personal projects in the same parent folder — you'll need to organise your directories first, or fall back to repo-local `git config` per clone.

There's also no `gitdir:` negation yet. You can't say "include this config unless the repo is under this path." But honestly, with a clean directory structure you don't need it.

## Recap

- Stop setting git identity per-repo manually — you will forget at the worst time
- `includeIf` lets git auto-select identity based on where the repo lives on disk
- Setup takes 2 minutes: one config per "zone" (work, personal, clients), wired into `~/.gitconfig`
- Git processes global → includeIf → repo-local, with later values overriding earlier ones

The best part? Once it's set up, it just works. No ceremony, no mental overhead, no more commits with the wrong face on them.

Go fix your gitconfig.
