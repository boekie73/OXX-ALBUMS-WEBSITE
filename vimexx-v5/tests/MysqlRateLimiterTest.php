<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/src/RateLimiter.php';
use OxxAlbums\V5\RateLimiter;
$dsn = getenv('OXX_TEST_MYSQL_DSN');
$user = getenv('OXX_TEST_MYSQL_USER');
$pass = getenv('OXX_TEST_MYSQL_PASSWORD');
if (!$dsn || !$user || $pass === false || !str_starts_with($dsn, 'mysql:')) {
    throw new RuntimeException('Isolated MariaDB test environment required');
}
$db = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_EMULATE_PREPARES => false,
]);
$db->exec(file_get_contents(dirname(__DIR__) . '/sql/002_rate_limit.sql'));
$limiter = new RateLimiter($db);
$key = hash('sha256', 'isolated-visitor-A');
$keyB = hash('sha256', 'isolated-visitor-B');
$checks = [
    'first' => $limiter->allow($key, 3600, 60, 2),
    'second' => $limiter->allow($key, 3601, 60, 2),
    'third_blocked' => !$limiter->allow($key, 3602, 60, 2),
    'other_visitor' => $limiter->allow($keyB, 3602, 60, 2),
    'new_window' => $limiter->allow($key, 3660, 60, 2),
    'second_new_window' => $limiter->allow($key, 3661, 60, 2),
    'new_window_limit' => !$limiter->allow($key, 3662, 60, 2),
];
try {
    $limiter->allow('raw-IP-address', 3600);
    $checks['invalid_key'] = false;
} catch (InvalidArgumentException) {
    $checks['invalid_key'] = true;
}
foreach ($checks as $name => $pass) {
    if (!$pass) {
        throw new RuntimeException("FAIL: $name");
    }
    echo "PASS $name\n";
}
echo count($checks) . " MariaDB limiter cases; 0 failures\n";
