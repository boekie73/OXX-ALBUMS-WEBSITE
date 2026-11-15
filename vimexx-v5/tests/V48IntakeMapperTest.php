<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/src/RequestValidator.php';
require_once dirname(__DIR__) . '/src/V48IntakeMapper.php';

use OxxAlbums\V5\V48IntakeMapper;

$base = [
    'customerName' => 'Test Klant',
    'email' => 'test@example.invalid',
    'collection' => 'classic',
    'bookFormat' => 'staand 21x28',
    'photoCount' => 180,
    'comments' => '',
];
$cases = [
    'v48_classic_180' => [$base, true],
    'v48_classic_181' => [array_replace($base, ['photoCount' => 181]), false],
    'v48_essential_300' => [array_replace($base, ['collection' => 'essential', 'photoCount' => 300]), true],
    'v48_essential_301' => [array_replace($base, ['collection' => 'essential', 'photoCount' => 301]), false],
    'v48_premium' => [array_replace($base, ['collection' => 'premium']), false],
    'v48_unknown_field' => [array_replace($base, ['extra' => 'x']), false],
    'v48_invalid_type' => [array_replace($base, ['customerName' => ['x']]), false],
    'v48_null_body' => [null, false],
];
$failed = 0;
foreach ($cases as $name => [$input, $expected]) {
    $actual = V48IntakeMapper::map($input);
    if ($actual['ok'] !== $expected) {
        $failed++;
        fwrite(STDERR, "FAIL $name\n");
    } else {
        echo "PASS $name\n";
    }
}
$formats = ['staand 21x28', 'staand 15x21', 'liggend 28x19', 'liggend 21x15', 'vierkant 19x19', 'vierkant 15x15'];
foreach (['classic' => 180, 'essential' => 300] as $collection => $maxPhotos) {
    foreach ($formats as $format) {
        $input = array_replace($base, ['collection' => $collection, 'bookFormat' => $format, 'photoCount' => $maxPhotos]);
        $result = V48IntakeMapper::map($input);
        $name = "format_{$collection}_{$format}";
        if (!$result['ok'] || $result['data']['boekformaat'] !== $format) {
            $failed++;
            fwrite(STDERR, "FAIL $name\n");
        } else {
            echo "PASS $name\n";
        }
    }
}
echo (count($cases) + count($formats) * 2) . " cases, $failed failures\n";
exit($failed ? 1 : 0);
