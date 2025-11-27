-- =============================================
-- NT - TAXOFFICE Appointment Booking System
-- MySQL Database Schema
-- =============================================

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_admin_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    service_type VARCHAR(255) NOT NULL,
    notes TEXT,
    status ENUM('pending', 'confirmed', 'declined', 'cancelled', 'completed') DEFAULT 'pending',
    decline_reason TEXT,
    cancellation_token CHAR(36) UNIQUE,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_appointment_date_time (appointment_date, appointment_time),
    INDEX idx_appointment_status (status),
    INDEX idx_appointment_email (client_email),
    INDEX idx_cancellation_token (cancellation_token),

    -- Unique constraint: one appointment per slot (excluding cancelled/declined)
    UNIQUE KEY unique_slot (appointment_date, appointment_time, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Availability Settings Table
CREATE TABLE IF NOT EXISTS availability_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week TINYINT NOT NULL UNIQUE CHECK(day_of_week >= 0 AND day_of_week <= 6),
    is_working_day BOOLEAN DEFAULT FALSE,
    start_time TIME,
    end_time TIME,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_working_days (is_working_day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blocked Dates Table
CREATE TABLE IF NOT EXISTS blocked_dates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blocked_date DATE NOT NULL UNIQUE,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    INDEX idx_blocked_date (blocked_date, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointment History Table
CREATE TABLE IF NOT EXISTS appointment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by ENUM('client', 'admin', 'system') NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,

    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,

    INDEX idx_history_appointment (appointment_id),
    INDEX idx_history_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email Queue Table
CREATE TABLE IF NOT EXISTS email_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_type VARCHAR(100) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    data JSON NOT NULL,
    subject VARCHAR(500),
    html_body TEXT,
    text_body TEXT,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    attempts INT DEFAULT 0,
    error_message TEXT,
    next_attempt_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,

    INDEX idx_email_queue_status (status),
    INDEX idx_email_queue_created (created_at),
    INDEX idx_email_queue_next_attempt (next_attempt_at),
    INDEX idx_email_queue_type (email_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Availability (Monday-Friday 09:00-17:00)
INSERT INTO availability_settings (day_of_week, is_working_day, start_time, end_time) VALUES
(0, FALSE, NULL, NULL),           -- Sunday: Closed
(1, TRUE, '09:00:00', '17:00:00'), -- Monday: Open
(2, TRUE, '09:00:00', '17:00:00'), -- Tuesday: Open
(3, TRUE, '09:00:00', '17:00:00'), -- Wednesday: Open
(4, TRUE, '09:00:00', '17:00:00'), -- Thursday: Open
(5, TRUE, '09:00:00', '17:00:00'), -- Friday: Open
(6, FALSE, NULL, NULL)             -- Saturday: Closed
ON DUPLICATE KEY UPDATE day_of_week=day_of_week;

-- =============================================
-- Service Types Reference (for documentation)
-- =============================================
-- Φορολογική Δήλωση (Tax return consultation)
-- Λογιστική Υποστήριξη (Accounting support)
-- Έναρξη Επιχείρησης (Business startup consultation)
-- Μισθοδοσία (Payroll services)
-- Γενική Συμβουλευτική (General consultation)
