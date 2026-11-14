<?php
declare(strict_types=1);

/**
 * NON-PRODUCTION prototype. Keep this endpoint off public hosting.
 * Public requests are rejected even when validation passes.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $data): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, ['error' => 'Methode niet toegestaan.']);
}

// No CORS wildcard. An Origin header is not a security/authentication boundary.
// Real origin allowlist, CSRF/abuse controls and rate limiting are deployment blockers.
if (isset($_SERVER['HTTP_ORIGIN'])) {
    respond(403, ['error' => 'Aanvragen zijn nog niet beschikbaar.']);
}
if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') {
    respond(415, ['error' => 'Alleen JSON wordt ondersteund.']);
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 8192) {
    respond(413, ['error' => 'Aanvraag is te groot.']);
}
$raw = file_get_contents('php://input', false, null, 0, 8193);
if ($raw === false || strlen($raw) > 8192) {
    respond(413, ['error' => 'Aanvraag is te groot.']);
}
try {
    $body = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    respond(400, ['error' => 'Ongeldige JSON.']);
}
require_once dirname(__DIR__, 3) . '/src/RequestValidator.php';
require_once dirname(__DIR__, 3) . '/src/V48IntakeMapper.php';
$validation = \OxxAlbums\V5\V48IntakeMapper::map($body);
if (!$validation['ok']) {
    respond(422, ['error' => 'Controleer de invoer.', 'fields' => $validation['errors']]);
}
// Intentionally never persist, send email or claim acceptance.
respond(503, ['error' => 'Aanvragen ontvangen is nog niet geactiveerd.']);
