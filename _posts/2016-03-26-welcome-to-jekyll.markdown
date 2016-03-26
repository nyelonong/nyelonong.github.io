---
layout: post
title:  "Welcome to Jekyll!"
date:   2016-03-26 22:48:39 +0700
categories: blog
---
Yeay, welcome to Jekyll!!.

This is what I did today to serve you this blog.

### Installing RVM
In my machine, Ubuntu 14.04, the latest ruby I found is ruby1.9.1. You need ruby2.0 or later to install jekyll. So I decided to install rvm. Keep away from sudo. Yeay.

``` sh
    $ gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
```
``` sh
    $ \curl -sSL https://get.rvm.io | bash -s stable
```

You need to run this to execute gvm from anywhere

``` sh
    $ source /home/yourhome/.rvm/scripts/rvm
```

### Installing Ruby
Install all requirements to install ruby

``` sh
    $ rvm requirements
```

Show all available ruby package

``` sh
    $ rvm list known
```

I choose ruby2.2, so just run

``` sh
    $ rvm install 2.2
```

### Installing Jekyll
``` sh
    $ gem install jekyll
```

If you want to linked up to your github page, create a repository, clone it, and change directory to your cloned repository.

``` sh
    $ git clone git@github.com:yourusername/yourrepo.git
```
``` sh
    $ cd yourrepo
```

Create a new jekyll site. Use `--force` in case your directory is not empty.

``` sh
    $ jekyll new . --force
```
``` sh
    $ jekyll serve
```

That's it. Move to your browser and open `localhost:4000`. Happy Blogging!
