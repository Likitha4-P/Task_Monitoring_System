
use  college_task_monitoring;

INSERT INTO departments (department_code, department_name) VALUES
('ADMIN','College Admin')
('CSE', 'Computer Science and Engineering'),
('ECE', 'Electronics and Communication Engineering'),
('EEE', 'Electrical and Electronics Engineering'),
('MECH', 'Mechanical Engineering'),
('CIVIL', 'Civil Engineering');

-- Seed minimal data (Admin with Generated Hashed password for first login)
INSERT INTO users (name, email, password_hash, role, department_id, status)
VALUES ('Admin', 'admin@example.com', '$2a$10$38F3HCwc/RzCJSHLkOYQOuv6xhIuvO3cUE57JErMcPqjsIUFjHUuW', 'Admin', null,'Active')
ON DUPLICATE KEY UPDATE email = email;

