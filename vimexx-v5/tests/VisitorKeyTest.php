<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/src/VisitorKey.php';
use OxxAlbums\V5\VisitorKey;

$secret = str_repeat('x', 32);
$a = VisitorKey::fromRemoteAddress('192.0.2.5', $secret);
$b = VisitorKey::fromRemoteAddress('192.0.2.6', $secret);
$v6 = VisitorKey::fromRemoteAddress('2001:db8::1', $secret);
$v6expanded = VisitorKey::fromRemoteAddress('2001:0db8:0:0:0:0:0:1', $secret);
$checks = [
    'hex_64' => preg_match('/^[a-f0-9]{64}$/D', $a) === 1,
    'stable' => $a === VisitorKey::fromRemoteAddress('192.0.2.5', $secret),
    'different_address' => $a !== $b,
    'different_secret' => $a !== VisitorKey::fromRemoteAddress('192.0.2.5', str_repeat('y', 32)),
    'ipv6_normalized' => $v6 === $v6expanded,
    'ipv4_vs_ipv6' => $a !== $v6,
];
foreach ([
    'empty' => '',
    'forwarded_header' => '192.0.2.5, 198.51.100.1',
    'invalid' => 'not-an-ip',
    'injection' => "192.0.2.5\n",
] as $name => $address) {
    try {
        VisitorKey::fromRemoteAddress($address, $secret);
        $checks[$name . '_rejected'] = false;
    } catch (InvalidArgumentException) {
        $checks[$name . '_rejected'] = true;
    }
}
try {
    VisitorKey::fromRemoteAddress('192.0.2.5', 'short');
    $checks['short_secret_rejected'] = false;
} catch (InvalidArgumentException) {
    $checks['short_secret_rejected'] = true;
}
foreach ($checks as $name => $ok) {
    if (!$ok) {
        throw new RuntimeException("FAIL: $name");
    }
    echo "PASS $name\n";
}
echo count($checks) . " visitor key cases; 0 failures\n";
