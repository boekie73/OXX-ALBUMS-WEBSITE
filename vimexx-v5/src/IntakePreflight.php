<?php
declare(strict_types=1);

namespace OxxAlbums\V5;

require_once __DIR__ . '/V48IntakeMapper.php';
require_once __DIR__ . '/RequestValidator.php';
require_once __DIR__ . '/IntakeGate.php';

/**
 * Internal intake pipeline, not an HTTP handler.
 * Does not save requests, issue order IDs, send email, or change the 503 endpoint.
 */
final class IntakePreflight
{
    public function __construct(private IntakeGate $gate) {}

    /** @return array{allowed:bool,reason:string,data:array<string,mixed>} */
    public function check(mixed $payload, ?string $origin, ?string $remoteAddress,
        string $configuredOrigin, string $hmacSecret, int $now): array
    {
        // Apply security gate before parsing customer data; rejected requests
        // cannot bypass the limiter by deliberately sending invalid payloads.
        $security = $this->gate->check($origin, $remoteAddress, $configuredOrigin, $hmacSecret, $now);
        if (!$security['allowed']) {
            return ['allowed' => false, 'reason' => $security['reason'], 'data' => []];
        }
        $validation = V48IntakeMapper::map($payload);
        if (!$validation['ok']) {
            return ['allowed' => false, 'reason' => 'validation', 'data' => []];
        }
        return ['allowed' => true, 'reason' => 'ok', 'data' => $validation['data']];
    }
}
