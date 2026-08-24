-- Enable pgcrypto extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Mentors Table
CREATE TABLE mentors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    experience_years INT NOT NULL,
    guidance_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Career Plans Table
CREATE TABLE career_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID UNIQUE NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    current_role_title VARCHAR(255) NOT NULL,
    target_role_title VARCHAR(255) NOT NULL,
    career_goal TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
    mentor_id UUID REFERENCES mentors(id) ON DELETE SET NULL,
    timeline VARCHAR(255) NOT NULL,
    expected_promotion_date DATE,
    meeting_schedule VARCHAR(255),
    guidance_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Career Roadmaps Table
CREATE TABLE career_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) UNIQUE NOT NULL,
    steps TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Job Postings Table
CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    experience_required INT NOT NULL,
    required_skills TEXT NOT NULL, -- Comma-separated list of skill names
    salary_band VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    eligibility TEXT,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Job Applications Table
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    match_percent INT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_employee_posting UNIQUE (employee_id, job_posting_id)
);

-- Indexing for lookup speed
CREATE INDEX idx_career_plan_employee ON career_plans(employee_id);
CREATE INDEX idx_job_app_employee ON job_applications(employee_id);
CREATE INDEX idx_job_posting_active ON job_postings(active);

-- Seed Roadmaps
INSERT INTO career_roadmaps (id, title, steps) VALUES
('cf000000-0000-0000-0000-000000000001', 'Engineering Path', 'Associate Developer,Senior Software Engineer,Tech Lead,Engineering Manager,Architect'),
('cf000000-0000-0000-0000-000000000002', 'HR Path', 'HR Specialist,Senior HR Specialist,HR Manager,HR Director'),
('cf000000-0000-0000-0000-000000000003', 'Product Path', 'Associate Developer,Product Owner,Senior Product Owner,Product Manager,Director of Product');

-- Seed Mentors
INSERT INTO mentors (id, employee_id, name, department, experience_years, guidance_notes) VALUES
('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Alice Smith', 'Engineering', 6, 'Senior Developer willing to guide developers on cloud and backend architecture.');

-- Seed Career Plan for Bob Jones (Employee id: 'e0000000-0000-0000-0000-000000000002')
INSERT INTO career_plans (id, employee_id, employee_name, current_role_title, target_role_title, career_goal, status, mentor_id, timeline, expected_promotion_date, meeting_schedule, guidance_notes) VALUES
('c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Bob Jones', 'Associate Developer', 'Senior Software Engineer', 'Transition to a senior role taking full ownership of features and frontend/backend codebases.', 'ACTIVE', 'f0000000-0000-0000-0000-000000000001', '12 months', '2027-08-01', 'Bi-weekly on Thursdays at 4 PM', 'Focus on completing advanced Java courses and Spring Boot microservices. Alice will guide on system design.');

-- Seed Job Postings
INSERT INTO job_postings (id, role_title, department, location, experience_required, required_skills, salary_band, description, eligibility, active) VALUES
('d0000000-0000-0000-0000-000000000001', 'Senior Software Engineer', 'Engineering', 'Remote', 5, 'Java,Spring Boot,Angular,SQL & Databases', '₹90,000 - ₹120,000', 'We are looking for a Senior Developer to join our core architecture team. You will build and scale high-performance REST microservices and design standalone client interfaces.', 'Must possess 5+ years experience and complete the Java Advanced course.', TRUE),
('d0000000-0000-0000-0000-000000000002', 'Tech Lead', 'Engineering', 'Boston Office', 8, 'Java,Spring Boot,Agile Methodologies', '₹130,000 - ₹160,000', 'Lead a team of 6 engineers. Responsible for sprint planning, technical architectures, and mentoring junior team members.', '8+ years of experience and validated AWS Solutions Architect certification.', TRUE);

-- Seed Job Application (Alice applying for Tech Lead)
INSERT INTO job_applications (id, job_posting_id, employee_id, employee_name, status, match_percent) VALUES
('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Alice Smith', 'PENDING', 90);
