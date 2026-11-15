<?php
declare(strict_types=1);
namespace OxxAlbums\V5;

use PDO;
use InvalidArgumentException;

/**
 * Atomic, fixed-window limiter for MariaDB/MySQL. Caller supplies a stable
 * pseudonymous HMAC key derived with a server-side secret; never raw IP/email.
 * No public endpoint integration until trusted proxy/IP policy is verified.
 */
final class RateLimiter
{
    public function __construct(private PDO $db) {}

    public function allow(string $key, int $now, int $windowSeconds = 3600, int $maxAttempts = 10): bool
    {
        if (preg_match('/^[a-f0-9]{64}$/D', $key) !== 1 || $now < 0
            || $windowSeconds < 1 || $maxAttempts < 1 || $maxAttempts > 65535) {
            throw new InvalidArgumentException('Invalid rate-limit parameters');
        }
        $start = intdiv($now, $windowSeconds) * $windowSeconds;
        // ON DUPLICATE KEY UPDATE is atomic under concurrent requests.
        // The conditional increment must use the OLD window_start value.
        $stmt = $this->db->prepare(
            'INSERT INTO oxx_rate_limit (bucket_key, window_start, attempts) VALUES (?, ?, 1) ' .
            'ON DUPLICATE KEY UPDATE attempts = IF(window_start = VALUES(window_start), ' .
            'LEAST(attempts + 1, 65535), 1), window_start = VALUES(window_start)'
        );
        $stmt->execute([$key, $start]);
        $read = $this->db->prepare('SELECT attempts FROM oxx_rate_limit WHERE bucket_key = ?');
        $read->execute([$key]);
        return (int)$read->fetchColumn() <= $maxAttempts;
    }
}
