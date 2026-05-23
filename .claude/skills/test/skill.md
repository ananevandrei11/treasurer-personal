---
name: test
description: Generate NestJS unit tests for a given TypeScript file. Use this skill whenever the user asks to write unit tests, generate specs, "напиши тесты", "сгенерируй unit-тесты", "покрой тестами", or passes a path to a backend file and wants test coverage. Arguments: first arg = path to the file under test (e.g. `/test src/modules/auth/auth.service.ts`).
argument-hint: "<path/to/file.ts>"
model: Sonnet
effort: low
allowedTools:
  - Read
  - Bash(cat *)
  - Bash(grep *)
  - Bash(find *)
  - Bash(pnpm *)
  - Bash(npm *)
  - Bash(node *)
  - Write
  - Edit
---

# test — NestJS Unit Test Generator

Generates a `[name].spec.ts` file with Jest unit tests for a given NestJS TypeScript file.

- **$0** — path to the file under test (relative to repo root or absolute)

If the argument is missing, ask the user to provide the file path before proceeding.

## Workflow

### 1. Read the target file

Read the full source of `$0`. Identify:
- **Class name** and **type** (Service, Handler, Repository, Guard, Controller, etc.)
- **Constructor dependencies** (injected via `constructor(private readonly ...)`)
- **All public methods** — names, parameters, return types, thrown exceptions
- **Private helpers** used internally (relevant for understanding flow, not tested directly)
- **External modules** imported at the top (needed to understand mock shapes)

### 2. Ensure test tooling is available

Check `backend/package.json` for `jest`, `@nestjs/testing`, `ts-jest`, and `@types/jest` in devDependencies.

If any are missing, install them:
```bash
cd backend && pnpm add -D jest @nestjs/testing ts-jest @types/jest
```

Also check for a `jest` config block in `backend/package.json` or a `jest.config.ts` at the backend root. If neither exists, add a minimal Jest config to `backend/package.json`:

```json
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

And add a test script if missing:
```json
"test": "jest",
"test:watch": "jest --watch",
"test:cov": "jest --coverage"
```

### 3. Determine the spec file path

Place the spec file next to the source file: if the source is `src/modules/auth/auth.service.ts`, the spec is `src/modules/auth/auth.service.spec.ts`.

If a spec file already exists, read it first and extend it rather than overwriting.

### 4. Build the mock strategy

For each constructor dependency:
- **CommandBus / QueryBus**: mock with `{ execute: jest.fn() }` — this is the CQRS pattern used throughout the project
- **JwtService**: mock with `{ signAsync: jest.fn(), verifyAsync: jest.fn() }`
- **ConfigService**: mock with `{ getOrThrow: jest.fn() }` — often returns config values
- **PrismaService**: mock the specific Prisma model methods actually used (e.g., `{ user: { findUnique: jest.fn(), create: jest.fn() } }`)
- **Custom Repository** (e.g., `UserRepository`): mock each method the service calls with `jest.fn()`
- **Other services**: mock each public method called by the subject under test

Keep mocks minimal — only mock what the method under test actually calls.

### 5. Generate test cases per method

For each public method, write three categories of tests:

**Happy path** — nominal input, assert the return value and that the right dependency methods were called with the right arguments.

**Edge/boundary cases** — empty strings, null/undefined inputs, zero values, empty arrays — wherever the method's logic branches.

**Error cases** — when a dependency returns null/undefined or throws, assert the correct NestJS exception is thrown (e.g., `NotFoundException`, `UnauthorizedException`, `ConflictException`).

Use `jest.fn().mockResolvedValue(...)` for async mocks and `jest.fn().mockReturnValue(...)` for sync ones.

### 6. Write the spec file

Structure:

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { <ClassName> } from './<filename>'
// ... other imports

describe('<ClassName>', () => {
  let service: <ClassName>
  // mock declarations

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        <ClassName>,
        { provide: <Dep>, useValue: mock<Dep> },
        // ...
      ],
    }).compile()

    service = module.get<<ClassName>>(<ClassName>)
  })

  describe('<methodName>', () => {
    it('should <happy path description>', async () => { ... })
    it('should throw <ExceptionType> when <condition>', async () => { ... })
  })
})
```

Rules:
- One `describe` block per public method
- `it` descriptions start with "should" and describe the observable outcome, not the implementation
- Reset mocks in `beforeEach` via `jest.clearAllMocks()` or `mockReset()`
- Don't import implementation details — test through the public API only
- For async methods, always `await` and use `async` in `it` callbacks

### 7. Run the tests

```bash
cd backend && pnpm test -- --testPathPattern="<spec-filename>"
```

If tests fail:
- Read the error output carefully
- Fix type mismatches in mocks (the most common cause)
- Fix incorrect mock setup (e.g., method returns wrong shape)
- Adjust assertions if the logic is sound but the test expectation was wrong
- Re-run until all tests pass

Report the final results: how many tests passed and the full list of test names.

## Hard constraints

- Never test private methods directly.
- Never use `jest.mock(...)` at the module level for NestJS providers — always use `Test.createTestingModule` with `useValue` mocks.
- Never import `PrismaClient` directly in tests — mock the repository instead.
- Don't install production dependencies to satisfy tests — only devDependencies.
- If `$0` is a `.dto.ts`, `.module.ts`, or `.controller.ts` file: generate tests only if there's meaningful logic to test (validators, guards, transformations). Warn the user if the file is trivial.
