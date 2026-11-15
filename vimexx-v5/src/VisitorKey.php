<?php
declare(strict_types=1);

namespace OxxAlbums\V5;

use InvalidArgumentException;

/**
 * Pseudonymous rate-limit key. Accepts only a server-verified remote address,
 * not untrusted X-Forwarded-For or other user-controlled headers.
 */
final class VisitorKey
{
    public static function fromRemoteAddress(?string $remoteAddress, string $secret): string
    {
        if ($remoteAddress === null || filter_var($remoteAddress, FILTER_VALIDATE_IP) === false) {
            throw new InvalidArgumentException('Invalid remote address');
        }
        if (strlen($secret) < 32) {
            throw new InvalidArgumentException('Rate-limit secret must contain at least 32 bytes');
        }
        $packed = inet_pton($remoteAddress);
        if ($packed === false) {
            throw new InvalidArgumentException('Cannot normalize remote address');
        }
        return hash_hmac('sha256', "oxx-intake-rate-v1\0" . $packed, $secret);
    }
}
