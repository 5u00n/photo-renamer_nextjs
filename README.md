# PhotoNamer

> **A Next.js App Router web application for uploading, naming, and managing student photos — backed by an embedded SQLite database and GNU GPLv3 license.**

[![Next.js](https://img.shields.io/badge/Next.js-16.x%20(App%20Router)-black?logo=next.js)](https://nextjs.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite3-003B57?logo=sqlite)](https://www.sqlite.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

---

## 📸 What is PhotoNamer?

**PhotoNamer** is a student photo management application built on Next.js **App Router** (`src/app/`). Users can register an account, upload photos from their device or capture directly from camera, assign student names, and view their uploaded gallery.

Admin users have access to an **Admin Dashboard** (`/admin`) to inspect, filter, download, and manage all photo uploads across all users.

---

## ✨ Features & User Roles

### User Roles
- 👤 **Regular User (`user`)**:
  - Register & Sign in
  - Upload photos (drag-and-drop or webcam)
  - View & manage **only their own** uploaded photos
- 🛡️ **Administrator (`admin`)**:
  - Sign in with admin credentials
  - Access `/admin` dashboard
  - View **all photos from all users** with owner badges
  - Search / filter uploads by photo name or owner username
  - Delete any photo record

### Key Capabilities
- 🗄️ **Embedded SQLite Database**: Local persistent storage (`data/photo_namer.db`) for users and photos
- 🔐 **JWT Cookie Sessions**: Secure HTTP-only cookie authentication (`jose` + `bcryptjs`)
- 🏷️ **Auto-Increment Duplicate Names**: Automatic name suffix generation (e.g. `John Doe`, `John Doe 2`) per user
- 📐 **App Router File System**: Clean folder-based structure entirely within `src/app/`
- 🛡️ **GNU GPLv3 Open Source License**: Free and open software license

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (**App Router ONLY** — `src/app/`) |
| Database | [SQLite3](https://www.sqlite.org/) via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) |
| Authentication | JWT (`jose`) + `bcryptjs` + HTTP-only cookies |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| License | **GNU General Public License v3.0 (GPLv3)** |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18.x or higher
- npm 9.x or higher

### 1. Clone the repository
```bash
git clone https://github.com/your-username/photo-renamer_nextjs.git
cd photo-renamer_nextjs
```

### 2. Install dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Environment Variables
Create a `.env.local` file:
```env
ADMIN_PASSWORD=admin123
JWT_SECRET=your_super_secret_jwt_key_2026
```

### 4. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser.

---

## 🔑 Default Credentials

On initial startup, SQLite automatically seeds the default admin account:
- **Admin Username**: `admin`
- **Admin Password**: `admin123` (or the value of `ADMIN_PASSWORD` in `.env.local`)

Regular users can register new accounts at `/register`.

---

## 📁 App Router Directory Structure

```
photo-renamer_nextjs/
├── data/                        # SQLite Database file location (gitignored)
│   └── photo_namer.db
├── LICENSE                      # GNU General Public License v3.0
├── src/
│   ├── app/                     # Next.js App Router (ONLY ROUTE)
│   │   ├── layout.tsx           # Root layout with Inter font & Navbar
│   │   ├── page.tsx             # User Dashboard & Photo Uploader
│   │   ├── login/page.tsx       # User & Admin Login page
│   │   ├── register/page.tsx    # New Account Registration page
│   │   ├── admin/page.tsx       # Admin Dashboard (All User Uploads)
│   │   ├── not-found.tsx        # Custom 404 page
│   │   ├── globals.css          # Global Tailwind CSS styling
│   │   └── api/                 # App Router Route Handlers (route.ts)
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── register/route.ts
│   │       │   ├── logout/route.ts
│   │       │   └── me/route.ts
│   │       └── photos/
│   │           ├── route.ts     # GET (user/admin photos) & POST (upload)
│   │           └── [id]/route.ts# DELETE photo by ID
│   ├── db/                      # SQLite Connection & Helper Queries
│   │   └── index.ts
│   ├── lib/                     # JWT Session & Utils
│   │   ├── auth.ts
│   │   └── utils.ts
│   └── components/              # UI Components
│       ├── navbar.tsx           # Header Navigation
│       ├── photo-namer.tsx      # Main Photo Upload / Camera Component
│       └── ui/                  # shadcn/ui components
└── docs/                        # Project Documentation
    ├── ARCHITECTURE.md
    └── API.md
```

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)** — see the [LICENSE](LICENSE) file for details.
