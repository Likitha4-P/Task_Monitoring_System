# Task Monitoring Backend (Node.js + Express + MySQL)

## Setup
1. Install dependencies
```bash
cd backend
npm install
```
2. Create database + tables
```sql
CREATE DATABASE task_monitoring;
-- Then run/import schema.sql  against this database
```
3. Update seed.sql :

**Store Hashed Passwords in seed.sql**

As we are bcrypt based login, 
Instead of plain text, store bcrypt-hashed passwords in your seed data.
This ensures that bcrypt.compare() works correctly and keeps user credentials secure.

#### a. Generate bcrypt hashes

Create a simple Node.js script (e.g., generate-hash.js):

```
import bcrypt from "bcryptjs";

const passwords = ["admin123", "user123"]; // replace with your seed passwords

for (const p of passwords) {
  const hash = await bcrypt.hash(p, 10);
  console.log(`${p} → ${hash}`);
}

```

#### b. Run

```
node generate-hash.js
```
You’ll get output like:
```
admin123 → $2b$10$3dykj0b8qPm6nHmgV3s5OtWcUpHy4CjM3EwzP8G5y8SgDa8eCma6
user123  → $2b$10$SrbIEJ3RwgrF0yZt2Hc7MOh8NvBYF7D1Gz8UbEdT6g3F7VJq2rGBO
```

#### c. Update your seed.sql

Replace plain text passwords with the generated hashes.
```
-- ❌ Before
-- INSERT INTO users (.., email, password, ..) VALUES (.., 'admin@example.com', 'admin123', ..);

-- ✅ After
INSERT INTO users (.., email, password, ..) VALUES 
(.., 'admin@example.com', '$2b$10$3d.ykj0b8qPm6nHmgV3s5OtWcUpHy4CjM3EwzP8G5y8SgDa8eCma6', ..),
(.., 'user@example.com', '$2b$10$SrbIEJ3RwgrF0yZt2Hc7MOh8NvBYF7D1Gz8UbEdT6g3F7VJq2rGBO', ..);

```

#### d. import 

Run/import the seed.sql against the database.

3. Configure environment
```
cp .env.example .env
# edit DB credentials & JWT_SECRET
```
4. Start server
```bash
npm run dev
# or
npm start
```

## Initial Login
Seed creates:
- **email:** `admin@example.com`
- **password:** `Admin@123`


## API (base `/api`)
### Auth
- `POST /auth/login` → `{ email, password }` → `{ token, user }`

### Users (Admin)
- `GET /users`
- `POST /users` → `{ name, email, password, role, department? }`
- `PUT /users/:id`
- `DELETE /users/:id`

### Tasks
- `POST /tasks` (Admin, Department Head)
- `GET /tasks` (role-aware list)
- `GET /tasks/:id`
- `PUT /tasks/:id` (Admin, Department Head, Professor Incharge)
- `PATCH /tasks/:id/progress` (assignee or Admin)

### Events
- `POST /events` (any authenticated user)
- `GET /events`
- `POST /events/:id/approve` (Admin, Principal/Management, Department Head)
- `POST /events/:id/reject` (Admin, Principal/Management, Department Head)

## Frontend Integration (quick examples)

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login  -H "Content-Type: application/json"  -d '{"email":"admin@example.com","password":"Admin@123"}'
```

**Use token**
```bash
TOKEN=... # paste token
curl http://localhost:5000/api/users -H "Authorization: Bearer $TOKEN"
```

Update your frontend `app.js` to call these endpoints using `fetch` and store the JWT in `localStorage`.


# Google Drive File Upload Integration (Node.js)

This guide explains how to upload files from a **Node.js backend** to **Google Drive** using the **Google Drive API**.

In this project, uploaded task deliverables are stored in Google Drive instead of the local server.

---

# Overview

The application allows users to upload files which are then stored securely in Google Drive.

The backend uses:

- Node.js
- Express.js
- Multer
- Google Drive API

## Workflow

1. User uploads a file from the frontend.
2. Backend receives the file using Multer.
3. The file is uploaded to Google Drive.
4. Google Drive returns a **fileId**.
5. A shareable link is generated and stored in the database.

---

# Step 1: Create a Google Cloud Project

1. Open: https://console.cloud.google.com
2. Click **Select Project → New Project**
3. Enter:

Project Name: Task Monitoring App



4. Click **Create**
5. Select the newly created project.

---

# Step 2: Enable Google Drive API

1. Go to:
APIs & Services → Library
Search : Google Drive API


3. Click **Enable**

This allows your application to interact with Google Drive programmatically.

---

# Step 3: Configure OAuth Consent Screen

1. Navigate to:

APIs & Services → OAuth Consent Screen

2. Select: External


3. Fill the required fields:

| Field | Value |
|------|------|
App Name | Task Monitoring App |
User Support Email | Your Email |
Developer Email | Your Email |

4. Click **Save and Continue**

Scopes and Test Users can be skipped for development.

---

# Step 4: Create OAuth Credentials

1. Go to:
APIs & Services → Credentials


2. Click:
Create Credentials → OAuth Client ID

3. Choose:

Application Type: Desktop App


4. Name:

Drive Upload Client


5. Click **Create**

---

# Step 5: Download Credentials

After creating credentials:

1. Click **Download JSON**
2. Rename the file to:


credentials.json


3. Place it inside the project root.

Example structure:


project-root
│
├── credentials.json
├── driveAuth.js
├── uploadRoute.js
└── server.js


⚠️ Do not upload this file to GitHub.

Add to `.gitignore`:


credentials.json
token.json


---

# Step 6: Install Dependencies

Install required packages.


npm install googleapis multer


Packages used:

| Package | Purpose |
|------|------|
googleapis | Access Google APIs |
multer | Handle file uploads |

---

# Step 7: Setup Google Drive Authentication


