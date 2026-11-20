# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal Jekyll blog at [al.afrani.id](https://al.afrani.id), built and served by GitHub Pages
directly from `master`. There is no build step, no CI, no test suite, and no Ruby checked in —
pushing to `master` publishes. `_site/` is generated locally and gitignored; never commit it.

## Local preview

```sh
mise install   # once: Ruby 3.3 + github-pages 232 (Jekyll 3.10, Sass 3.7.4), pinned in mise.toml
make serve     # http://127.0.0.1:4000, rebuilds on save
make build     # run before pushing any style change
```

`mise.toml` matches the GitHub Pages build image. Keep it that way: Pages compiles `style.scss` with
Sass 3.7.4, which rejects some CSS newer Sass accepts (for example a quoted `url()` inside a custom
property). A build under nix or Jekyll 4 passing proves nothing; a failed Pages build leaves the old
site live without any local signal.

The site uses **no Jekyll plugins** beyond those `github-pages` ships and has no `Gemfile`. Adding a plugin
forces a `Gemfile` and `bundle exec jekyll serve` on every contributor — a real cost, so weigh it
before proposing one. `_config.yml` also has an explicit `exclude:` list, which *replaces* Jekyll's
default one, so `Gemfile`/`vendor` entries are repeated there defensively.

## Two hard constraints

1. **No third-party code.** The site fetches nothing from a third-party origin: fonts are self-hosted in `fonts/`
   and the only script is the site's own `js/tree-dust.js`. An earlier revision loaded `polyfill.io`, whose domain
   was later sold and served malware. Before adding any external `<script>`, `<link>`, or `<img>`, inline or vendor
   it instead. If it truly must be remote, pin an exact version and add an SRI `integrity` hash. This is why the ZKP
   post's formulas are hand-written MathML rather than MathJax. (The old "zero JavaScript" rule was lifted on
   2026-11-20 for the self-hosted dust script only.)
2. **No plugins.** See above.

## The look

The reading room shares one world with galdr.discoverd.io, discoverd.io and afrani.id: dark always (`#0c0f10` with a
soft top glow), afrani.id's tree of glowing dust, sage `#9fe0bd` as the accent. `js/tree-dust.js` draws the tree and
slow embers behind the index, the same tree small and still beside the name on posts, and makes titles (the list and a
post's title) gather from dust and settle into the real text. A small inline script in `_layouts/default.html` sets
`dust-titles` (motion allowed) and `dust-tree` (WebGL available) before first paint; without them nothing is hidden,
and if the script fails, a CSS animation reveals the titles after 2.5 s. Body text is never animated.

## Architecture

Stock Jekyll with a small hand-written theme, the reading room of afrani.id:

- `_layouts/default.html` — the only page shell (`<head>` and a centred `.page` column: wider on the
  index, about 65 characters on posts and pages). `post.html` and `page.html` nest inside it via
  `layout: default` and add `_includes/site-header.html`, the title and `reading-footer.html`.
- Titles and headings are sentence case, written that way in the source; CSS cannot lowercase safely
  because it would break names such as AI, Git and DNS.
- `index.html` — the post list, grouped by year with `group_by_exp`. `feed.xml` — hand-written RSS (`layout: null`).
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
