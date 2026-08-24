-- Alter courses table to add source url
ALTER TABLE learning_service.courses ADD COLUMN learning_source_url TEXT;

-- Create quiz questions table
CREATE TABLE learning_service.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES learning_service.courses(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option CHAR(1) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed some mock questions for Java course c0000000-0000-0000-0000-000000000001
INSERT INTO learning_service.quiz_questions (id, course_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES
('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Which component is responsible for running Java bytecode?', 'JVM', 'JDK', 'JRE', 'JIT', 'A'),
('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'What is the size of double variable in Java?', '8 bits', '16 bits', '32 bits', '64 bits', 'D'),
('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'What is the default value of Boolean variable in Java?', 'true', 'false', 'null', '0', 'B'),
('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Which of the following is NOT a reserved keyword in Java?', 'const', 'goto', 'unsigned', 'volatile', 'C'),
('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Which class is the root class of all classes in Java?', 'Class', 'Object', 'System', 'String', 'B'),
('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'Which package is imported by default in all Java programs?', 'java.io', 'java.util', 'java.lang', 'java.net', 'C'),
('b0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'Which of these is a way to create a thread in Java?', 'Extend Thread class', 'Implement Runnable interface', 'Both A and B', 'None of the above', 'C'),
('b0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'What keyword is used to refer to current class instance variables in Java?', 'super', 'this', 'current', 'self', 'B'),
('b0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 'Which exception is thrown when an array is accessed with an invalid index?', 'IndexOutOfBoundsException', 'ArrayIndexOutOfBoundsException', 'NullPointerException', 'IllegalArgumentException', 'B'),
('b0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001', 'Which collection stores elements in key-value pairs in Java?', 'ArrayList', 'HashSet', 'HashMap', 'LinkedList', 'C');
