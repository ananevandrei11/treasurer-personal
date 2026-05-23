# Database

Provider: **PostgreSQL 17**  
ORM: **Prisma 7** with `@prisma/adapter-pg` (native pg driver, no Prisma connection pool)  
Schema: `backend/prisma/schema.prisma`  
Migrations: `backend/prisma/migrations/`

---

## Models

### User

```prisma
model User {
  id               String        @id @default(uuid())
  email            String        @unique
  name             String
  passwordHash     String
  refreshTokenHash String?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  categories       Category[]
  transactions     Transaction[]
}
```

| Field             | Type      | Notes                                              |
|-------------------|-----------|----------------------------------------------------|
| `id`              | uuid      | PK, auto-generated                                 |
| `email`           | string    | unique, used for login                             |
| `name`            | string    | display name                                       |
| `passwordHash`    | string    | bcrypt hash of the password                        |
| `refreshTokenHash`| string?   | bcrypt hash of the current refresh token; `null` after logout |
| `createdAt`       | DateTime  | set on insert                                      |
| `updatedAt`       | DateTime  | auto-updated on every write                        |

---

### Category

```prisma
model Category {
  id           String        @id @default(uuid())
  name         String
  color        String
  icon         String
  userId       String
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([userId])
}
```

| Field      | Type     | Notes                                               |
|------------|----------|-----------------------------------------------------|
| `id`       | uuid     | PK                                                  |
| `name`     | string   | 1–50 chars                                          |
| `color`    | string   | hex color, e.g. `#FF5733`                           |
| `icon`     | string   | lucide icon name, e.g. `utensils`                   |
| `userId`   | string   | FK → `User.id`, cascade delete                      |
| `createdAt`| DateTime |                                                     |
| `updatedAt`| DateTime |                                                     |

**Index:** `@@index([userId])` — fast lookup of all categories for a user.

**Cascade:** Deleting a `User` cascades to all their `Category` rows.  
**Restrict:** Deleting a `Category` is **blocked** (`onDelete: Restrict`) if any `Transaction` references it.

---

### Transaction

```prisma
model Transaction {
  id          String          @id @default(uuid())
  amount      Decimal         @db.Decimal(12, 2)
  type        TransactionType
  description String?
  date        DateTime
  categoryId  String
  category    Category        @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  userId      String
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([userId, date])
  @@index([categoryId])
}
```

| Field         | Type             | Notes                                              |
|---------------|------------------|----------------------------------------------------|
| `id`          | uuid             | PK                                                 |
| `amount`      | Decimal(12, 2)   | stored as exact decimal; **never coerce to float** |
| `type`        | TransactionType  | enum: `INCOME` \| `EXPENSE`                        |
| `description` | string?          | optional note, max 500 chars                       |
| `date`        | DateTime         | the logical date of the transaction                |
| `categoryId`  | string           | FK → `Category.id`, restrict delete                |
| `userId`      | string           | FK → `User.id`, cascade delete                     |
| `createdAt`   | DateTime         |                                                    |
| `updatedAt`   | DateTime         |                                                    |

**Indexes:**
- `@@index([userId, date])` — fast filtering by user + month/year range
- `@@index([categoryId])` — fast cascade check and category-scoped queries

**Cascade:** Deleting a `User` cascades to all their `Transaction` rows.

---

### Enum

```prisma
enum TransactionType {
  INCOME
  EXPENSE
}
```

---

## Decimal handling

`amount` uses `Decimal(12, 2)` — up to 10 integer digits and 2 decimal places.

Rules:
- **Input**: accept as decimal string (e.g. `"120.50"`) — validated by regex in `CreateTransactionDto`
- **Repository**: pass the string directly to Prisma — it converts to `Decimal` internally
- **Output**: serialize via `.toString()` in `TransactionDto.fromEntity` — never return a JS `number`
- **Never** use `parseFloat` or arithmetic on `amount` — floating point loses precision

```ts
// correct
dto.amount = entity.amount.toString()

// wrong — loses precision
dto.amount = Number(entity.amount)
```

---

## Migrations

```bash
# Apply pending migrations (dev — also updates Prisma client)
pnpm --filter backend prisma:migrate

# After editing schema.prisma — regenerate client only (no migration)
pnpm --filter backend prisma:generate

# Interactive DB browser
pnpm --filter backend prisma:studio
```

Migration files live in `backend/prisma/migrations/`. Each folder is named `{timestamp}_{description}`.  
Never edit migration SQL files by hand — run `prisma migrate dev` to create a new migration.
