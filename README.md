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
import bcrypt from "bcrypt";

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


