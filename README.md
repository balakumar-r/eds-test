# EDS Test — CSS build & publish workflow

This repository uses per-component SCSS files under `blocks/` and a Gulp-based build to compile each non-partial SCSS file into a corresponding CSS file next to the source SCSS (one .css per component). This README explains how to set up, build, watch, and publish compiled CSS for EDS consumption.

## Goals
- Keep SCSS as the source-of-truth in the repo (tracked by Git).
- Produce compiled CSS files for EDS to consume.
- Publish compiled-only CSS to a dedicated branch (`css-only`) so EDS can consume built assets without source files.

## Prerequisites
- Node.js (recommended 16.x or 18.x) and npm installed
- Git configured with push access to this repository

## Install (once per developer)
From the repo root:

```bash
npm install
```

This installs dev dependencies including Gulp and Sass used by the build tasks.

## Build (manual)
To compile all component SCSS to CSS once:

```bash
npm run build:css
```

This will compile every `blocks/**/[^_]*.scss` (i.e., all .scss files that do NOT start with `_`) and write the `.css` and `.css.map` files next to the source .scss.

## Watch (development)
To run a file watcher that recompiles when SCSS files change:

```bash
npm run watch:css
```

Leave the watcher terminal open while you work. It watches `blocks/**/*.scss` and runs the compile task on change. Editing partials (SCSS files starting with `_`) will also trigger a full recompile so consumers update.

## How the Gulp tasks work (brief)
- `blocks/**/[^_]*.scss` — compiles all non-partial component SCSS files
- Output path is the same folder as the source SCSS (preserves directory structure)
- Sourcemaps written next to each CSS file (`.css.map`)

You can also run the underlying gulp task directly with npx:

```bash
npx gulp styles
```

## Publish compiled CSS for EDS (recommended workflow)
We recommend keeping SCSS tracked in the primary branches (main / feature branches) and publishing only compiled CSS to a dedicated branch `css-only` that EDS consumes. This keeps source history and code review while providing a clean, CSS-only branch for the deployment system.

Two ways to publish compiled CSS:

1) Local script (run manually when you want to publish)

Create `scripts/build-and-publish-css.sh` (or run the commands below manually). Example script (bash):

```bash
#!/usr/bin/env bash
set -euo pipefail
REPO_URL="$(git config --get remote.origin.url)"
BRANCH=css-only
TMP_DIR="$(mktemp -d)"

# build
npm ci
npm run build:css

# copy only .css files preserving dirs
rsync -a --prune-empty-dirs --include '*/' --include '*.css' --exclude '*' blocks/ "$TMP_DIR/blocks/"

cd "$TMP_DIR"

git init
git checkout -b "$BRANCH"
git config user.name "github-actions"
git config user.email "github-actions@github.com"

git add .
git commit -m "publish: compiled css from $(git rev-parse --short HEAD)"

git remote add origin "$REPO_URL"
# force push so the branch contains only compiled CSS
git push --force origin "$BRANCH"
```

Notes:
- The script force-pushes the `css-only` branch. This is intentional so the branch contains only compiled assets and can be overwritten by future publishes.
- You may use a PAT in the remote URL if you cannot push with your normal credentials.

2) CI workflow (automated — recommended long-term)

A GitHub Actions workflow can run on merge to `main` (or manually) to build and push `css-only`. This is more reproducible and removes manual steps.

If you want this automated, we can add `.github/workflows/publish-css.yml` which will run `npm ci`, `npm run build:css`, create an orphan `css-only` branch containing only the compiled CSS, and force-push it using the repo `GITHUB_TOKEN`.

## Best practices for contributors
- Keep SCSS files in the repository on your feature branch and open PRs as usual.
- Use `npm run build:css` locally to verify compiled output when creating changes that affect styling.
- When you want to publish compiled assets for EDS, run the publish script (or the CI will do it automatically if enabled).
- Do NOT add `**/*.scss` to `.gitignore` — SCSS must remain tracked in the source branches.

## Troubleshooting
- Error: "Local modules not found" → run `npm install` from the repo root.
- If `gulp` command fails, use the npm scripts (`npm run build:css` / `npm run watch:css`) or `npx gulp styles` so the locally-installed gulp binary is used.
- Node version issues — use Node 16.x or 18.x. Check with `node -v`.

## Questions or changes
If you'd like, I can:
- Add the publish script under `scripts/` and commit it, or
- Add the GitHub Actions workflow to automate publishing to `css-only`, or
- Add autoprefixer/minification to the build pipeline for a production output.

Pick one and I will implement it in a branch and open a PR if you prefer review before merge.
