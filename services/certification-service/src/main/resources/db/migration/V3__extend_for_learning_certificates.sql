-- Alter employee_certifications table to add columns for supporting Learning Certificates and approval workflow
ALTER TABLE employee_certifications
ADD COLUMN certificate_type VARCHAR(50) DEFAULT 'PROFESSIONAL' NOT NULL,
ADD COLUMN course_id UUID,
ADD COLUMN course_completion_id UUID,
ADD COLUMN request_status VARCHAR(50),
ADD COLUMN approved_by VARCHAR(255),
ADD COLUMN approved_date DATE,
ADD COLUMN certificate_number VARCHAR(255),
ADD COLUMN pdf_location VARCHAR(500),
ADD COLUMN assessment_score INT,
ADD COLUMN completion_percentage INT,
ADD COLUMN instructor VARCHAR(255),
ADD COLUMN completion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN request_date DATE;
