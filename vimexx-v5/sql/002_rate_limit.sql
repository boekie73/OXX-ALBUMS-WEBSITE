-- V5.10: dedicated temporary rate-limit counters; no customer identity stored.
-- Apply only in a controlled database migration after approval.
CREATE TABLE IF NOT EXISTS oxx_rate_limit (
  bucket_key CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  window_start BIGINT UNSIGNED NOT NULL,
  attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_key),
  INDEX idx_rate_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
