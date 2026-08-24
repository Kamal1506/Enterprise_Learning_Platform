-- Rename learning_paths.title to learning_paths.name
ALTER TABLE learning_service.learning_paths RENAME COLUMN title TO name;

-- Add new columns to courses table
ALTER TABLE learning_service.courses ADD COLUMN type VARCHAR(100);
ALTER TABLE learning_service.courses ADD COLUMN instructor VARCHAR(255);
ALTER TABLE learning_service.courses ADD COLUMN rating DOUBLE PRECISION;

-- Add final_score to enrollments table
ALTER TABLE learning_service.enrollments ADD COLUMN final_score INTEGER;

-- Create learning_path_progress table
CREATE TABLE learning_service.learning_path_progress (
    employee_id UUID NOT NULL,
    path_id UUID NOT NULL,
    progress_percent INTEGER DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (employee_id, path_id)
);

-- Seed course details for pre-seeded courses
UPDATE learning_service.courses SET type = 'ONLINE', instructor = 'Dr. James Gosling', rating = 4.8 WHERE id = 'c0000000-0000-0000-0000-000000000001';
UPDATE learning_service.courses SET type = 'BOOTCAMP', instructor = 'Rod Johnson', rating = 4.9 WHERE id = 'c0000000-0000-0000-0000-000000000002';
UPDATE learning_service.courses SET type = 'ONLINE', instructor = 'Miško Hevery', rating = 4.7 WHERE id = 'c0000000-0000-0000-0000-000000000003';
UPDATE learning_service.courses SET type = 'WORKSHOP', instructor = 'Michael Stonebraker', rating = 4.6 WHERE id = 'c0000000-0000-0000-0000-000000000004';
UPDATE learning_service.courses SET type = 'WEBINAR', instructor = 'Dale Carnegie', rating = 4.5 WHERE id = 'c0000000-0000-0000-0000-000000000005';

-- Enforce NOT NULL on course type
ALTER TABLE learning_service.courses ALTER COLUMN type SET NOT NULL;
