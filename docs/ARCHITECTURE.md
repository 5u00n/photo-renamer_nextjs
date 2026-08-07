# Architecture — PhotoNamer

> **Last Updated**: 2026-08-08 | **Version**: 1.1.0 (App Router + SQLite + GPLv3)

---

## Overview

PhotoNamer is a **Next.js 16 application** using **App Router ONLY** (`src/app/`). It is backed by an **embedded SQLite database** (`data/photo_namer.db` via `better-sqlite3`) providing multi-user authentication, role-based access control (User vs. Admin), and photo storage.

---

## Database Schema (SQLite)

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('user', 'admin')) NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  data_uri TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Component & Route Map (`src/app/`)

### Pages & Layouts
- `src/app/layout.tsx`: Root layout with font loading, Toast provider, and Navbar.
- `src/app/page.tsx`: Protected User Dashboard. Renders `<PhotoNamer />` and user's photos grid.
- `src/app/login/page.tsx`: Login view for users and admins.
- `src/app/register/page.tsx`: User registration view.
- `src/app/admin/page.tsx`: Admin Dashboard. Displays photos across all users with filter/search and owner labels.
- `src/app/not-found.tsx`: Custom 404 page.

### App Router Route Handlers (`src/app/api/`)
- `src/app/api/auth/login/route.ts`: Login authentication handler.
- `src/app/api/auth/register/route.ts`: User registration handler.
- `src/app/api/auth/logout/route.ts`: Logout session clear handler.
- `src/app/api/auth/me/route.ts`: Current session verification handler.
- `src/app/api/photos/route.ts`: GET photos (user's own or all if admin) & POST upload photo.
- `src/app/api/photos/[id]/route.ts`: DELETE photo by ID.

---

## Authentication & Security Flow

```
Client (Login/Register)
    │
    ▼
POST /api/auth/login
    │  1. Check bcrypt password hash against SQLite `users` table
    │  2. Generate signed JWT token (`jose`)
    │  3. Set HTTP-only, SameSite=Lax session cookie
    ▼
Verified Session
    │
    ├─► Regular User (`role='user'`) ──► View/Upload/Delete OWN photos
    │
    └─► Administrator (`role='admin'`) ──► Access `/admin`, view/delete ALL photos
```

---

## License

This software is licensed under the **GNU General Public License v3.0 (GPLv3)**.
