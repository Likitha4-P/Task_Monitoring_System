use  college_task_monitoring;

INSERT INTO departments (department_code, department_name) VALUES
('ADMIN','College Admin'),
('CSE', 'Computer Science and Engineering'),
('ECE', 'Electronics and Communication Engineering'),
('EEE', 'Electrical and Electronics Engineering'),
('MECH', 'Mechanical Engineering'),
('CIVIL', 'Civil Engineering');

-- Seed minimal data (Admin with Generated Hashed password of(admin123) )
INSERT INTO users (name, email, password_hash, role, department_id, status)
VALUES ('Admin', 'admin@example.com', '$2a$10$thLbhfOFzXprL6WJG5BujOdvnS6zFOLul1q2o0zAZB1afTJtOJFRW', 'Admin', 1,'Active')
ON DUPLICATE KEY UPDATE email = email;


-- Insert sample users for each department
INSERT INTO users (name,email,password_hash,role,department_id,contact,status) VALUES

-- ================= CSE (2) =================
('Dr. Ramesh Kumar','ramesh.cse@college.edu','$2b$10$demoHash123','Department Head',2,'9876543201','Active'),
('Dr. S. Priya','priya.cse@college.edu','$2b$10$demoHash123','Professor Incharge',2,'9876543202','Active'),
('Anil Kumar','anil.cse@college.edu','$2b$10$demoHash123','Faculty/File Incharge',2,'9876543203','Active'),
('Lakshmi Devi','lakshmi.cse@college.edu','$2b$10$demoHash123','Faculty/File Incharge',2,'9876543204','Active'),
('Rahul Varma','rahul.cse@college.edu','$2b$10$demoHash123','Faculty/File Incharge',2,'9876543205','Active'),

-- ================= ECE (3) =================
('Dr. K. Srinivas','srinivas.ece@college.edu','$2b$10$demoHash123','Department Head',3,'9876543211','Active'),
('Dr. Kavitha Rao','kavitha.ece@college.edu','$2b$10$demoHash123','Professor Incharge',3,'9876543212','Active'),
('Pradeep Kumar','pradeep.ece@college.edu','$2b$10$demoHash123','Faculty/File Incharge',3,'9876543213','Active'),
('Sowmya Reddy','sowmya.ece@college.edu','$2b$10$demoHash123','Faculty/File Incharge',3,'9876543214','Active'),
('Arjun Naidu','arjun.ece@college.edu','$2b$10$demoHash123','Faculty/File Incharge',3,'9876543215','Active'),

-- ================= EEE (4) =================
('Dr. Venkatesh','venkatesh.eee@college.edu','$2b$10$demoHash123','Department Head',4,'9876543221','Active'),
('Dr. Meena Kumari','meena.eee@college.edu','$2b$10$demoHash123','Professor Incharge',4,'9876543222','Active'),
('Ravi Teja','raviteja.eee@college.edu','$2b$10$demoHash123','Faculty/File Incharge',4,'9876543223','Active'),
('Nikhil Reddy','nikhil.eee@college.edu','$2b$10$demoHash123','Faculty/File Incharge',4,'9876543224','Active'),
('Pavan Kumar','pavan.eee@college.edu','$2b$10$demoHash123','Faculty/File Incharge',4,'9876543225','Active'),

-- ================= MECH (5) =================
('Dr. Prabhakar','prabhakar.mech@college.edu','$2b$10$demoHash123','Department Head',5,'9876543231','Active'),
('Dr. Bhaskar','bhaskar.mech@college.edu','$2b$10$demoHash123','Professor Incharge',5,'9876543232','Active'),
('Manoj Kumar','manoj.mech@college.edu','$2b$10$demoHash123','Faculty/File Incharge',5,'9876543233','Active'),
('Ajay Kumar','ajay.mech@college.edu','$2b$10$demoHash123','Faculty/File Incharge',5,'9876543234','Active'),
('Karthik Reddy','karthik.mech@college.edu','$2b$10$demoHash123','Faculty/File Incharge',5,'9876543235','Active'),

-- ================= CIVIL (6) =================
('Dr. Suresh Babu','suresh.civil@college.edu','$2b$10$demoHash123','Department Head',6,'9876543241','Active'),
('Dr. Rekha Devi','rekha.civil@college.edu','$2b$10$demoHash123','Professor Incharge',6,'9876543242','Active'),
('Sandeep Kumar','sandeep.civil@college.edu','$2b$10$demoHash123','Faculty/File Incharge',6,'9876543243','Active'),
('Vamsi Krishna','vamsi.civil@college.edu','$2b$10$demoHash123','Faculty/File Incharge',6,'9876543244','Active'),
('Harish Kumar','harish.civil@college.edu','$2b$10$demoHash123','Faculty/File Incharge',6,'9876543245','Active'),

-- ================= AI/ML (7) =================
('Dr. Arvind Rao','arvind.aiml@college.edu','$2b$10$demoHash123','Department Head',7,'9876543251','Active'),
('Dr. Sneha Patel','sneha.aiml@college.edu','$2b$10$demoHash123','Professor Incharge',7,'9876543252','Active'),
('Deepak Reddy','deepak.aiml@college.edu','$2b$10$demoHash123','Faculty/File Incharge',7,'9876543253','Active'),
('Pooja Sharma','pooja.aiml@college.edu','$2b$10$demoHash123','Faculty/File Incharge',7,'9876543254','Active'),
('Rohit Gupta','rohit.aiml@college.edu','$2b$10$demoHash123','Faculty/File Incharge',7,'9876543255','Active');

-- change password to generated hashed password of (user123)
update users set password_hash='$2a$10$8.kamS0XEOb9KZ3d1nJhdeibVpoFpyzNF3MUJSelsekgO7A6eo9vK' where id>1;


select * from users;
select * from departments;