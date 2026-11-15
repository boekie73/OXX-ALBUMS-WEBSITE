<?php
declare(strict_types=1);

namespace OxxAlbums\V5;

/**
 * Fail-closed same-origin check for future browser intake.
 * This is only one layer; Origin is NOT authentication, CSRF or abuse protection.
 * The expected origin must come from trusted server configuration, never Host headers.
 */
final class OriginPolicy
{
    public static function allows(?string $origin, string $configuredOrigin): bool
    {
        if ($origin === null || $origin === '' || str_contains($origin, ',')) {
            return false;
        }
        $expected = self::parse($configuredOrigin);
        $actual = self::parse($origin);
        return $expected !== null && $actual !== null && $expected === $actual;
    }

    private static function parse(string $value): ?array
    {
        if ($value !== trim($value) || preg_match('/[\\x00-\\x20\\x7f]/', $value)) {
            return null;
        }
        $parts = parse_url($value);
        if (!is_array($parts) || !isset($parts['scheme'], $parts['host'])
            || strtolower($parts['scheme']) !== 'https'
            || isset($parts['user'], $parts['pass'])
            || isset($parts['path']) || isset($parts['query']) || isset($parts['fragment'])) {
            return null;
        }
        if (isset($parts['user']) || isset($parts['pass'])) {
            return null;
        }
        $host = strtolower($parts['host']);
        if ($host === '' || str_ends_with($host, '.') || !preg_match('/^[a-z0-9.-]+$/D', $host)) {
            return null;
        }
        $port = $parts['port'] ?? 443;
        if ($port !== 443) {
            return null;
        }
        return ['https', $host, 443];
    }
}
