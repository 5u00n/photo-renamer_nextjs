# Changelog

All notable changes to **PhotoNamer** will be documented in this file.

---

## [1.1.0] — 2026-08-08

### Added
- **GNU General Public License v3.0 (GPLv3)**: Added full `LICENSE` file.
- **SQLite Database Integration**: Local database (`data/photo_namer.db` via `better-sqlite3`) storing persistent `users` and `photos`.
- **Multi-User Authentication System**:
  - Regular Users (`user` role): Can register (`/register`), login (`/login`), upload photos, and view/delete **only their own** uploads.
  - Admin Users (`admin` role): Can access `/admin` dashboard to view, filter, download, and delete **all photos from all users** with owner username badges.
- **App Router ONLY**: Full application migration to Next.js App Router (`src/app/`). Removed `src/pages/`.
- **JWT HTTP-Only Cookie Session**: Cookie session authentication using `jose` and `bcryptjs`.

---

## [1.0.0] — 2026-08-08

### Added
- Security fixes and baseline documentation.
