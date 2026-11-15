<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/src/IntakeRepository.php';
use OxxAlbums\V5\IntakeRepository;

if (!extension_loaded('pdo_sqlite')) {
    fwrite(STDERR, "FAIL: pdo_sqlite missing\n");
    exit(1);
}
$db = new PDO('sqlite::memory:', null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_EMULATE_PREPARES => false,
]);
$db->exec('CREATE TABLE oxx_intake (
    intake_id TEXT PRIMARY KEY, received_at TEXT DEFAULT CURRENT_TIMESTAMP,
    customer_name TEXT NOT NULL, email TEXT NOT NULL, collection_name TEXT NOT NULL,
    book_format TEXT NOT NULL, photo_count INTEGER NOT NULL, comments TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT "new", exported_at TEXT
)');
$repo = new IntakeRepository($db);
$valid = [
    'naam' => 'Test Klant', 'email' => 'test@example.invalid',
    'collectie' => 'Classic', 'boekformaat' => 'staand 21x28',
    'aantal_fotos' => 180, 'opmerkingen' => "Testtekst ' met quotes",
];
$failures = 0;
function check(string $name, bool $ok): void {
    global $failures;
    if (!$ok) {
        $failures++;
        fwrite(STDERR, "FAIL $name\n");
    } else {
        echo "PASS $name\n";
    }
}
$id1 = $repo->save($valid);
check('uuidv4', preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/', $id1) === 1);
$id2 = $repo->save($valid);
check('unique_ids', $id1 !== $id2);
$rows = $db->query('SELECT * FROM oxx_intake ORDER BY intake_id')->fetchAll(PDO::FETCH_ASSOC);
check('two_intakes', count($rows) === 2);
check('safe_roundtrip', $rows[0]['comments'] === $valid['opmerkingen'] && $rows[0]['email'] === $valid['email']);
check('default_status', $rows[0]['status'] === 'new' && $rows[1]['status'] === 'new');
try {
    $repo->save(['naam' => 'incomplete']);
    check('missing_fields_rejected', false);
} catch (RuntimeException) {
    check('missing_fields_rejected', true);
}
foreach ([
    'over_limit_classic' => ['aantal_fotos' => 181],
    'premium_rejected' => ['collectie' => 'Premium'],
    'invalid_email' => ['email' => 'not-an-email'],
    'unknown_field' => ['extra' => 'surprise'],
    'noncanonical_name' => ['naam' => ' Test Klant '],
    'numeric_string_not_canonical' => ['aantal_fotos' => '180'],
] as $name => $changes) {
    try {
        $repo->save(array_replace($valid, $changes));
        check($name, false);
    } catch (RuntimeException) {
        check($name, true);
    }
}
$reordered = array_reverse($valid, true);
try {
    $repo->save($reordered);
    check('field_order_independent', true);
} catch (RuntimeException) {
    check('field_order_independent', false);
}
check('no_partial_insert', (int)$db->query('SELECT COUNT(*) FROM oxx_intake')->fetchColumn() === 3);
echo "14 cases; $failures failures\n";
exit($failures ? 1 : 0);
