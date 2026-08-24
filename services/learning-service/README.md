# Learning Service

The **Learning Service** is the second microservice in the Enterprise Learning Platform with Skill and Career Guidance System. It manages courses, learning paths, enrollments, and completion tracking for employees.

## Technology Stack

- **Java**: 21 (LTS)
- **Spring Boot**: 3.x
- **Database**: PostgreSQL 16 (shared instance, isolated schema `learning_service`)
- **Database Migrations**: Flyway

## Key Environment Variables

Ensure the following environment variables are set before starting the service:

| Variable | Description | Example / Default |
|---|---|---|
| `SPRING_DATASOURCE_URL` | JDBC URL for PostgreSQL database | `jdbc:postgresql://localhost:5432/skillsphere_nexus` |
| `SPRING_DATASOURCE_USERNAME` | Database connection username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Database connection password | `kamal1717` |
| `JWT_SECRET` | Shared HmacSHA256 JWT signature verification secret key | *(Must match Skill Service secret)* |
| `SKILL_SERVICE_URL` | Target base URL of the Skill Service for RestClient lookup | `http://localhost:8081/api/v1` |

## Ports

- The service runs on port **`8082`**.

## Database Migrations

Database tables and schema updates are versioned using Flyway migrations located under:
`src/main/resources/db/migration/`

## RestClient Integration

This service does not persist or duplicate employee details. When validation of employee existence or authentication data is required:
1. It executes an outbound HTTP `GET /api/v1/employees/{id}` request to the **Skill Service**.
2. It forwards the current caller's incoming `Authorization` Bearer token context automatically using a RestClient request interceptor.
3. If the Skill Service is unreachable or down, a `503 Service Unavailable` exception is automatically mapped and returned to the client rather than throwing raw sockets.
