---
layout: post
title:  "Unleashing Productivity: Managing Development Across Multiple Machines with nix and home-manager"
date:   2024-03-05 10:45:35 +0700
categories: blog
---

# Introduction:

We often demands flexibility and the ability to work seamlessly across multiple machines. Managing our development environment consistently on different devices can be a challenging task. In this blog post, we'll explore how [nix](https://nixos.org/manual/nix/stable) and [home-manager](https://nix-community.github.io/home-manager) can be powerful allies in ensuring a consistent and efficient development experience, regardless of the machine you're working on.

# Navigating the Challenges of Multiple Machines:
Working on various machines introduces complexities such as differing operating systems, hardware configurations, and software versions. Here's how nix and home-manager come to the rescue:

## Consistent Environments with Nix Flakes:

1. Define a nix flakes for your project, encapsulating all dependencies and environment configurations.
2. This ensures that the development environment remains consistent across different machines, reducing compatibility issues.

## Reproducible Builds:

1. Nix Flakes' focus on reproducibility guarantees that your builds are consistent, regardless of the machine.
2. This eradicates the "it works on my machine" dilemma, making collaboration and sharing among team members a seamless process.

## Portable Development with Home-Manager:

1. Home-manager allows you to configure your user environment, making it portable across machines.
2. Customizations, environment variables, and user-level services are defined in a single configuration file, easily transferable between devices.

# Practical Strategies for Software Architects:

## Centralized Configuration with Nix Flakes:

1. Store your Nix Flake configuration in version control, making it accessible from any machine.
2. This centralization ensures that all team members can quickly set up their development environments with minimal effort.

## User-Focused Configuration with Home-Manager:

1. Leverage Home-Manager to personalize your user environment.
2. Manage user-level packages, shell configurations, and other settings specific to your preferences, all in one place.

## Automate Setup and Updates:

1. Create scripts that automate the setup of Nix Flakes and Home-Manager on a new machine.
2. Regularly update your configurations to include the latest improvements, ensuring a consistently optimized development environment.

# Seamless Transitions Between Machines:

## Effortless Onboarding:

1. New team members can quickly set up their development environments by cloning the project repository and executing Nix Flake commands.
2. Home-Manager configurations make it easy to replicate a personalized environment, streamlining the onboarding process.

## Version-Controlled Configurations:

1. Ensure that your Nix Flake and Home-Manager configurations are stored in version control.
2. This practice allows you to track changes, collaborate effectively with team members, and roll back to previous configurations if needed.

# Installation

## Install nix 
   ```sh
   $ curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
   ```

## Install home-manager
We need at least two files minimal `flake.nix` and `home.nix` in a git directory.

```sh
$ mkdir homie
$ cd homie
$ git init
```

`flake.nix` sample for mac arm machine (*aarch64-darwin*)
```nix
{
  description = "my home";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { nixpkgs, home-manager, ... }: {
    homeConfigurations = {
      "XXX" = home-manager.lib.homeManagerConfiguration {
        pkgs = nixpkgs.legacyPackages.${"aarch64-darwin"};
        modules = [ ./home.nix ];
      };
    };
  };
}
```
Replace *XXX* with machine username. 

`home.nix` sample for minimal configuration
```nix
{ pkgs, config, ... }: {
  home = {
    stateVersion = "23.11";
    username = "XXX";
    homeDirectory = "/Users/XXX";

    # List of pkgs you want to install in to your home
    packages = with pkgs; [
        git 
        go
        autojump
        starship
        bat
    ];

    # List of symlink files 
    file.".gitconfig" = { source = ./.gitconfig; };
  };

  # Enable home-manager so we can use home-manager bin 
  programs = {
    home-manager = {
        enable = true;
    };
  };
}
```

```sh
$ # Always keep track all the changes
$ git add .
$ # It will download and run home-manager
$ nix run github:nix-community/home-manager -- switch --flake .
```

## Install More packages
We can search more pkgs on the nixOS website https://search.nixos.org/packages or in the terminal with 

```sh
$ nix search nixpkgs <pkgs>
```

Let say we want to install [eza](https://github.com/eza-community/eza)

```nix
{ pkgs, config, ... }: {
  home = {
    stateVersion = "23.11";
    username = "XXX";
    homeDirectory = "/Users/XXX";

    # List of pkgs you want to install in to your home
    packages = with pkgs; [
        git 
        go
        autojump
        starship
        bat
        eza # New pkg
    ];

    # List of symlink files 
    file.".gitconfig" = { source = ./.gitconfig; };
  };

  # Enable home-manager so we can use home-manager bin 
  programs = {
    home-manager = {
        enable = true;
    };
  };
}
```

```sh
$ git add .
$ home-manager switch --flake .
```

# Conclusion:
Navigating the challenges of working across multiple machines is made significantly easier with nix and home-manager. These tools empower us to create consistent, reproducible, and personalized development environments, fostering collaboration and enhancing productivity.