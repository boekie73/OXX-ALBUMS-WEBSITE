<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/src/RequestValidator.php';

use OxxAlbums\V5\RequestValidator;

$base = [
    'naam' => 'Test Klant',
    'email' => 'test@example.invalid',
    'collectie' => 'Classic',
    'boekformaat' => 'staand 21x28',
    'aantal_fotos' => 180,
    'opmerkingen' => '',
];
$cases = [
    'classic_180' => [$base, true],
    'classic_181' => [array_replace($base, ['aantal_fotos' => 181]), false],
    'essential_300' => [array_replace($base, ['collectie' => 'Essential', 'aantal_fotos' => 300]), true],
    'essential_301' => [array_replace($base, ['collectie' => 'Essential', 'aantal_fotos' => 301]), false],
    'premium' => [array_replace($base, ['collectie' => 'Premium']), false],
    'unknown_format' => [array_replace($base, ['boekformaat' => 'vierkant 30x30']), false],
    'invalid_email' => [array_replace($base, ['email' => 'not-an-email']), false],
    'missing_name' => [array_replace($base, ['naam' => '']), false],
    'zero_photos' => [array_replace($base, ['aantal_fotos' => 0]), false],
    'negative_photos' => [array_replace($base, ['aantal_fotos' => -1]), false],
    'decimal_photos' => [array_replace($base, ['aantal_fotos' => '1.5']), false],
    'unknown_field' => [array_replace($base, ['secret' => 'value']), false],
    'array_body' => [[1, 2, 3], false],
    'null_body' => [null, false],
];
$failures = 0;
foreach ($cases as $name => [$payload, $expected]) {
    $result = RequestValidator::validate($payload);
    $actual = $result['ok'];
    if ($actual !== $expected || (!$actual && $result['data'] !== [])) {
        $failures++;
        fwrite(STDERR, "FAIL $name\n");
    } else {
        echo "PASS $name\n";
    }
}
echo count($cases) . " cases; $failures failures\n";
exit($failures === 0 ? 0 : 1);
