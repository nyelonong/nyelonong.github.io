---
layout: post
title:  "Two Years of nix and home-manager: What I Got Wrong"
date:   2026-07-14
categories: [learnings]
---


*In 2024 I wrote a post about managing development across multiple machines with nix. It did not manage multiple machines. Let's fix that.*

***

Two years ago I published [a post about nix and home-manager](/2024/03/05/home-manager/). Confident title. Three sections of buzzwords. And one `flake.nix` that hardcoded `aarch64-darwin` and a placeholder username.

It promised multiple machines. It shipped one.

This is not a breakup post. I still run home-manager every day, on three machines now, and I would make the same choice again. This is the errata: what the first post got wrong, and what two years of actually living with it taught me.

## 0. The Ten-Second Recap

If you have never touched nix, here is the whole idea. You write a file that describes your `$HOME`. Packages, dotfiles, shell config, environment variables:

```nix
home.packages = with pkgs; [ ripgrep fd jq bat ];
home.file.".gitconfig".source = ./.gitconfig;
```

Then you run one command:

```bash
home-manager switch --flake .#zaki
```

And your home directory *becomes that file*. Not "runs a script that mostly gets there". Becomes it. New machine, same file, same environment.

That part I got right. Everything below is what I got wrong.

## 1. What I Should Have Led With: Rollback

My first post sold nix on "consistency" and "reproducibility". Fine words. They are also what every dotfiles README claims, including the ones that are a 400-line bash script held together by `ln -sf` and hope.

The thing I should have led with, and did not mention even once:

```bash
$ home-manager generations
2026-07-14 01:20 : id 9 -> /nix/store/lplrbd0...-home-manager-generation (current)
2026-07-14 01:15 : id 8 -> /nix/store/a93nzrd...-home-manager-generation
2026-07-14 01:08 : id 7 -> /nix/store/7m2sgfn...-home-manager-generation
```

Every `switch` you have ever run is still sitting there, intact. Broke your shell at 1am? Roll back:

```bash
/nix/store/a93nzrd...-home-manager-generation/activate
```

You are back to 01:15. Not "back to what the script thinks 01:15 looked like". Back to the actual, byte-identical environment.

**This is the argument for nix.** A bash dotfiles repo cannot do this. It can restore your config files, sure. It cannot restore the exact versions of the twelve packages those config files depended on. Nix can, because a generation is not a config snapshot. It is a complete, immutable dependency graph.

I buried it. If you take one thing from this post, take that.

## 2. Mistake: I Let Nix Own My Language Runtimes

My 2024 `home.nix` had this in it:

```nix
home.packages = with pkgs; [ git go autojump starship bat ];
```

Spot the mistake. It is `go`.

Nix gives you exactly one Go. It is the one in your `nixpkgs` pin, it is excellent, and it is the same Go in every single directory on your machine. Which is perfect, right up until Monday morning when a work repo needs Go 1.21 and your global is 1.26. Now what?

The nix-native answer is a per-project `flake.nix` with a devshell. That is a real answer, and for a team already all-in on nix it is the right one. But I am one person with a dozen repos, most of which are not mine and will never have a `flake.nix` in them. Writing a devshell for each was never going to happen.

So runtimes moved out of nix. They live in [mise](https://mise.jdx.dev) now, declared from the same `home.nix`:

```nix
programs.mise = {
  enable = true;
  enableZshIntegration = true;

  globalConfig.tools = {
    go = "1.26.5";
    node = "26.5.0";
    python = "3.13";
  };
};
```

Those are the global defaults. Any repo can override them by dropping a `mise.toml` in its root, and mise switches versions the moment you `cd` into it. No devshell, no `nix develop`, no cooperation required from the repo.

The rule that fell out of two years of this, and the thing I would tell 2024 me:

> **Nix owns tools whose version is the same everywhere. mise owns anything whose version is a per-project decision.**

I have never once wanted a different `jq` in a different directory. Same for `ripgrep`, `fd`, `bat`, `delta`. Those are nix's, forever. But `go`, `node`, `python`? The version is a property of the project, not of me. Nix is the wrong tool to express that, and forcing it is how you end up fighting your own config.

(`autojump` was also a mistake, incidentally. It is unmaintained. It is `zoxide` now. But that one is just a package swap, not a lesson.)

## 3. Mistake: I Never Actually Delivered "Multiple Machines"

The 2024 post's title said multiple machines. The 2024 `flake.nix` said:

```nix
homeConfigurations."XXX" = home-manager.lib.homeManagerConfiguration {
  pkgs = nixpkgs.legacyPackages."aarch64-darwin";
  modules = [ ./home.nix ];
};
```

One system. One user. Hardcoded. A reader who followed that post to the letter finished it with the exact problem they started with, plus nix.

Here is what it should have said. The trick is a tiny helper that takes a system and a list of extra modules:

```nix
outputs = { nixpkgs, home-manager, ... }:
  let
    mkHome = system: extra:
      home-manager.lib.homeManagerConfiguration {
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
        modules = [ ./home.nix ] ++ extra;
      };
  in {
    homeConfigurations = {
      "zaki"         = mkHome "aarch64-darwin" [ ./hosts/personal.nix ];  # personal mac
      "bytedance"    = mkHome "aarch64-darwin" [ ./hosts/byted.nix ];     # work mac
      "zaki@windows" = mkHome "x86_64-linux"   [ ./hosts/windows.nix ];   # WSL2
    };
  };
```

`home.nix` holds everything shared: every package, every alias, the whole shell. The `hosts/*.nix` files hold only what genuinely differs per machine. And here is the part that surprised me. That is almost nothing.

The Windows/WSL2 profile, in its entirety:

```nix
{ ... }: {
  home.username = "zaki";
  home.homeDirectory = "/home/zaki";  # WSL2
}
```

Two lines. A completely different operating system and CPU architecture, and the delta is two lines, because everything that matters is already in the shared module. The work machine is barely bigger. A different username, and the Go env vars that keep internal packages away from the public proxy:

```nix
{ ... }: {
  home.username = "bytedance";
  home.homeDirectory = "/Users/bytedance";

  home.sessionVariables = {
    GOPRIVATE  = "*.corp.example";
    GONOPROXY  = "*.corp.example";
    GONOSUMDB  = "*.corp.example";
  };
}
```

Then `home-manager switch --flake .#bytedance` on the work laptop, `.#zaki` on the personal one. Same repo, same commit.

That is the multi-machine post I should have written. It took me two years to write those thirty lines, and about twenty minutes of that was actual work.

### The bootstrap chicken-and-egg

One more thing the first post skipped: getting nix onto a machine that has nothing. The dream is:

```sh
curl -fsSL https://example.com/bootstrap.sh | sh
```

But my dotfiles repo is private, so `curl` cannot fetch it. And it cannot fetch it *because* I have not set up an SSH key yet, because I have not bootstrapped the machine yet. Chicken, meet egg.

The fix is a two-stage bootstrap. Stage one is a public gist containing a generic script with zero personal data in it. It installs nix, generates an SSH key if there is not one, pauses while you paste that key into GitHub, asks for your repo's SSH URL, clones it, and hands off to stage two: a `bootstrap.sh` inside the private repo, which knows about profiles and can do the personal parts.

The whole new-machine ritual is one line now, and every step is re-runnable. Run it twice and the second run quietly skips everything already done.

## 4. Mistake: Nobody Told Me My Dotfiles Would Become Read-Only

This one cost me an evening, and it is the single thing I most wish someone had put in bold in a blog post.

When you write this:

```nix
home.file.".gitconfig".source = ./.gitconfig;
```

home-manager does not *copy* your gitconfig into `$HOME`. It symlinks it into the nix store:

```bash
$ ls -l ~/.gitconfig
~/.gitconfig -> /nix/store/w4k9...-home-manager-files/.gitconfig
```

And the nix store is **read-only**. On purpose. That is the whole basis of the guarantee. If the store could change under you, generations would be a lie.

So the first time you casually run `git config --global user.email ...`, or open `~/.zshrc` in your editor and hit save, you get a permission error and a moment of genuine confusion. Your own dotfile. In your own home directory. Denied.

The mental model has to change. **`$HOME` is an output now, not a source.** You do not edit `~/.gitconfig` anymore. You edit `.gitconfig` in the repo, run `home-manager switch`, and the change appears. It feels like ceremony for about a week and then it feels like nothing, and the payoff is that your home directory can no longer silently drift away from what is in git.

### Its evil twin: the untracked file

Same evening, different error. I added a new file to the repo, referenced it from `home.nix`, ran `switch`, and got told the file did not exist. It was right there. I could `cat` it.

**A flake only sees files that git tracks.** Not files in the directory. Files in the *git tree*. I had not run `git add`, so as far as the flake was concerned the file was not part of the world.

```bash
git add hosts/windows.nix   # do this, or nix will swear the file isn't there
home-manager switch --flake .#zaki
```

The error message will never mention git. Every nix user learns this once, angrily.

## 5. The Catch: What Nix Does Not Solve

The 2024 post had no section like this, which is the most dishonest thing about it. Nix is not a magic wand, and pretending otherwise just sets people up to blame themselves when it does not fit.

**It is not your macOS app store.** I use Zed. It is deliberately *not* in my `home.packages`. nixpkgs' `zed-editor` trails upstream (1.8.2 when the app itself was on 1.10.3), and a nix-installed Zed would shadow the real one, which updates itself just fine. So Zed stays app-managed, and "install the Zed CLI" is a documented manual step in my README. Some GUI apps are not nix's job, and forcing them in gets you an editor three versions behind for no benefit.

**It does not touch macOS system settings.** Key repeat rate, Dock behaviour, Finder defaults. home-manager does none of it. (`nix-darwin` does. Different tool, different post.)

**Unfree packages need an explicit opt-in, in two places.** The moment you install almost any font, you hit this. Once in the flake, for builds:

```nix
pkgs = import nixpkgs {
  inherit system;
  config.allowUnfree = true;
};
```

and once as an environment variable, for ad-hoc `nix run` and `nix shell` invocations that do not go through your flake:

```nix
home.sessionVariables.NIXPKGS_ALLOW_UNFREE = "1";
```

Miss the second one and you get a confusing refusal from a command that worked yesterday.

**And the one that actually broke things: it manages your shell, not every process.** mise activates by hooking *interactive zsh*. That covers you typing in a terminal, and nothing else. Editors, `launchd` jobs, git hooks, and my AI coding agent's hooks are all non-interactive shells. They never source the activation. They all fell over with:

```
node: command not found
```

Node was installed. It just was not on the PATH of any process that did not come from a terminal. The fix is to put mise's shim directory on the PATH declaratively, so it is there for everything:

```nix
home.sessionPath = [
  # mise shims: interactive zsh gets real binaries via mise's PATH activation,
  # but non-interactive shells (editors, launchd, hooks) never source it.
  # They need the shims to see node/go/python.
  "${config.home.homeDirectory}/.local/share/mise/shims"
];
```

That comment is in my `home.nix` in the present tense, as a warning to future me, because I have now debugged this exact thing twice.

## Recap

- **Lead with rollback.** Generations are the thing a bash dotfiles repo genuinely cannot do. Everything else is a nicer way to do things you could already do.
- **Do not let nix own language runtimes.** One global Go is fine until it is not. Nix owns tools that are the same everywhere. mise owns anything whose version is a per-project decision.
- **If you claim multiple machines, write more than one host.** A `mkHome` helper and a `hosts/` directory. The per-machine delta is far smaller than you think. Mine is two lines for an entirely different OS.
- **Your dotfiles become read-only.** `$HOME` is an output now, not a source. Edit the repo, run `switch`.
- **The flake only sees git-tracked files.** `git add`, always. The error will not tell you this.
- **Nix will not do your GUI apps, your OS settings, or the PATH of non-interactive processes.** Know where the edges are and stop pushing on them.

Two years on, would I do it again? Yes, and faster, because the thing I was actually buying was never "consistency". It was the ability to break my environment at 1am and undo it before 1:05.

Go check `home-manager generations`. It is all still there.
