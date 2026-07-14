# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal Jekyll blog at [al.afrani.id](https://al.afrani.id), built and served by GitHub Pages
directly from `master`. There is no build step, no CI, no test suite, and no Ruby checked in —
pushing to `master` publishes. `_site/` is generated locally and gitignored; never commit it.

## Local preview

```sh
nix shell nixpkgs#jekyll --command jekyll serve   # http://127.0.0.1:4000, rebuilds on save
```

Nothing is installed by that; the closure stays in `/nix/store` and `jekyll` is on `PATH` only for
that process. Without nix: `gem install jekyll && jekyll serve`.

This works only because the site uses **no Jekyll plugins** and has no `Gemfile`. Adding a plugin
forces a `Gemfile` and `bundle exec jekyll serve` on every contributor — a real cost, so weigh it
before proposing one. `_config.yml` also has an explicit `exclude:` list, which *replaces* Jekyll's
default one, so `Gemfile`/`vendor` entries are repeated there defensively.

## Two hard constraints

1. **No third-party code.** The site ships zero JavaScript and fetches nothing from a third-party
   origin; fonts are self-hosted in `fonts/`. An earlier revision loaded `polyfill.io`, whose domain
   was later sold and served malware. Before adding any external `<script>`, `<link>`, or `<img>`,
   inline or vendor it instead. If it truly must be remote, pin an exact version and add an SRI
   `integrity` hash. This is why the ZKP post's formulas are hand-written MathML rather than MathJax.
2. **No plugins.** See above.

## Architecture

Stock Jekyll, themed with [Kiko](http://github.com/gfjaru/Kiko), whittled down:

- `_layouts/default.html` — the only page shell (`<head>`, container). `post.html` and `page.html`
  nest inside it via `layout: default` and supply the masthead plus title block.
- `index.html` — the post list. `feed.xml` — hand-written RSS (`layout: null`).
- `_config.yml` `defaults:` assigns `layout: post` to everything in `_posts/` and `layout: page` to
  pages, so front matter usually needn't repeat it (existing posts do anyway).
- `style.scss` — the entire stylesheet, one self-contained file with `---` front matter so Jekyll
  compiles it to `/style.css` (`sass: style: compressed`). There is no `_sass/` directory.
- Reading time is computed inline in Liquid in *both* `index.html` and `_layouts/post.html`
  (`number_of_words | divided_by: 200.0 | ceil`). Change one, change the other.

## Writing a post

`_posts/YYYY-MM-DD-slug.markdown`, permalink `/:year/:month/:day/:title/`, kramdown:

```yaml
---
layout: post
title:  "Your Title"
date:   2026-07-14
categories: [learnings]
---
```

Older posts use `categories: blog`; newer ones use `[learnings]`. Neither is rendered anywhere —
categories are inert. Use fenced code blocks (```` ```go ````), not `{% highlight %}` tags; only two
old posts still use the tag form. Post images go in `images/`.

Work on a `post/<slug>` branch and open a PR; merging to `master` publishes it.

## Commits

Conventional Commits, and the log uses a `post:` type for new posts alongside the usual
`feat:`/`fix:`/`chore:`/`docs:`.
