-- V5.7: separate website intake queue; NOT a Studio/Engine order register.
-- Run only after explicit production approval, with a dedicated least-privilege DB user.
CREATE TABLE IF NOT EXISTS oxx_intake (
    intake_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    received_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    customer_name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    collection_name ENUM('Classic','Essential') NOT NULL,
    book_format VARCHAR(50) NOT NULL,
    photo_count SMALLINT UNSIGNED NOT NULL,
    comments TEXT NOT NULL,
    status ENUM('new','exported','cancelled') NOT NULL DEFAULT 'new',
    exported_at DATETIME(6) NULL,
    PRIMARY KEY (intake_id),
    INDEX idx_intake_status_received (status, received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
