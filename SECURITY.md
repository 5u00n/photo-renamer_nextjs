# Security Policy

## License
PhotoNamer is licensed under the **GNU General Public License v3.0 (GPLv3)**.

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.1.x   | ✅ |
| < 1.1   | ❌ |

---

## Security Features Implemented

- **Database**: SQLite3 with prepared statements via `better-sqlite3` to prevent SQL Injection.
- **Password Hashing**: Passwords hashed with `bcryptjs` (salt rounds: 10).
- **Session Tokens**: JWT tokens signed with secret key (`jose`), stored in `HttpOnly`, `SameSite=Lax` cookies.
- **Role-Based Access Control**:
  - Regular Users can only view/delete photos linked to their `user_id`.
  - Admin access (`/admin`) enforces `role === 'admin'`.
- **Validation**: All API inputs validated with Zod schemas (max 5MB file size, MIME whitelist).
