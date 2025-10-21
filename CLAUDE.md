# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Novel Studio Backend - LMS(Learning Management System) API 서버
개발자가 학습한 내용을 인터넷 강의처럼 공유하는 플랫폼의 백엔드

**Tech Stack:**
- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- Jest (Unit & Integration Tests)
- Winston (Logging)

## Development Commands

### Environment Setup
```bash
npm install
npm run docker:test:up              # Start test PostgreSQL container
npm run prisma:generate             # Generate Prisma Client
npm run prisma:migrate              # Run migrations (dev DB)
npm run prisma:migrate:test         # Run migrations (test DB)
```

### Development
```bash
npm run start:dev                   # Dev server with hot reload (uses .env.dev)
npm run start:debug                 # Dev server with debugger
npm run prisma:studio               # Open Prisma Studio (GUI for DB)
```

### Testing
```bash
npm run test:unit                   # Run unit tests only
npm run test:integration            # Run integration tests (uses .env.test)
npm run test:watch:unit             # Unit tests in watch mode
npm run test:watch:integration      # Integration tests in watch mode
npm run test:cov:unit               # Unit test coverage
npm run test:cov:integration        # Integration test coverage
```

**Important:** Integration tests automatically run Prisma migrations via `test/integration/setup.ts` before execution. They use `.env.test` and run with `--runInBand` to prevent race conditions.

### Code Quality
```bash
npm run lint                        # ESLint with auto-fix
npm run format                      # Prettier formatting
npm run build                       # Build for production
```

### Docker (Test Environment)
```bash
npm run docker:test:up              # Start test containers
npm run docker:test:down            # Stop test containers
npm run docker:test:logs            # View container logs
```

### Database Migrations
```bash
npm run prisma:migrate              # Create and apply migration (dev)
npm run prisma:migrate:reset        # Reset and re-migrate (dev)
npm run prisma:migrate:test         # Apply migrations (test DB)
```

## Architecture

### Layered Architecture

```
src/
├── api/                    # Presentation Layer
│   ├── controller/         # HTTP controllers
│   └── support/            # Response types, interceptors, filters
├── domain/                 # Domain Layer (business logic)
│   ├── users/
│   ├── auth/
│   ├── courses/
│   ├── sections/
│   └── lectures/
├── infrastructure/         # Infrastructure Layer
│   └── database/           # Prisma repositories
├── modules/                # NestJS modules (DI configuration)
└── main.ts
```

### Key Patterns

**1. Repository Pattern with Dependency Injection**
- Domain layer defines repository interfaces with Symbol tokens (e.g., `COURSE_REPOSITORY`)
- Infrastructure layer implements repositories using Prisma
- Services inject repositories via `@Inject(REPOSITORY_TOKEN)`

Example:
```typescript
// domain/courses/course.repository.ts
export const COURSE_REPOSITORY = Symbol('COURSE_REPOSITORY');
export interface ICourseRepository { ... }

// domain/courses/course.service.ts
@Injectable()
export class CourseService {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: ICourseRepository,
  ) {}
}

// modules/course.module.ts
providers: [
  {
    provide: COURSE_REPOSITORY,
    useClass: PrismaCourseRepository,
  },
  CourseService,
]
```

**2. Standardized API Response Format**

All API responses follow this format (defined in `src/api/support/response.ts`):

Success:
```typescript
{
  success: true,
  data: T
}
```

Error:
```typescript
{
  success: false,
  error: {
    code: string,      // e.g., "AUTH_001", "VALIDATION_001"
    message: string
  }
}
```

Pagination:
```typescript
{
  success: true,
  data: {
    items: T[],
    pagination: {
      totalCount: number,
      page: number,
      pageSize: number,
      totalPages: number
    }
  }
}
```

Use helper functions: `createSuccessResponse()`, `createPaginatedResponse()`, `createErrorResponse()`

**3. Database Models**

Key entities in `prisma/schema.prisma`:
- `User` - 사용자 (강사/학생)
- `Course` - 강의 코스
- `Section` - 코스 내 섹션
- `Lecture` - 개별 강의
- `CartItem` - 장바구니 (User ↔ Course many-to-many)

All models include soft delete (`deletedAt`) and timestamps (`createdAt`, `updatedAt`).

**4. Domain Entity Mapping**

Infrastructure layer maps Prisma models to domain entities:
- `prisma.user.ts` → User domain entity
- `prisma.course.ts` → Course domain entity
- Similar pattern for Section, Lecture

This keeps domain layer independent of ORM.

## Environment Files

- `.env.dev` - Development environment (used by `start:dev`, `prisma:migrate`)
- `.env.test` - Test environment (used by integration tests)
- `.env` - Production (not in repo)

Environment is auto-selected in `src/modules/app.module.ts` based on `NODE_ENV`.

## Testing Strategy

**Unit Tests:** `test/unit/`
- Test individual services/utilities in isolation
- Mock dependencies (repositories, etc.)
- Fast, no database required

**Integration Tests:** `test/integration/`
- Test full request/response cycle with real database
- Use test database (Docker container)
- Automatically migrate before running
- Run sequentially (`--runInBand`) to avoid conflicts

## Commit Message Convention

Use conventional commits with Korean descriptions:
- `feat:` - 새로운 기능
- `fix:` - 버그 수정
- `refactor:` - 리팩토링
- `test:` - 테스트 추가/수정
- `chore:` - 설정, 의존성 등
- `docs:` - 문서 변경

Example: `feat: CartItem 모델 추가 및 User, Course와의 관계 설정 - #11`

## Path Aliases

Configured in `tsconfig.json` and `jest` config:
- `@/` → `src/`
- `@test/` → `test/`

Example: `import { CourseService } from '@/domain/courses/course.service';`
