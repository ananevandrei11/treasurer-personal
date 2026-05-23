# Developer Guide

---

## Adding a backend module

Use `transactions` as the reference implementation.

### 1. Create the module folder

```
backend/src/modules/<domain>/
  <domain>.controller.ts
  <domain>.service.ts
  <domain>.module.ts
  dto/
  commands/
    handlers/
  queries/
    handlers/
  repositories/
```

### 2. Repository

One repository per aggregate. Inject `PrismaService` — never call Prisma outside the repository.

```ts
@Injectable()
export class WidgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string): Promise<Widget[]> {
    return this.prisma.widget.findMany({ where: { userId } })
  }
}
```

Always scope queries by `userId`. Never trust `id` from the request body alone.

### 3. Commands and queries

**Command** (write side):
```ts
// commands/create-widget.command.ts
export class CreateWidgetCommand {
  constructor(
    public readonly userId: string,
    public readonly name: string,
  ) {}
}

// commands/handlers/create-widget.handler.ts
@CommandHandler(CreateWidgetCommand)
export class CreateWidgetHandler implements ICommandHandler<CreateWidgetCommand> {
  constructor(private readonly repo: WidgetRepository) {}

  execute(command: CreateWidgetCommand): Promise<Widget> {
    return this.repo.create({ userId: command.userId, name: command.name })
  }
}
```

**Query** (read side):
```ts
export class GetWidgetsByUserQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetWidgetsByUserQuery)
export class GetWidgetsByUserHandler implements IQueryHandler<GetWidgetsByUserQuery> {
  constructor(private readonly repo: WidgetRepository) {}

  execute(query: GetWidgetsByUserQuery): Promise<Widget[]> {
    return this.repo.findAllByUser(query.userId)
  }
}
```

### 4. Service

The service only dispatches — no business logic, no Prisma:

```ts
@Injectable()
export class WidgetsService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  create(userId: string, name: string): Promise<Widget> {
    return this.commandBus.execute(new CreateWidgetCommand(userId, name))
  }

  findAll(userId: string): Promise<Widget[]> {
    return this.queryBus.execute(new GetWidgetsByUserQuery(userId))
  }
}
```

### 5. DTOs

Input DTOs use class-validator. Response DTOs expose `static fromEntity`:

```ts
export class CreateWidgetDto {
  @IsString()
  @MinLength(1)
  name!: string
}

export class WidgetDto {
  id!: string
  name!: string

  static fromEntity(w: Widget): WidgetDto {
    const dto = new WidgetDto()
    dto.id = w.id
    dto.name = w.name
    return dto
  }
}
```

Add Swagger decorators (`@ApiProperty`, `@ApiOperation`, `@ApiResponse`) to DTOs and controllers.

### 6. Controller

```ts
@ApiTags('widgets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('widgets')
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Get()
  async findAll(@Req() req: Request): Promise<WidgetDto[]> {
    const { userId } = req.user as JwtUser
    const widgets = await this.widgetsService.findAll(userId)
    return widgets.map(WidgetDto.fromEntity)
  }
}
```

### 7. Module wiring

```ts
@Module({
  imports: [CqrsModule],
  controllers: [WidgetsController],
  providers: [
    WidgetsService,
    WidgetRepository,
    CreateWidgetHandler,
    GetWidgetsByUserHandler,
  ],
})
export class WidgetsModule {}
```

Register in `AppModule`:

```ts
// app.module.ts
imports: [..., WidgetsModule]
```

---

## Adding a Prisma model / migration

### 1. Edit the schema

```prisma
// backend/prisma/schema.prisma
model Widget {
  id        String   @id @default(uuid())
  name      String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

Add the relation back-reference to `User`:

```prisma
model User {
  ...
  widgets Widget[]
}
```

### 2. Create and apply migration

```bash
pnpm --filter backend prisma:migrate
# prompts for a migration name, e.g. "add_widget"
```

This also regenerates the Prisma client.  
If you only changed the schema without a data change, you can use `prisma:generate` instead.

### 3. Rules

- Money fields: `Decimal @db.Decimal(12, 2)` — never `Float`
- Ownership: add `userId` FK + `@@index([userId])` to every user-scoped model
- Soft delete is not used — hard delete with cascade/restrict as appropriate
- Never edit migration SQL files manually — create a new migration instead

---

## Adding a frontend feature

Use `features/auth/login` as the reference implementation.

### 1. Create the slice

```
frontend/src/features/<domain>/<action>/
  index.ts
  model/<action>.ts
  api/<action>-action.ts
  ui/<Component>.tsx
```

### 2. Zod schema (`model/<action>.ts`)

```ts
import { z } from 'zod'

export const createWidgetSchema = z.object({
  name: z.string().min(1),
})

export type CreateWidgetInput = z.infer<typeof createWidgetSchema>
```

### 3. Server Action (`api/<action>-action.ts`)

```ts
'use server'

import { fetchWithAuth } from '@/shared/api'
import { ApiError } from '@/shared/api'
import { revalidatePath } from 'next/cache'
import { createWidgetSchema } from '../model/create-widget'

type State = { fieldErrors: Partial<Record<'name', string[]>>; formError: string | null }

export async function createWidgetAction(_prev: State, formData: FormData): Promise<State> {
  const parsed = createWidgetSchema.safeParse({ name: formData.get('name') })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, formError: null }
  }

  try {
    await fetchWithAuth('/widgets', { method: 'POST', body: JSON.stringify(parsed.data) })
    revalidatePath('/dashboard')
    return { fieldErrors: {}, formError: null }
  } catch (e) {
    if (e instanceof ApiError) {
      return { fieldErrors: {}, formError: e.message }
    }
    return { fieldErrors: {}, formError: 'Something went wrong' }
  }
}
```

### 4. Client component (`ui/<Component>.tsx`)

```tsx
'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button, Field, FieldError, Input, Label } from '@/shared/ui'
import { createWidgetAction } from '../api/create-widget-action'

const initialState = { fieldErrors: {}, formError: null }

export function CreateWidgetForm() {
  const [state, action] = useActionState(createWidgetAction, initialState)

  return (
    <form action={action}>
      <Field data-invalid={!!state.fieldErrors.name}>
        <Label>Name</Label>
        <Input name="name" />
        {state.fieldErrors.name && <FieldError>{state.fieldErrors.name[0]}</FieldError>}
      </Field>
      {state.formError && <p>{state.formError}</p>}
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>Create</Button>
}
```

### 5. Public API (`index.ts`)

```ts
export { CreateWidgetForm } from './ui/CreateWidgetForm'
```

### 6. Usage in a view or widget

```tsx
// views/dashboard/ui/DashboardView.tsx
import { CreateWidgetForm } from '@/features/widgets/create'

export function DashboardView() {
  return (
    <div>
      <CreateWidgetForm />
    </div>
  )
}
```

Import always from the slice root — never from internal paths like `@/features/widgets/create/ui/...`.

---

## Adding a shadcn/ui component

```bash
pnpm dlx shadcn@latest add <name>
```

The component is placed in `frontend/src/shared/ui/`. Re-export it from the barrel:

```ts
// frontend/src/shared/ui/index.ts
export { NewComponent } from './new-component'
```

Consumers import via `import { NewComponent } from '@/shared/ui'`.

---

## Checklist before merging

```bash
# Backend
pnpm --filter backend lint
pnpm --filter backend typecheck

# Frontend
pnpm --filter frontend lint
pnpm --filter frontend typecheck

# Both
pnpm typecheck
```

Verify the feature works end-to-end in the browser before merging.
