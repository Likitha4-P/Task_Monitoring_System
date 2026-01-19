-- -- =========================================
-- College Task Monitoring System
-- =========================================

CREATE DATABASE college_task_monitoring;
USE college_task_monitoring;

-- =========================================
-- DEPARTMENTS (MASTER TABLE)
-- =========================================
CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_code VARCHAR(20) UNIQUE NOT NULL,
  department_name VARCHAR(100) UNIQUE NOT NULL,
  is_active ENUM('Yes','No') DEFAULT 'Yes',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

-- =========================================
-- USERS
-- =========================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM(
    'Admin',
    'Department Head',
    'Professor Incharge',
    'Faculty/File Incharge',
    'View Only'
  ) NOT NULL,
  department_id INT,
  Contact VARCHAR(50),
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- =========================================
-- EVENTS
-- =========================================
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  department_id INT,
  event_date DATE NOT NULL,
  participants INT DEFAULT 0,
  status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =========================================
-- GENERAL TASKS
-- =========================================
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INT,
  assigned_by INT,
  department_id INT,
  deadline DATE,
  priority ENUM('High','Medium','Low') DEFAULT 'Medium',
  status ENUM('Pending','In Progress','Submitted','Verified','Closed') DEFAULT 'Pending',
  progress INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- =========================================
-- EVENT TASKS (TASKS UNDER EVENTS)
-- =========================================
CREATE TABLE event_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INT,
  assigned_by INT,
  deadline DATE,
  priority ENUM('High','Medium','Low') DEFAULT 'Medium',
  status ENUM('Pending','In Progress','Completed','Verified') DEFAULT 'Pending',
  progress INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =========================================
-- ADMIN AUDIT LOGS
-- =========================================
CREATE TABLE admin_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  target_table VARCHAR(50),
  target_id INT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- USER NOTIFICATIONS
-- =========================================
CREATE TABLE user_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  reference_type ENUM(
    'Task',
    'Event',
    'EventTask',
    'User',
    'Department',
    'System'
  ) DEFAULT 'System',
  reference_id INT,
  is_read ENUM('Yes','No') DEFAULT 'No',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);



CREATE TABLE uploaded_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type ENUM(
    'Report',
    'Image',
    'Document',
    'Spreadsheet',
    'Presentation',
    'Other'
  ) DEFAULT 'Other',
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE file_references (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_id INT NOT NULL,
  reference_type ENUM(
    'Task',
    'Event',
    'EventTask',
    'User',
    'System'
  ) NOT NULL,
  reference_id INT NOT NULL,
  description VARCHAR(255),
  FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE
);
