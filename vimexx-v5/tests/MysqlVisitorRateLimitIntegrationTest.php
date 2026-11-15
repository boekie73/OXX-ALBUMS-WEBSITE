<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/src/VisitorKey.php';
require_once dirname(__DIR__) . '/src/RateLimiter.php';

use OxxAlbums\V5\VisitorKey;
use OxxAlbums\V5\RateLimiter;

$dsn = getenv('OXX_TEST_MYSQL_DSN');
$user = getenv('OXX_TEST_MYSQL_USER');
$password = getenv('OXX_TEST_MYSQL_PASSWORD');
if (!$dsn || !$user || $password === false || !str_starts_with($dsn, 'mysql:')) {
    throw new RuntimeException('Isolated MariaDB test environment required');
}
$db = new PDO($dsn, $user, $password, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_EMULATE_PREPARES => false,
]);
$sql = file_get_contents(dirname(__DIR__) . '/sql/002_rate_limit.sql');
if ($sql === false) {
    throw new RuntimeException('Rate-limit migration missing');
}
$db->exec($sql);

$secret = str_repeat('integration-only-secret-', 2);
$keyA = VisitorKey::fromRemoteAddress('192.0.2.51', $secret);
$keyB = VisitorKey::fromRemoteAddress('192.0.2.52', $secret);
$limiter = new RateLimiter($db);
$checks = [
    'visitor_A_first' => $limiter->allow($keyA, 7200, 60, 2),
    'visitor_A_second' => $limiter->allow($keyA, 7201, 60, 2),
    'visitor_A_blocked' => !$limiter->allow($keyA, 7202, 60, 2),
    'visitor_B_independent' => $limiter->allow($keyB, 7202, 60, 2),
    'visitor_A_new_window' => $limiter->allow($keyA, 7260, 60, 2),
];
$rawAddressRows = (int)$db->query(
    "SELECT COUNT(*) FROM oxx_rate_limit WHERE bucket_key NOT REGEXP '^[0-9a-f]{64}$'"
)->fetchColumn();
$checks['stored_keys_are_hex_hmac'] = $rawAddressRows === 0;
foreach ($checks as $name => $ok) {
    if (!$ok) {
        throw new RuntimeException("FAIL: $name");
    }
    echo "PASS $name\n";
}
echo count($checks) . " integrated visitor-rate-limit cases; 0 failures\n";
