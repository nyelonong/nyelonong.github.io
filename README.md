# nyelonong.github.io

Personal blog at [al.afrani.id](https://al.afrani.id). Jekyll, built and served
by GitHub Pages from `master`. Themed with [Kiko](http://github.com/gfjaru/Kiko).

## Local preview

There is no `Gemfile` and no Ruby to install. GitHub Pages builds the site
server-side, so Ruby is only ever needed to preview locally, and nix can supply
a whole Jekyll (Ruby and all) for the length of one command:

```sh
nix shell nixpkgs#jekyll --command jekyll serve
```

Then open <http://127.0.0.1:4000>. It rebuilds on save; Ctrl-C stops it.

Nothing is installed by that command. The closure lands in `/nix/store`,
`jekyll` is on `PATH` only for the process it runs, and `$HOME` is untouched.

It works because the site uses **no Jekyll plugins**. Add one and plain
`nixpkgs#jekyll` stops being enough: you would then need a `Gemfile` and
`bundle exec jekyll serve`. That is a real cost, so weigh it before adding a
plugin.

Without nix:

```sh
gem install jekyll
jekyll serve
```

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
fonts/        self-hosted Source Sans Pro (woff2, latin + latin-ext)
style.scss    the whole stylesheet, self-contained, compiles to /style.css
_config.yml   site config; no plugins
CNAME         al.afrani.id
```
