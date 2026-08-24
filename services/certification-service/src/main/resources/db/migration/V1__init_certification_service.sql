-- Create Certifications Table
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    provider VARCHAR(255) NOT NULL,
    validity_months INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    associated_skill_id UUID,
    associated_course_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Employee Certifications Table
CREATE TABLE employee_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    certification_id UUID NOT NULL,
    credential_id VARCHAR(255),
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    document_url VARCHAR(500),
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    renewal_status VARCHAR(50) DEFAULT 'NOT_REQUIRED' NOT NULL,
    renewal_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Certification Audits Table
CREATE TABLE certification_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(100) NOT NULL,
    certification_id UUID,
    employee_certification_id UUID,
    employee_id UUID NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    reason TEXT,
    source VARCHAR(100)
);

-- Create Indexes
CREATE INDEX idx_emp_cert_employee_id ON employee_certifications(employee_id);
CREATE INDEX idx_emp_cert_certification_id ON employee_certifications(certification_id);
CREATE INDEX idx_emp_cert_expiry_date ON employee_certifications(expiry_date);
CREATE INDEX idx_emp_cert_status ON employee_certifications(status);

-- Seed Certifications Definition
INSERT INTO certifications (id, name, provider, validity_months, category, associated_skill_id, associated_course_id) VALUES
('f0000000-0000-0000-0000-000000000001', 'AWS Certified Solutions Architect - Associate', 'Amazon Web Services', 36, 'TECHNICAL', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002'),
('f0000000-0000-0000-0000-000000000002', 'Oracle Certified Professional: Java SE 17 Developer', 'Oracle', 36, 'TECHNICAL', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000003', 'Professional Scrum Product Owner I', 'Scrum.org', 120, 'DOMAIN', 'b0000000-0000-0000-0000-000000000006', NULL);

-- Seed Employee Certifications (Alice - AWS SAA, Active, valid until 15-Mar-2028)
INSERT INTO employee_certifications (id, employee_id, certification_id, credential_id, issue_date, expiry_date, status, document_url, verified, verified_at, renewal_status, notes) VALUES
('e1000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'AWS-SAA-9988', '2025-03-15', '2028-03-15', 'ACTIVE', 'https://aws.securesites.com/credentials/aws-saa-9988', TRUE, CURRENT_TIMESTAMP, 'NOT_REQUIRED', 'Scored 92% on official exam.');

-- Seed Employee Certifications (Bob - Java OCP, Expired on 2026-01-15)
INSERT INTO employee_certifications (id, employee_id, certification_id, credential_id, issue_date, expiry_date, status, document_url, verified, verified_at, renewal_status, notes) VALUES
('e1000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'ORCL-OCP-17-4432', '2023-01-15', '2026-01-15', 'EXPIRED', 'https://oracle.com/certs/verify/ORCL-OCP-17-4432', TRUE, CURRENT_TIMESTAMP, 'DUE_SOON', 'Needs to be renewed ASAP.');

-- Seed Employee Certifications (Alice - Scrum Product Owner I, Expiring Soon, e.g. 2026-08-15)
INSERT INTO employee_certifications (id, employee_id, certification_id, credential_id, issue_date, expiry_date, status, document_url, verified, verified_at, renewal_status, notes) VALUES
('e1000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', 'SCRUM-PSPO-8822', '2016-08-15', '2026-08-15', 'EXPIRING_SOON', 'https://scrum.org/certs/verify/SCRUM-PSPO-8822', TRUE, CURRENT_TIMESTAMP, 'RENEWAL_REQUESTED', 'Expiring in under 30 days.');
