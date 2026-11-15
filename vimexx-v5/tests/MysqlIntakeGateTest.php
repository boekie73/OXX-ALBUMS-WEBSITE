<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/src/IntakeGate.php';
use OxxAlbums\V5\IntakeGate;

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
    throw new RuntimeException('Rate-limit schema missing');
}
$db->exec($sql);
$gate = new IntakeGate($db);
$origin = 'https://oxxalbums.nl';
$secret = str_repeat('isolated-test-secret-', 2);
$ip = '198.51.100.77';
$checks = [
    'valid' => $gate->check($origin, $ip, $origin, $secret, 10800)['allowed'],
    'wrong_origin' => $gate->check('https://evil.invalid', $ip, $origin, $secret, 10800)['reason'] === 'origin',
    'missing_origin' => $gate->check(null, $ip, $origin, $secret, 10800)['reason'] === 'origin',
    'spoofed_ip' => $gate->check($origin, '198.51.100.77, 192.0.2.3', $origin, $secret, 10800)['reason'] === 'visitor',
    'short_secret' => $gate->check($origin, $ip, $origin, 'weak', 10800)['reason'] === 'visitor',
];
for ($i = 1; $i < 10; $i++) {
    $result = $gate->check($origin, $ip, $origin, $secret, 10800 + $i);
    if (!$result['allowed']) {
        throw new RuntimeException('FAIL: valid attempt ' . $i);
    }
}
$checks['eleventh_blocked'] = $gate->check($origin, $ip, $origin, $secret, 10820)['reason'] === 'limit';
$checks['new_window'] = $gate->check($origin, $ip, $origin, $secret, 14400)['allowed'];
foreach ($checks as $name => $ok) {
    if (!$ok) {
        throw new RuntimeException('FAIL: ' . $name);
    }
    echo "PASS $name\n";
}
echo count($checks) . " combined intake gate cases; 0 failures\n";
