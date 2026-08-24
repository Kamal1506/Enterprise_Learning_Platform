CREATE TABLE learning_service.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES learning_service.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    sequence_order INT NOT NULL,
    duration_hours INT NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE learning_service.module_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    module_id UUID NOT NULL REFERENCES learning_service.course_modules(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES learning_service.courses(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_employee_module UNIQUE (employee_id, module_id)
);

CREATE TABLE learning_service.course_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id VARCHAR(255) UNIQUE NOT NULL,
    employee_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES learning_service.courses(id) ON DELETE CASCADE,
    course_name_snapshot VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    completion_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed Course Modules for course 1: Java Advanced Programming
INSERT INTO learning_service.course_modules (id, course_id, title, description, content, sequence_order, duration_hours) VALUES
('a0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'Concurrency and Thread Safety', 'Deep dive into concurrent threads, synchronization mechanisms, and volatile fields.', 'Concepts: Thread Safety, Race Conditions, Synchronized Keyword, Volatile variables, Locks, ReentrantLock, and Executor Framework.', 1, 10),
('a0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', 'Java Memory Management & JVM Internals', 'Understanding Garbage Collection algorithms and heap memory management.', 'Concepts: Heap vs Stack memory, JVM architecture, GC Tuning, G1 GC, ZGC, Profiling tools, memory leaks prevention, and JFR.', 2, 10),
('a0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000001', 'Streams, Lambdas & Functional Interfaces', 'Exploiting functional programming paradigms introduced in modern Java versions.', 'Concepts: Stream pipeline, Collector interface, Custom Functional Interfaces, Optionals, Lazy Evaluation, and Parallel Streams tuning.', 3, 10);

-- Seed Course Modules for course 2: Spring Boot Microservices
INSERT INTO learning_service.course_modules (id, course_id, title, description, content, sequence_order, duration_hours) VALUES
('a0000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000002', 'Introduction to Microservices Architecture', 'Theoretical foundations of microservice boundaries and API specifications.', 'Concepts: Monolith to Microservice transition, Service Boundaries, Single Responsibility Principle, and RESTful communication.', 1, 10),
('a0000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000002', 'Spring Boot Service Creation & Database Connectivity', 'Developing standalone REST endpoints and integrating databases with Spring Data JPA.', 'Concepts: Spring Boot Auto-configurations, Controllers, Services, Hibernate ORM, and database schema migrations with Flyway.', 2, 10),
('a0000000-0000-0000-0000-000000000023', 'c0000000-0000-0000-0000-000000000002', 'Service Communication & Registry', 'Enabling microservices to locate and communicate with each other dynamically.', 'Concepts: Service Registry (Eureka/Consul), HTTP Client (RestClient/WebClient), Feign clients, and client-side load balancing.', 3, 10),
('a0000000-0000-0000-0000-000000000024', 'c0000000-0000-0000-0000-000000000002', 'Production Architecture & Resilience', 'Securing microservices with a Gateway and implementing circuit breakers.', 'Concepts: API Gateway routing, OAuth2/JWT security, distributed tracing, resilience patterns (Circuit Breaker, Rate Limiter) using Resilience4j.', 4, 10);

-- Seed Course Modules for course 3: Angular Standalone Architecture
INSERT INTO learning_service.course_modules (id, course_id, title, description, content, sequence_order, duration_hours) VALUES
('a0000000-0000-0000-0000-000000000031', 'c0000000-0000-0000-0000-000000000003', 'Standalone Components & Routing', 'Structuring modern Angular applications without traditional NgModules.', 'Concepts: standalone component decorator, imports property, lazy loading, nested routes, and route parameters binding.', 1, 8),
('a0000000-0000-0000-0000-000000000032', 'c0000000-0000-0000-0000-000000000003', 'Signals for State Management', 'Mastering reactive state tracking using Angular Signals.', 'Concepts: signal, computed, effect, input/output signals, read-only signals, and migrating from RxJS behaviors.', 2, 9),
('a0000000-0000-0000-0000-000000000033', 'c0000000-0000-0000-0000-000000000003', 'Interceptors, Guards & Material Design', 'Intercepting REST calls, securing client-side routes, and layout design.', 'Concepts: functional interceptors, auth guards, Material tables/cards, custom styles, and dashboard dark mode UI integrations.', 3, 8);

-- Seed Course Modules for course 4: Database Optimization & SQL
INSERT INTO learning_service.course_modules (id, course_id, title, description, content, sequence_order, duration_hours) VALUES
('a0000000-0000-0000-0000-000000000041', 'c0000000-0000-0000-0000-000000000004', 'Indexing Strategies and Explain Plans', 'Evaluating database queries execution plans and indexes usage.', 'Concepts: EXPLAIN ANALYZE, B-Tree vs Hash indexing, composite indexes, query optimizer behavior, and database partitioning.', 1, 10),
('a0000000-0000-0000-0000-000000000042', 'c0000000-0000-0000-0000-000000000004', 'Transaction Isolation Levels & Concurrency', 'Managing data integrity under concurrent query execution environments.', 'Concepts: ACID properties, Read Committed, Repeatable Read, Serializable, MVCC, write locks, and deadlock troubleshooting.', 2, 10);

-- Seed Course Modules for course 5: Effective Presentation Skills
INSERT INTO learning_service.course_modules (id, course_id, title, description, content, sequence_order, duration_hours) VALUES
('a0000000-0000-0000-0000-000000000051', 'c0000000-0000-0000-0000-000000000005', 'Content Curation and Storytelling', 'Structuring technical ideas into a clean narrative format.', 'Concepts: Audience mapping, core message definition, slides outline, visual aesthetics, and storyboard development.', 1, 5),
('a0000000-0000-0000-0000-000000000052', 'c0000000-0000-0000-0000-000000000005', 'Body Language and Public Speaking', 'Controlling body posture, voice modulation, and handling stage fright.', 'Concepts: Eye contact, hand gestures, voice projection, pacing, pauses, and handling unexpected QA panel challenges.', 2, 5);
