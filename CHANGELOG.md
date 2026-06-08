# Changelog

All notable changes to Plugin Store are documented here.
Versioning follows [SemVer](https://semver.org/) for `web/` and `backend/`,
and the root `VERSION` is bumped with each user-facing release.

## [Unreleased]

### Planned
- Full GitHub OAuth App flow (browser redirect) once `GITHUB_CLIENT_ID` /
  `GITHUB_CLIENT_SECRET` are set — current build uses GitHub PAT login
- Per-user developer dashboard

## [1.4.0] - 2026-06-08

### Added
- **Home page redesign** modeled on the Chrome Web Store:
  - **HeroBanner** with 5 rotating slides, floating plugin-icon row,
    auto-advance + manual controls (prev/next/pause)
  - **CategoryCard** grid — 6 large colored tiles (tools blue,
    entertainment pink, developer violet, theme emerald,
    productivity amber, accessibility cyan), each with a count badge
  - **PluginCard** v2 — large 16:10 cover area, left-aligned title +
    author, compact rating/install row, used in all 6-column grids
  - All three content sections (Featured / Recent / Top Rated) now
    use the new card and a 6-column grid
- **Light / dark theme** end-to-end:
  - All colors tokenized as CSS variables in `index.css`
  - Tailwind config maps `primary` / `surface` / `text-*` etc. to vars
  - `useTheme` hook with localStorage + OS preference fallback
  - `ThemeToggle` pill in the header (sun/moon)

### Changed
- `bg-white` -> `bg-surface` across PluginDetail and Developer pages
  so they follow the active theme

## [1.3.0] - 2026-06-08

### Security
- **Admin authentication required for all write operations.** New
  `POST /api/auth/login` exchanges a GitHub Personal Access Token
  (scoped to `read:user`) for a short-lived JWT (7d, configurable via
  `JWT_TTL`).
- The set of GitHub usernames allowed to administer the store is
  controlled by the `ADMIN_GITHUB_USERS` env var (comma-separated).
- Endpoints now gated with `requireAdmin`:
  - `POST /api/plugins`, `PUT /api/plugins/:id`, `DELETE /api/plugins/:id`
  - `POST /api/upload/icon`, `/screenshot`, `/package`
  - `POST /api/github/import`
- Public endpoints (intentionally left open):
  - `GET /api/plugins*`, `GET /api/plugins/:id`
  - `POST /api/plugins/:id/install` (user-facing install counter)
  - `GET /api/auth/me` (with valid JWT)
  - `POST /api/github/detect` (read-only metadata for prefill)

### Added
- `backend/services/auth.js` — JWT signing, GitHub PAT verification,
  `requireAuth` / `requireAdmin` middlewares
- `backend/routes/auth.js` — `/login`, `/me`, `/logout`
- `web/src/hooks/useAuth.jsx` — `AuthProvider` + `useAuth` context
  (validates stored token on mount, exposes `user` / `isAdmin` /
  `login` / `logout`)
- `web/src/components/LoginModal.jsx` — token entry dialog with
  inline instructions for getting a GitHub PAT
- `web/src/components/Header.jsx` — user pill + dropdown menu,
  login button replaces the action button when not authenticated
- `web/src/pages/Developer.jsx` — auth gate: full-page login screen
  when not admin, otherwise the existing dashboard
- `web/src/api/index.js` — auto-attaches `Authorization: Bearer <jwt>`
  on every request, including multipart uploads

### Dependencies
- backend: `passport`, `passport-github2`, `jsonwebtoken`,
  `express-session`, `cookie-session`

### Environment variables (new)
- `ADMIN_GITHUB_USERS` (required to enable login) — comma-separated
  GitHub logins allowed to write
- `JWT_SECRET` (required in production) — signing key for JWT
- `JWT_TTL` (optional, default `7d`) — token lifetime

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
