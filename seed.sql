-- Seed minimal data (Admin with plaintext password for first login)
INSERT INTO users (name, email, password, role, department, status)
VALUES ('Admin', 'admin@example.com', 'Admin@123', 'Admin', 'Administration', 'Active')
ON DUPLICATE KEY UPDATE email = email;
