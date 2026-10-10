# nyelonong.github.io

Personal blog at [al.afrani.id](https://al.afrani.id). Jekyll, built and served
by GitHub Pages from `master`. Themed with [Kiko](http://github.com/gfjaru/Kiko).

## Local preview

There is no `Gemfile`. [mise](https://mise.jdx.dev) pins the same versions the
GitHub Pages build uses (`mise.toml`: Ruby 3.3 and the `github-pages` 232 gem,
which brings Jekyll 3.10 and Sass 3.7.4):

```sh
mise install       # once
make serve         # http://127.0.0.1:4000, rebuilds on save
make build         # the same build GitHub Pages runs; run it before pushing
```

Match GitHub's versions, not just any Jekyll. Pages compiles `style.scss` with
Sass 3.7.4, which rejects CSS that newer Sass accepts; a stylesheet that builds
under Jekyll 4 can still fail on GitHub and leave the old site live.

The site uses **no Jekyll plugins** beyond what `github-pages` already ships.
Adding one would need a `Gemfile` and `bundle exec`. That is a real cost, so
weigh it before adding a plugin.

## Writing a post

Add a file to `_posts/` named `YYYY-MM-DD-slug.markdown`, with front matter:

```yaml
---
layout: post
title:  "Your Title"
date:   2026-07-14
categories: [learnings]
---
```

Permalinks are `/:year/:month/:day/:title/`. Work on a `post/<slug>` branch and
open a PR. Merging to `master` publishes it.

## No third-party code

The site ships **zero JavaScript** and fetches **nothing** from a third-party
origin. Fonts are self-hosted in `fonts/`.

This is deliberate, and it is not just tidiness. An earlier revision loaded
`polyfill.io` on every page; that domain was later sold and served malware to
visitors. A `<script src>` pointing at someone else's domain is a standing
permission for them to run code as this site, renewable forever, revocable only
by me.

So: before adding any external `<script>`, `<link>`, or `<img>`, check whether
the content can be inlined or vendored instead. If it genuinely must be remote,
pin an exact version and add an
[SRI](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
`integrity` hash so the browser refuses to run it if the bytes ever change.

## Layout

```
_layouts/     default.html wraps everything; post.html and page.html sit inside it
_posts/       the posts
images/       post images
fonts/        self-hosted Charis SIL (woff2, latin), the fallback for Iowan Old Style
style.scss    the whole stylesheet, self-contained, compiles to /style.css
_config.yml   site config; no plugins
CNAME         al.afrani.id
```
