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
-- Then run schema.sql and seed.sql against this database
```
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

> Password is inserted in plaintext for first login **only** (to simplify setup).  
> Once you create/update users via API, passwords are stored **hashed**.

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
