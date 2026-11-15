<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/src/IntakeProcessor.php';

use OxxAlbums\V5\IntakeGate;
use OxxAlbums\V5\IntakePreflight;
use OxxAlbums\V5\IntakeRepository;
use OxxAlbums\V5\IntakeProcessor;

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
foreach (['001_intake.sql', '002_rate_limit.sql'] as $name) {
    $sql = file_get_contents(dirname(__DIR__) . '/sql/' . $name);
    if ($sql === false) throw new RuntimeException('Missing schema');
    $db->exec($sql);
}
$before = (int)$db->query('SELECT COUNT(*) FROM oxx_intake')->fetchColumn();
$processor = new IntakeProcessor(new IntakePreflight(new IntakeGate($db)), new IntakeRepository($db));
$origin = 'https://oxxalbums.nl';
$secret = str_repeat('isolated-processor-secret-', 2);
$payload = [
    'customerName' => 'Proefklant', 'email' => 'test@example.invalid',
    'collection' => 'essential', 'bookFormat' => 'liggend 28x19',
    'photoCount' => 300, 'comments' => 'Interne proef',
];
$valid = $processor->process($payload, $origin, '192.0.2.188', $origin, $secret, 25200);
$bad = $processor->process(array_replace($payload, ['photoCount' => 301]), $origin,
    '192.0.2.189', $origin, $secret, 25201);
$foreign = $processor->process($payload, 'https://invalid.example', '192.0.2.190',
    $origin, $secret, 25202);
$after = (int)$db->query('SELECT COUNT(*) FROM oxx_intake')->fetchColumn();
$stored = $db->prepare('SELECT collection_name, photo_count, book_format, status FROM oxx_intake WHERE intake_id = ?');
$stored->execute([$valid['intake_id']]);
$row = $stored->fetch(PDO::FETCH_ASSOC);
$checks = [
    'valid_saved' => $valid['accepted'] && preg_match('/^[a-f0-9-]{36}$/D', (string)$valid['intake_id']) === 1,
    'stored_correctly' => $row !== false && $row['collection_name'] === 'Essential'
        && (int)$row['photo_count'] === 300 && $row['book_format'] === 'liggend 28x19'
        && $row['status'] === 'new',
    'invalid_rejected' => !$bad['accepted'] && $bad['intake_id'] === null,
    'foreign_origin_rejected' => !$foreign['accepted'] && $foreign['intake_id'] === null,
    'only_one_new_intake' => $after === $before + 1,
];
foreach ($checks as $name => $ok) {
    if (!$ok) throw new RuntimeException('FAIL ' . $name);
    echo "PASS $name\n";
}
echo count($checks) . " intake processor checks; 0 failures\n";
