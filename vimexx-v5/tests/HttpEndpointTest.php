<?php
declare(strict_types=1);

/** HTTP contract smoke tests against a locally running PHP built-in server.
 * No customer data, external network, database or delivery.
 */
$base = 'http://127.0.0.1:18743/api/aanvragen/';
$valid = json_encode([
    'customerName' => 'Test Klant', 'email' => 'test@example.invalid',
    'collection' => 'classic', 'bookFormat' => 'staand 21x28',
    'photoCount' => 180, 'comments' => ''
], JSON_THROW_ON_ERROR);
$cases = [
    ['get_rejected', 'GET', null, [], 405],
    ['valid_held', 'POST', $valid, ['Content-Type: application/json'], 503],
    ['classic_limit', 'POST', str_replace('"photoCount":180', '"photoCount":181', $valid), ['Content-Type: application/json'], 422],
    ['bad_json', 'POST', '{', ['Content-Type: application/json'], 400],
    ['bad_media_type', 'POST', $valid, ['Content-Type: text/plain'], 415],
    ['origin_held', 'POST', $valid, ['Content-Type: application/json', 'Origin: https://example.invalid'], 403],
    ['oversize', 'POST', str_repeat('x', 8193), ['Content-Type: application/json'], 413],
];
$failures = 0;
foreach ($cases as [$name, $method, $body, $headers, $expected]) {
    $headers[] = 'Connection: close';
    $opts = ['http' => [
        'method' => $method,
        'header' => implode("\r\n", $headers),
        'ignore_errors' => true,
        'timeout' => 5,
    ]];
    if ($body !== null) {
        $opts['http']['content'] = $body;
    }
    $response = @file_get_contents($base, false, stream_context_create($opts));
    $statusLine = $http_response_header[0] ?? '';
    preg_match('/^HTTP\/\S+\s+(\d{3})/', $statusLine, $matches);
    $actual = (int) ($matches[1] ?? 0);
    $json = is_string($response) ? json_decode($response, true) : null;
    if ($actual !== $expected || !is_array($json) || !isset($json['error'])) {
        fwrite(STDERR, "FAIL $name: HTTP $actual (expected $expected)\n");
        $failures++;
    } else {
        echo "PASS $name HTTP $actual\n";
    }
}
echo count($cases) . " HTTP cases; $failures failures\n";
exit($failures ? 1 : 0);
