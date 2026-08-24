-- Enable pgcrypto extension for UUID generation if needed, but we can generate them in app or database
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create App Users Table
CREATE TABLE app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    employee_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Employees Table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    experience_years INT NOT NULL,
    rating DECIMAL(3,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Skills Table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Employee Skills Junction Table
CREATE TABLE employee_skills (
    employee_id UUID NOT NULL,
    skill_id UUID NOT NULL,
    proficiency INT NOT NULL,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (employee_id, skill_id)
);

-- Create Assessments Table
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    skill_or_topic VARCHAR(255) NOT NULL,
    score INT NOT NULL,
    passed BOOLEAN DEFAULT FALSE NOT NULL,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Competency Frameworks Table
CREATE TABLE competency_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(255) NOT NULL,
    skill_id UUID NOT NULL,
    required_level INT NOT NULL
);

-- SEED DATA
-- Password is 'password' BCrypt hashed
-- $2a$10$8.ZAGc3Z7zJ5.y12DecUS.j35wdZhjsy1r8d8x6l.yO5458P7Z8yS
INSERT INTO app_users (id, email, password_hash, role, employee_id) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@skillsphere.com', '$2a$10$8.ZAGc3Z7zJ5.y12DecUS.j35wdZhjsy1r8d8x6l.yO5458P7Z8yS', 'ADMIN', NULL),
('a0000000-0000-0000-0000-000000000002', 'hr@skillsphere.com', '$2a$10$8.ZAGc3Z7zJ5.y12DecUS.j35wdZhjsy1r8d8x6l.yO5458P7Z8yS', 'HR_MANAGER', NULL);

-- Seed Employees
INSERT INTO employees (id, name, email, role_title, department, experience_years, rating) VALUES
('e0000000-0000-0000-0000-000000000001', 'Alice Smith', 'alice@skillsphere.com', 'Senior Software Engineer', 'Engineering', 6, 4.8),
('e0000000-0000-0000-0000-000000000002', 'Bob Jones', 'bob@skillsphere.com', 'Associate Developer', 'Engineering', 2, 4.2),
('e0000000-0000-0000-0000-000000000003', 'Charlie Brown', 'charlie@skillsphere.com', 'HR Specialist', 'HR', 4, 4.5);

-- Associate Employee Users
INSERT INTO app_users (id, email, password_hash, role, employee_id) VALUES
('a0000000-0000-0000-0000-000000000003', 'alice@skillsphere.com', '$2a$10$8.ZAGc3Z7zJ5.y12DecUS.j35wdZhjsy1r8d8x6l.yO5458P7Z8yS', 'EMPLOYEE', 'e0000000-0000-0000-0000-000000000001'),
('a0000000-0000-0000-0000-000000000004', 'bob@skillsphere.com', '$2a$10$8.ZAGc3Z7zJ5.y12DecUS.j35wdZhjsy1r8d8x6l.yO5458P7Z8yS', 'EMPLOYEE', 'e0000000-0000-0000-0000-000000000002');

-- Seed Skills
INSERT INTO skills (id, name, category) VALUES
('b0000000-0000-0000-0000-000000000001', 'Java', 'TECHNICAL'),
('b0000000-0000-0000-0000-000000000002', 'Spring Boot', 'TECHNICAL'),
('b0000000-0000-0000-0000-000000000003', 'Angular', 'TECHNICAL'),
('b0000000-0000-0000-0000-000000000004', 'SQL & Databases', 'TECHNICAL'),
('b0000000-0000-0000-0000-000000000005', 'Public Speaking', 'SOFT'),
('b0000000-0000-0000-0000-000000000006', 'Agile Methodologies', 'DOMAIN');

-- Mapped Skills for Alice
INSERT INTO employee_skills (employee_id, skill_id, proficiency, verified) VALUES
('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 9, true),
('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 8, true),
('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 7, false);

-- Mapped Skills for Bob
INSERT INTO employee_skills (employee_id, skill_id, proficiency, verified) VALUES
('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 5, true),
('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 6, false);

-- Competency Framework (e.g. for role_name 'Tech Lead')
INSERT INTO competency_frameworks (id, role_name, skill_id, required_level) VALUES
('cf000000-0000-0000-0000-000000000001', 'Tech Lead', 'b0000000-0000-0000-0000-000000000001', 8),
('cf000000-0000-0000-0000-000000000002', 'Tech Lead', 'b0000000-0000-0000-0000-000000000002', 8),
('cf000000-0000-0000-0000-000000000003', 'Tech Lead', 'b0000000-0000-0000-0000-000000000003', 5);

-- Seed Assessments
INSERT INTO assessments (id, employee_id, skill_or_topic, score, passed) VALUES
('a0000000-0000-0000-0000-000000001001', 'e0000000-0000-0000-0000-000000000001', 'Java Fundamentals', 95, true),
('a0000000-0000-0000-0000-000000001002', 'e0000000-0000-0000-0000-000000000002', 'Java Fundamentals', 72, true);
