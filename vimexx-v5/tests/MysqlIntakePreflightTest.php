<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/src/IntakePreflight.php';

use OxxAlbums\V5\IntakeGate;
use OxxAlbums\V5\IntakePreflight;

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
foreach (['002_rate_limit.sql', '001_intake.sql'] as $name) {
    $sql = file_get_contents(dirname(__DIR__) . '/sql/' . $name);
    if ($sql === false) {
        throw new RuntimeException('Missing schema: ' . $name);
    }
    $db->exec($sql);
}
$baselineIntakes = (int)$db->query('SELECT COUNT(*) FROM oxx_intake')->fetchColumn();
$preflight = new IntakePreflight(new IntakeGate($db));
$origin = 'https://oxxalbums.nl';
$secret = str_repeat('preflight-test-secret-', 2);
$payload = [
    'customerName' => 'Test Klant', 'email' => 'test@example.invalid',
    'collection' => 'classic', 'bookFormat' => 'staand 21x28',
    'photoCount' => 180, 'comments' => '',
];
$ip = '203.0.113.55';
$run = static fn(mixed $body, ?string $site, ?string $visitor, int $now) =>
    $preflight->check($body, $site, $visitor, $origin, $secret, $now);
$valid = $run($payload, $origin, $ip, 18000);
$invalid = $run(array_replace($payload, ['photoCount' => 181]), $origin, $ip, 18001);
$wrongOrigin = $run($payload, 'https://evil.invalid', $ip, 18002);
$checks = [
    'valid_preflight_only' => $valid['allowed'] && $valid['data']['aantal_fotos'] === 180,
    'invalid_rejected' => !$invalid['allowed'] && $invalid['reason'] === 'validation',
    'wrong_origin_rejected' => !$wrongOrigin['allowed'] && $wrongOrigin['reason'] === 'origin',
    'no_intake_saved' => (int)$db->query('SELECT COUNT(*) FROM oxx_intake')->fetchColumn() === $baselineIntakes,
];
for ($i = 0; $i < 8; $i++) {
    $run(['unexpected' => 'invalid'], $origin, $ip, 18003 + $i);
}
$blocked = $run($payload, $origin, $ip, 18020);
$checks['invalid_attempts_counted'] = !$blocked['allowed'] && $blocked['reason'] === 'limit';
$checks['still_no_intake_saved'] = (int)$db->query('SELECT COUNT(*) FROM oxx_intake')->fetchColumn() === 0;
foreach ($checks as $name => $ok) {
    if (!$ok) {
        throw new RuntimeException('FAIL: ' . $name);
    }
    echo "PASS $name\n";
}
echo count($checks) . " preflight integration cases; 0 failures\n";
