# **App Name**: PhotoNamer

## Status: v1.0.0 — Production Prototype

---

## Core Features

| Feature | Status | Notes |
|---|---|---|
| Photo Upload (drag-and-drop) | ✅ Implemented | Supports all image formats |
| Camera Capture (front/back) | ✅ Implemented | Detects multiple cameras |
| Name Entry Dialog | ✅ Implemented | Opens after file select/capture |
| Preview Display | ✅ Implemented | Shown before saving |
| Auto-Increment Duplicate Names | ✅ Implemented | e.g., `John Doe` → `John Doe 2` |
| Photo Saving (server) | ✅ Implemented | Via `POST /api/photos` |
| Admin Dashboard | ✅ Implemented | Requires password |
| Admin Auth (server-side) | ✅ Implemented | Uses `ADMIN_PASSWORD` env var |
| Download Photo | ✅ Implemented | Downloads from data URI |
| Delete Photo | ✅ Implemented | With confirmation dialog |
| Photo Saving (persistent DB) | 🔲 Not Implemented | See [Future Roadmap](#future-roadmap) |
| ID Assistance (auto-increment) | ✅ Implemented | Handled server-side |

---

## Style Guidelines

- **Primary color**: Light, desaturated blue (`--primary: 204 45% 79%`) for calmness and reliability
- **Background color**: Very light gray (`--background: 0 0% 96.1%`) for clean, neutral backdrop
- **Accent color**: Soft green (`--accent: 120 73% 75%`) to signal successful upload and renaming
- **Font**: `Inter` — grotesque-style sans-serif for both body and headlines
- **Dark mode**: Supported via CSS custom properties (`.dark` class)
- **Icons**: Lucide React — simple, clear, consistent
- **Layout**: Centered card design for upload; grid layout for admin dashboard
- **Animations**: Spinner on save, fade/transition on success state

---

## Architecture

See [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) for full technical details.

- **Framework**: Next.js 16 (Pages Router)
- **API**: REST routes at `src/pages/api/`
- **Storage**: In-memory array (prototype — not persistent)
- **Auth**: Server-side password via `ADMIN_PASSWORD` env var

---

## Future Roadmap

1. **Persistent storage**: Migrate `photo-store.ts` to Firebase Firestore (metadata) + Firebase Storage (images)
2. **Real authentication**: Replace stateless password check with session cookies or JWT
3. **Rate limiting**: Protect API routes from abuse
4. **Pagination**: Paginate admin dashboard (cursor-based)
5. **Bulk download**: ZIP export of all photos
6. **Search**: Filter admin dashboard by student name
7. **Upload progress**: WebSocket or SSE-based progress for large files
8. **Class/Batch organization**: Group photos by class, year, section