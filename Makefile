# Common actions for the Jekyll blog. GitHub Pages builds on merge to master,
# so these targets are only for local work.

.PHONY: help serve build clean new

help:  ## show available targets
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  %-8s %s\n", $$1, $$2}'

serve:  ## local preview at http://127.0.0.1:4000 (rebuilds on save)
	nix shell nixpkgs#jekyll --command jekyll serve

build:  ## build the site into _site/
	nix shell nixpkgs#jekyll --command jekyll build

clean:  ## remove _site/
	rm -rf _site

new:  ## scaffold a post: make new POST=my-slug
	@if [ -z "$(POST)" ]; then echo "usage: make new POST=<slug>"; exit 1; fi
	@d=$$(date +%Y-%m-%d); \
	f="_posts/$$d-$(POST).markdown"; \
	printf -- '---\nlayout: post\ntitle:  "TODO"\ndate:   %s\ncategories: [learnings]\n---\n\n' "$$d" > "$$f"; \
	echo "created $$f"