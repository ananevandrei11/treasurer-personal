# API Reference

Base URL: `http://localhost:3001/api`  
Swagger UI: `http://localhost:3001/api/docs`

All protected routes require `Authorization: Bearer <accessToken>` header.  
Tokens are rotated automatically by the frontend `proxy.ts` before each request (decodes access JWT `exp`, calls `/auth/refresh` when needed, updates cookies on the response).

---

## Auth — `/api/auth`

### POST /auth/register
Rate-limited: **5 req / 60 s**

**Body**
```json
{ "email": "user@example.com", "name": "Alice", "password": "secret123" }
```

| Field      | Type   | Rules                      |
|------------|--------|----------------------------|
| `email`    | string | valid email                |
| `name`     | string | minLength: 2               |
| `password` | string | minLength: 8               |

**Response 201**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "uuid", "email": "...", "name": "...", "createdAt": "...", "updatedAt": "..." }
}
```

---

### POST /auth/login
Rate-limited: **10 req / 60 s**

**Body**
```json
{ "email": "user@example.com", "password": "secret123" }
```

**Response 200** — same shape as `/register`

---

### POST /auth/refresh
Requires: `Authorization: Bearer <refreshToken>`  
Guard: `AuthGuard('jwt-refresh')`

**Response 200**
```json
{ "accessToken": "...", "refreshToken": "..." }
```

The old refresh token is invalidated. A new pair is issued on every call.

---

### POST /auth/logout
Requires JWT access token.

**Response 204** — no body. Sets `refreshTokenHash = null` in DB.

---

## Users — `/api/users`

### GET /users/me
Requires JWT.

**Response 200**
```json
{ "id": "uuid", "email": "...", "name": "...", "createdAt": "...", "updatedAt": "..." }
```

---

## Transactions — `/api/transactions`

All routes require JWT. All results are scoped to the authenticated user.

### GET /transactions
Returns a paginated list with aggregate summary.

**Query parameters**

| Param   | Type | Default | Rules             |
|---------|------|---------|-------------------|
| `month` | int  | —       | 1–12 (optional)   |
| `year`  | int  | —       | 1970–2100 (optional) |
| `page`  | int  | 1       | ≥ 1               |
| `limit` | int  | 10      | 1–100             |

If both `month` and `year` are provided, results are filtered to that calendar month.  
If only one is provided, the filter is ignored.

**Response 200**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "amount": "120.50",
      "type": "EXPENSE",
      "description": "Groceries",
      "date": "2025-05-01T00:00:00.000Z",
      "categoryId": "uuid",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "summary": {
    "totalIncome": "500.00",
    "totalExpense": "120.50"
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

> `amount` is always a decimal string — never a number. Preserves `Decimal(12,2)` precision.

---

### POST /transactions

**Body**
```json
{
  "amount": "120.50",
  "type": "EXPENSE",
  "date": "2025-05-01",
  "categoryId": "uuid",
  "description": "Groceries"
}
```

| Field         | Type   | Rules                                              |
|---------------|--------|----------------------------------------------------|
| `amount`      | string | decimal string, up to 2 decimal places             |
| `type`        | enum   | `INCOME` \| `EXPENSE`                              |
| `date`        | string | ISO 8601 date string                               |
| `categoryId`  | string | UUID — must belong to the authenticated user       |
| `description` | string | optional, maxLength: 500                           |

**Response 201** — `TransactionDto` (see GET /transactions shape)

**Throws** `404 Not Found` if `categoryId` does not belong to the user.

---

### GET /transactions/:id

**Response 200** — single `TransactionDto`  
**Throws** `404 Not Found` if transaction doesn't exist or belongs to another user.

---

### PATCH /transactions/:id
All fields optional.

**Body** — same fields as POST, all optional.

**Response 200** — updated `TransactionDto`  
**Throws** `404 Not Found` if transaction or new `categoryId` is not found.

---

### DELETE /transactions/:id

**Response 204** — no body  
**Throws** `404 Not Found` if transaction doesn't exist or belongs to another user.

---

## Categories — `/api/categories`

All routes require JWT. All results are scoped to the authenticated user.

### GET /categories

**Response 200**
```json
[
  { "id": "uuid", "name": "Food", "color": "#FF5733", "createdAt": "...", "updatedAt": "..." }
]
```

---

### POST /categories

**Body**
```json
{ "name": "Food", "color": "#FF5733" }
```

| Field   | Type   | Rules                            |
|---------|--------|----------------------------------|
| `name`  | string | 1–50 chars                       |
| `color` | string | hex color, pattern `#[0-9A-Fa-f]{6}` |

**Response 201** — `CategoryDto`

---

### GET /categories/:id

**Response 200** — single `CategoryDto`  
**Throws** `404 Not Found` if not found or belongs to another user.

---

### PUT /categories/:id
Full replacement — all fields required.

**Body** — same as POST.

**Response 200** — updated `CategoryDto`

---

### DELETE /categories/:id

**Response 204** — no body  
**Throws** `404 Not Found` if not found or belongs to another user.  
**Throws** `400 Bad Request` (Prisma restrict) if any transaction references this category.

---

## Error format

All errors follow NestJS default format:

```json
{ "statusCode": 404, "message": "Not Found", "error": "Not Found" }
```

Validation errors (400):
```json
{
  "statusCode": 400,
  "message": ["amount must be a decimal string with up to 2 decimal places"],
  "error": "Bad Request"
}
```
