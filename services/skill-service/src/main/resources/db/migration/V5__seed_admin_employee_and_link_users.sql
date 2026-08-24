-- Create an employee record for Admin
INSERT INTO employees (id, name, email, role_title, department, experience_years, rating)
VALUES ('e0000000-0000-0000-0000-000000000009', 'Admin User', 'admin@skillsphere.com', 'System Administrator', 'IT', 10, 5.0)
ON CONFLICT (email) DO NOTHING;

-- Link admin@skillsphere.com
UPDATE app_users
SET employee_id = 'e0000000-0000-0000-0000-000000000009'
WHERE email = 'admin@skillsphere.com';

-- Link hr@skillsphere.com to Charlie Brown
UPDATE app_users
SET employee_id = 'e0000000-0000-0000-0000-000000000003'
WHERE email = 'hr@skillsphere.com';
