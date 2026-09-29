# AGENTS.md — Enterprise Learning Platform with Skill and Career Guidance System

This file is the source of truth for any AI coding agent (Claude Code, Cursor, etc.)
working on this repository. Read this fully before writing code in any microservice.

## 1. What we're building

Enterprise Learning Platform with Skill and Career Guidance System is an internal Employee Learning, Certification & Career
Development platform, built as 4 independent Spring Boot microservices, each
with its own Angular module/screen, sharing one PostgreSQL database (separate
schema per service) and one JWT-based auth mechanism.

Build order (do NOT skip ahead):
1. **Skill Service** — employees, skills, competency, assessments, auth/login
2. **Learning Service** — courses, learning paths, enrollments, completions
3. **Certification Service** — certifications, expiry tracking, renewals
4. **Career Service** — career plans, promotions, internal jobs, analytics

Each service is fully working (API + DB + Angular screens + tests) before
moving to the next.

## 2. Finalized tech stack (do not substitute)

| Layer | Technology |
|---|---|
| Frontend | Angular 20, standalone components, TypeScript, Angular Material |
| Backend | Java 21 (LTS), Spring Boot 3.x |
| Database | PostgreSQL 16 |
| Auth | Custom JWT (no Keycloak) — see section 4 |
| Migrations | Flyway |
| Build | Maven (backend), Angular CLI (frontend) |
| Testing | JUnit 5 + Mockito (backend), Jasmine/Karma (frontend) |

Explicitly OUT of scope for now (original doc had these — skip unless asked):
Keycloak, Kafka, Redis, Elasticsearch, Docker/Kubernetes deployment. Design
code so these could be added later, but do not build them now.

## 3. Repository structure

```
skillsphere-nexus/
├── AGENTS.md
├── services/
│   ├── skill-service/        (Spring Boot, port 8081)
│   ├── learning-service/     (Spring Boot, port 8082)
│   ├── certification-service/(Spring Boot, port 8083)
│   └── career-service/       (Spring Boot, port 8084)
└── frontend/
    └── skillsphere-app/      (single Angular 20 app, one feature module per service)
```

Each Spring Boot service uses this internal package layout:
```
com.skillsphere.<service>/
├── controller/
├── service/
├── repository/
├── entity/
├── dto/
├── mapper/
├── exception/
├── security/
└── config/
```

## 4. Authentication design (JWT, no Keycloak)

- **Skill Service owns auth.** It exposes `POST /api/v1/auth/register` and
  `POST /api/v1/auth/login`, backed by an `AppUser` entity (email, password
  hash via BCrypt, role).
- On login, Skill Service issues a signed JWT (HS256) containing: `sub`
  (user id), `email`, `role`, `exp`.
- The signing secret is a shared value read from env var `JWT_SECRET` —
  identical across all 4 services so any service can validate a token
  without calling Skill Service.
- Every other service (Learning, Certification, Career) implements the
  **same** stateless `JwtAuthFilter` + `SecurityFilterChain` that:
  1. reads the `Authorization: Bearer <token>` header
  2. validates signature + expiry
  3. sets the Spring Security context with the role as a `GrantedAuthority`
- Roles: `ADMIN`, `HR_MANAGER`, `TRAINING_MANAGER`, `EMPLOYEE`.
- No sessions, no cookies — the Angular app stores the JWT and attaches it
  via an `HttpInterceptor` to every request.

## 5. API conventions

- Base path: `/api/v1/...`
- JSON in/out. Standard error body:
  ```json
  { "timestamp": "...", "status": 404, "error": "Not Found", "message": "...", "path": "..." }
  ```
- Use `@RestControllerAdvice` for global exception handling per service.
- Pagination on list endpoints: `?page=0&size=20`, response wrapped as
  `{ "content": [...], "totalElements": n, "totalPages": n }`.
- Cross-service calls (e.g. Career Service reading employee data from Skill
  Service) go through a typed `RestClient`/`WebClient` bean, forwarding the
  caller's JWT.

## 6. Database conventions

- One Flyway migration folder per service: `src/main/resources/db/migration`.
- Table names: `snake_case`, plural (`employees`, `skills`).
- Primary keys: UUID (`gen_random_uuid()` via `pgcrypto` or app-generated).
- Every table gets `created_at`, `updated_at` timestamps.
- Foreign keys across services are stored as plain UUID columns (no DB-level
  FK across service boundaries — services own their own schema/database).

## 7. Angular conventions

- Angular 20, standalone components only (no NgModules).
- Use Signals for local component state; Services + `HttpClient` for data.
- One feature folder per microservice under `frontend/skillsphere-app/src/app/features/`:
  `skills/`, `learning/`, `certifications/`, `career/`.
- Shared `AuthInterceptor` attaches JWT; shared `AuthService` handles
  login/logout/token storage (in-memory + `sessionStorage` is acceptable
  for this project, not production-grade token storage).
- Angular Material for tables, cards, dialogs. Match the dark dashboard look
  from the reference screens (dark sidebar, purple header, stat cards).

## 8. Coding rules for the agent

- Always generate: entity → repository → service → controller → DTOs →
  Flyway migration → unit tests, for every feature — don't stop at the
  entity.
- Write tests alongside code, not as an afterthought.
- Keep each microservice runnable and testable on its own (`mvn spring-boot:run`)
  before wiring cross-service calls.
- Do not introduce Keycloak, Kafka, or Redis unless explicitly asked.
- Ask before making schema-breaking changes to an already-built service.
- Prefer constructor injection, `record` DTOs, and Bean Validation
  (`@NotNull`, `@Email`, etc.) over manual checks.