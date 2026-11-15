<?php
declare(strict_types=1);
namespace OxxAlbums\V5;

use PDO;
use RuntimeException;

require_once __DIR__ . '/OriginPolicy.php';
require_once __DIR__ . '/VisitorKey.php';
require_once __DIR__ . '/RateLimiter.php';

/**
 * Internal preflight only. Does NOT persist intake or activate the HTTP endpoint.
 * Trusted REMOTE_ADDR must be established by the hosting/proxy configuration.
 */
final class IntakeGate
{
    public function __construct(private PDO $db) {}

    /** @return array{allowed:bool,reason:string} */
    public function check(?string $origin, ?string $remoteAddress, string $configuredOrigin, string $hmacSecret, int $now): array
    {
        if (!OriginPolicy::allows($origin, $configuredOrigin)) {
            return ['allowed' => false, 'reason' => 'origin'];
        }
        try {
            $key = VisitorKey::fromRemoteAddress($remoteAddress, $hmacSecret);
        } catch (\InvalidArgumentException $e) {
            return ['allowed' => false, 'reason' => 'visitor'];
        }
        try {
            $allowed = (new RateLimiter($this->db))->allow($key, $now, 3600, 10);
        } catch (\Throwable $e) {
            // Database errors must never result in an allowed request.
            return ['allowed' => false, 'reason' => 'unavailable'];
        }
        return ['allowed' => $allowed, 'reason' => $allowed ? 'ok' : 'limit'];
    }
}
