<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/src/OriginPolicy.php';
use OxxAlbums\V5\OriginPolicy;

$expected = 'https://oxxalbums.nl';
$cases = [
    'same_origin' => ['https://oxxalbums.nl', true],
    'case_insensitive_host' => ['https://OXXALBUMS.NL', true],
    'default_https_port' => ['https://oxxalbums.nl:443', true],
    'different_subdomain' => ['https://www.oxxalbums.nl', false],
    'attacker_subdomain' => ['https://oxxalbums.nl.attacker.invalid', false],
    'http_rejected' => ['http://oxxalbums.nl', false],
    'nonstandard_port' => ['https://oxxalbums.nl:444', false],
    'path_rejected' => ['https://oxxalbums.nl/path', false],
    'query_rejected' => ['https://oxxalbums.nl?x=1', false],
    'credentials_rejected' => ['https://user@oxxalbums.nl', false],
    'two_origins_rejected' => ['https://oxxalbums.nl,https://evil.invalid', false],
    'null_string_rejected' => ['null', false],
    'whitespace_rejected' => [' https://oxxalbums.nl', false],
    'missing_origin' => [null, false],
];
$failures = 0;
foreach ($cases as $name => [$origin, $want]) {
    $got = OriginPolicy::allows($origin, $expected);
    if ($got !== $want) {
        fwrite(STDERR, "FAIL $name\n");
        $failures++;
    } else {
        echo "PASS $name\n";
    }
}
if (OriginPolicy::allows('https://oxxalbums.nl', 'http://oxxalbums.nl')) {
    fwrite(STDERR, "FAIL insecure_configuration\n");
    $failures++;
} else {
    echo "PASS insecure_configuration\n";
}
echo "15 origin cases; $failures failures\n";
exit($failures ? 1 : 0);
