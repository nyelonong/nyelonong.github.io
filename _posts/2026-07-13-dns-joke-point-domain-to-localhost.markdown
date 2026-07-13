---
layout: post
title:  "The DNS Prank: Pointing Your Domain at 127.0.0.1"
date:   2026-07-13
categories: blog
---

*Let's talk honestly about one of the most satisfying little tricks you can pull
with a domain you own.*

***

You own a domain. You point the root at your blog, your app, your portfolio.
Boring. But what if — instead of your server — you pointed it at **localhost**?

`127.0.0.1`. The loopback address. The computer's own self.

Here's the joke: DNS doesn't know whose computer "localhost" is. When I open
`yourdomain.com` and it resolves to `127.0.0.1`, my browser doesn't connect to
*your* machine. It connects to **mine**. So everyone who visits sees their own
empty localhost, not yours. The domain becomes a mirror, not a destination.

## 0. How It Actually Works

DNS maps a name to an IP. Normally that IP is a real server out on the internet.
But `127.0.0.1` (and its IPv6 twin `::1`) is special — it always means "this
device, right here." So:

```
yourdomain.com  ->  127.0.0.1   (A record, DNS only)
yourdomain.com  ->  ::1         (AAAA record, DNS only)
```

Every visitor resolves the same name to the same "IP" — but that IP is local to
each of them. Nobody ever reaches a server. The domain is, functionally, a no-op
that points everyone back at themselves.

## 1. The One Rule That Breaks It

If you put this behind a CDN proxy (the orange cloud in Cloudflare), it stops
being funny. The proxy tries to fetch `127.0.0.1` from *its* network — which is
its own loopback, not yours — and either errors out or serves nothing. The fix
is blunt: **DNS only, no proxy.** Grey cloud. Let the raw record resolve.

## 2. The Port Problem

DNS has no concept of ports. `yourdomain.com` means port 80. If your local thing
runs on `:3000`, visitors still hit `:80` and see nothing. Two options:

- Run your local server on `:80` (then `yourdomain.com` "works" on your own box).
- Or just tell people to open `http://yourdomain.com:3000` and accept the joke is
  slightly less clean.

For a pure prank, `:80` is fine — the point isn't that it serves something, it's
that it serves *nothing of yours*.

## 3. What Stays Safe

Your real site lives on a subdomain — `blog.yourdomain.com`, pointed at GitHub
Pages or a real host. The root being a loopback doesn't touch it. The subdomain
resolves normally; only the bare domain becomes the mirror. Clean separation.

## 4. Why Bother?

Because it's a great demonstration of what DNS actually is: a shared phone book
that maps names to addresses, with no idea whose address "local" means. Point a
domain at localhost and you've turned the global namespace into a private joke
that everyone experiences alone.

Set it up, send the link to a friend, and watch them wonder why your "site" is
their own blank page.

Go point a domain at yourself.