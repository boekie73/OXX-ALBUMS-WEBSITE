<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/src/IntakeRepository.php';

use OxxAlbums\V5\IntakeRepository;

$dsn = getenv('OXX_TEST_MYSQL_DSN');
$user = getenv('OXX_TEST_MYSQL_USER');
$password = getenv('OXX_TEST_MYSQL_PASSWORD');
if (!$dsn || !$user || $password === false || !str_starts_with($dsn, 'mysql:')) {
    fwrite(STDERR, "FAIL: isolated MySQL test configuration missing\n");
    exit(1);
}
$db = new PDO($dsn, $user, $password, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_EMULATE_PREPARES => false,
]);
$sql = file_get_contents(dirname(__DIR__) . '/sql/001_intake.sql');
if ($sql === false) {
    throw new RuntimeException('SQL migration missing');
}
$db->exec($sql);
$repo = new IntakeRepository($db);
$valid = [
    'naam' => 'Proef Klant', 'email' => 'proef@example.invalid',
    'collectie' => 'Essential', 'boekformaat' => 'vierkant 19x19',
    'aantal_fotos' => 300, 'opmerkingen' => "OXX 'veilig' test",
];
$id = $repo->save($valid);
$stmt = $db->prepare('SELECT customer_name, email, collection_name, book_format, photo_count, comments, status FROM oxx_intake WHERE intake_id = ?');
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row || $row['customer_name'] !== $valid['naam'] ||
    $row['email'] !== $valid['email'] || $row['collection_name'] !== 'Essential' ||
    $row['book_format'] !== 'vierkant 19x19' || (int)$row['photo_count'] !== 300 ||
    $row['comments'] !== $valid['opmerkingen'] || $row['status'] !== 'new') {
    throw new RuntimeException('MySQL persistence roundtrip mismatch');
}
try {
    $repo->save(array_replace($valid, ['aantal_fotos' => 301]));
    throw new RuntimeException('Invalid intake accepted');
} catch (RuntimeException $e) {
    if ($e->getMessage() === 'Invalid intake accepted') {
        throw $e;
    }
}
$count = (int)$db->query('SELECT COUNT(*) FROM oxx_intake')->fetchColumn();
if ($count !== 1) {
    throw new RuntimeException('Invalid intake changed MySQL storage');
}
echo "PASS: MariaDB migration, prepared INSERT, roundtrip, invalid write rejection\n";
