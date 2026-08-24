-- Create Courses Table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    duration_hours INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Learning Paths Table
CREATE TABLE learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Learning Path Courses Junction Table
CREATE TABLE learning_path_courses (
    learning_path_id UUID NOT NULL,
    course_id UUID NOT NULL,
    sequence_order INT NOT NULL,
    PRIMARY KEY (learning_path_id, course_id)
);

-- Create Enrollments Table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    course_id UUID,
    learning_path_id UUID,
    status VARCHAR(50) NOT NULL,
    progress_percent INT DEFAULT 0 NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed Courses
INSERT INTO courses (id, title, description, category, duration_hours) VALUES
('c0000000-0000-0000-0000-000000000001', 'Java Advanced Programming', 'Deep dive into concurrent programming, modern features of Java, stream APIs, memory management, and performance tuning.', 'TECHNICAL', 30),
('c0000000-0000-0000-0000-000000000002', 'Spring Boot Microservices', 'Learn how to build, run, and scale enterprise microservices with Spring Boot, Spring Cloud, security, and Hibernate.', 'TECHNICAL', 40),
('c0000000-0000-0000-0000-000000000003', 'Angular Standalone Architecture', 'Master Angular 20 Standalone Components, Signal state management, Custom routing, HTTP Interceptors, and Material Design.', 'TECHNICAL', 25),
('c0000000-0000-0000-0000-000000000004', 'Database Optimization & SQL', 'Tuning queries, understanding execution plans, managing schemas, indexing strategy, and transaction isolation levels in PostgreSQL.', 'TECHNICAL', 20),
('c0000000-0000-0000-0000-000000000005', 'Effective Presentation Skills', 'Hone your public speaking skills, learn how to design engaging presentation decks, and manage audience questions with confidence.', 'SOFT', 10);

-- Seed Learning Paths
INSERT INTO learning_paths (id, title, description) VALUES
('d0000000-0000-0000-0000-000000000001', 'Full-stack Developer Path', 'A structured path designed to transform developers into expert full-stack professionals, covering Java, Spring Boot, and Angular development.');

-- Mapped Courses to Path
INSERT INTO learning_path_courses (learning_path_id, course_id, sequence_order) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 1),
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 2),
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 3);
