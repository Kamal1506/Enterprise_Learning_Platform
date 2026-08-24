-- Alter employee_certifications table to add columns for persisting certification renewal details
ALTER TABLE employee_certifications
ADD COLUMN renewal_requested_date DATE,
ADD COLUMN renewal_requested_by VARCHAR(255),
ADD COLUMN renewal_completed_date DATE,
ADD COLUMN new_expiry_date DATE,
ADD COLUMN renewal_notes TEXT;
