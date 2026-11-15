<?php
declare(strict_types=1);

namespace OxxAlbums\V5;

require_once __DIR__ . '/IntakePreflight.php';
require_once __DIR__ . '/IntakeRepository.php';

/**
 * Internal end-to-end intake processor, NOT exposed by the public endpoint.
 * Caller must provide a trusted configured origin, secret and server REMOTE_ADDR.
 * Does not create I3 orders, accept files or send emails.
 */
final class IntakeProcessor
{
    public function __construct(
        private IntakePreflight $preflight,
        private IntakeRepository $repository
    ) {}

    /** @return array{accepted:bool,reason:string,intake_id:?string} */
    public function process(mixed $payload, ?string $origin, ?string $remoteAddress,
        string $configuredOrigin, string $hmacSecret, int $now): array
    {
        $result = $this->preflight->check(
            $payload, $origin, $remoteAddress, $configuredOrigin, $hmacSecret, $now
        );
        if (!$result['allowed']) {
            return ['accepted' => false, 'reason' => $result['reason'], 'intake_id' => null];
        }
        try {
            $id = $this->repository->save($result['data']);
        } catch (\Throwable $error) {
            // Never expose database details or claim acceptance on failure.
            return ['accepted' => false, 'reason' => 'unavailable', 'intake_id' => null];
        }
        return ['accepted' => true, 'reason' => 'ok', 'intake_id' => $id];
    }
}
