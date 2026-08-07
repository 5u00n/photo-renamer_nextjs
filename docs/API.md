# API Documentation — PhotoNamer

> **Base URL**: `http://localhost:9002` (development)
> **Routing Framework**: Next.js App Router (`src/app/api/`)
> **Format**: JSON (`Content-Type: application/json`)

---

## Authentication Endpoints

### `POST /api/auth/login`
Authenticates a user or admin and sets an HTTP-only JWT `session` cookie.

**Request Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

---

### `POST /api/auth/register`
Registers a new user account with `role: 'user'`.

**Request Body**:
```json
{
  "username": "student1",
  "password": "password123"
}
```

**Response `201 Created`**:
```json
{
  "success": true,
  "user": {
    "id": 2,
    "username": "student1",
    "role": "user"
  }
}
```

---

### `POST /api/auth/logout`
Clears the session cookie.

**Response `200 OK`**:
```json
{ "success": true, "message": "Logged out successfully" }
```

---

### `GET /api/auth/me`
Returns current session info for the authenticated user.

**Response `200 OK`**:
```json
{
  "authenticated": true,
  "user": {
    "userId": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

---

## Photo Endpoints

### `GET /api/photos`
Fetches uploaded photos.

- **Regular User**: Returns only photos uploaded by the logged-in user.
- **Admin User** (`?scope=all`): Returns all photos across all users with owner usernames.

**Response `200 OK`**:
```json
[
  {
    "id": 1,
    "user_id": 2,
    "name": "Jane Doe",
    "data_uri": "data:image/jpeg;base64,...",
    "uploaded_at": "2026-08-08 01:25:00",
    "username": "student1"
  }
]
```

---

### `POST /api/photos`
Uploads and saves a new photo record to the SQLite database.

**Request Body**:
```json
{
  "photoDataUri": "data:image/jpeg;base64,...",
  "newName": "Jane Doe"
}
```

**Response `201 Created`**:
```json
{
  "success": true,
  "message": "Photo saved successfully.",
  "photo": {
    "id": 1,
    "user_id": 2,
    "name": "Jane Doe",
    "data_uri": "data:image/jpeg;base64,...",
    "uploaded_at": "2026-08-08 01:25:00"
  }
}
```

---

### `DELETE /api/photos/:id`
Deletes a photo record by ID. Users can delete their own photos; admins can delete any photo.

**Response `200 OK`**:
```json
{ "success": true, "message": "Photo deleted successfully" }
```
