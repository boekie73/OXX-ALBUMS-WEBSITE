<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/src/RequestValidator.php';
require_once dirname(__DIR__) . '/src/V48IntakeMapper.php';

use OxxAlbums\V5\V48IntakeMapper;

$base = [
    'customerName' => 'Voorbeeld Klant',
    'email' => 'klant@example.com',
    'collection' => 'classic',
    'bookFormat' => 'staand 21x28',
    'photoCount' => 1,
    'comments' => '',
];

$cases = [
    'classic_minimum' => [[], true],
    'classic_maximum' => [['photoCount' => 180], true],
    'classic_over_limit' => [['photoCount' => 181], false],
    'essential_maximum' => [['collection' => 'essential', 'photoCount' => 300], true],
    'essential_over_limit' => [['collection' => 'essential', 'photoCount' => 301], false],
    'premium_hold' => [['collection' => 'premium'], false],
    'zero_photos' => [['photoCount' => 0], false],
    'negative_photos' => [['photoCount' => -1], false],
    'fractional_photos' => [['photoCount' => 1.5], false],
    'unknown_format' => [['bookFormat' => 'vierkant 30x30'], false],
    'invalid_email' => [['email' => 'ongeldig'], false],
    'unexpected_field' => [['csrfOverride' => 'x'], false],
];

$failures = 0;
foreach ($cases as $name => [$overrides, $expected]) {
    $result = V48IntakeMapper::map(array_replace($base, $overrides));
    if ($result['ok'] !== $expected) {
        fwrite(STDERR, "FAIL {$name}\n");
        $failures++;
    } else {
        echo "PASS {$name}\n";
    }
}
echo count($cases) . " cases, {$failures} failures\n";
exit($failures === 0 ? 0 : 1);
