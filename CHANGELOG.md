# Changelog

All notable changes to Plugin Store are documented here.
Versioning follows [SemVer](https://semver.org/) for `web/` and `backend/`,
and the root `VERSION` is bumped with each user-facing release.

## [Unreleased]

### Planned
- GitHub OAuth authentication for `POST /api/upload/*` and `POST /api/github/import`
  (admin allowlist via `ADMIN_GITHUB_USERS` env var)
- Per-user developer dashboard

## [1.2.0] - 2026-06-08

### Added
- Friendly error message when GitHub repo has no `manifest.json` — lists root
  contents and checked subdirectories
- Recursive one-level deep search for `manifest.json` in subdirectories of
  the repo root
- Tolerant manifest JSON parsing (strips `//` and `/* */` comments, trailing
  commas) so non-strict JSON manifests don't break import
- Icon auto-extraction in `import-plugins.js`:
  - Reads `manifest.icons` (picks largest declared size, 128 > 48 > 32 > 16)
  - Falls back to largest `*.png`/`*.svg` in `icons/`, `src/icons/`, `img/`,
    or `images/`
- Plugin icon assets committed to repo for the 4 demo plugins
  (vimium, dark-reader, tampermonkey, ublock-origin)

### Fixed
- **Backend `Content-Disposition` filename** now uses the plugin's display
  name + version (e.g. `Vimium-1.0.0.zip`) instead of the raw disk filename
  `extension.zip`. Works for direct URL downloads too, not just frontend
  button clicks.
- **Removed `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy`**
  response headers on package downloads — Chrome was treating them as a
  re-validation trigger and downloads got stuck on "剩余 获取中".
- **GitHub `detect` API URL bug:** `/contents/<branch>/manifest.json` was
  looking for a `manifest.json` inside a directory named after the branch.
  Fixed to use the proper Contents API form: `/contents/manifest.json?ref=<branch>`.
- **Duplicate `<Header>` rendering on the home page** — `App.jsx` already
  renders `Header` globally, so the same component was also rendered inside
  `Home.jsx`, showing the Plugin Store nav row twice.
- **dark-reader import prefix typo** — `darkreader-master` → `darkreader-main`.

## [1.1.0] - earlier

Initial release. Plugin browser with card grid, detail page, install counter,
download via `/packages/<id>/extension.zip`.
