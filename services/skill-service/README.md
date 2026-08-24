# Enterprise Learning Platform with Skill and Career Guidance System — Skill Service

This is the **Skill Service** microservice. It manages employee details, skills, competencies, assessments, and authentication for the Enterprise Learning Platform with Skill and Career Guidance System.

## Technology Stack
- Java 17
- Spring Boot 3.3.4
- Spring Security (JWT)
- PostgreSQL
- Flyway Migrations
- Maven

## Prerequisites
1. **JDK 17** installed and configured in `JAVA_HOME`.
2. **PostgreSQL** running locally or accessible.
3. Database `skillsphere_nexus` created.
   ```sql
   CREATE DATABASE skillsphere_nexus;
   ```

## Configuration & Environment Variables
The application reads configuration from `src/main/resources/application.properties`. You can override properties using the following environment variables:

| Environment Variable | Description | Default Value |
|---|---|---|
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens (HS256). Must be at least 256 bits (32 bytes). | `9a6747f5e5b74c2e8b2b7b5c6e8f0a2d3c4b5a6d7e8f901234567890abcdef12` |
| `SPRING_DATASOURCE_URL` | JDBC Connection String | `jdbc:postgresql://localhost:5432/skillsphere_nexus` |
| `SPRING_DATASOURCE_USERNAME` | Database Username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Database Password | `kamal1717` |

## Build and Run

To run the application locally:
```bash
# Set environment variables (optional - default values will be used if not specified)
$env:JWT_SECRET="9a6747f5e5b74c2e8b2b7b5c6e8f0a2d3c4b5a6d7e8f901234567890abcdef12"

# Clean and package the application
mvn clean package

# Run the Spring Boot application
mvn spring-boot:run
```

The application will start on port `8081` and automatically execute Flyway migrations on the `skill_service` schema inside `skillsphere_nexus` database.

## Running Tests
Run backend unit tests:
```bash
mvn test
```
