<?php
declare(strict_types=1);

namespace OxxAlbums\V5;

/**
 * Strict translation of preview/v4.8/web/application-api.mjs payload.
 * Does not create an I3 order or write to a database.
 */
final class V48IntakeMapper
{
    public static function map(mixed $payload): array
    {
        if (!is_array($payload) || array_is_list($payload)) {
            return ['ok' => false, 'errors' => ['body' => 'Ongeldige aanvraag.'], 'data' => []];
        }
        $allowed = ['customerName', 'email', 'collection', 'bookFormat', 'photoCount', 'comments'];
        if (array_diff(array_keys($payload), $allowed) !== []) {
            return ['ok' => false, 'errors' => ['body' => 'Onbekende velden.'], 'data' => []];
        }
        foreach (['customerName', 'email', 'collection', 'bookFormat', 'comments'] as $key) {
            if (isset($payload[$key]) && !is_string($payload[$key])) {
                return ['ok' => false, 'errors' => [$key => 'Ongeldig veldtype.'], 'data' => []];
            }
        }
        $collection = $payload['collection'] ?? '';
        $collection = match ($collection) {
            'classic' => 'Classic',
            'essential' => 'Essential',
            default => $collection,
        };
        $mapped = [
            'naam' => $payload['customerName'] ?? null,
            'email' => $payload['email'] ?? null,
            'collectie' => $collection,
            'boekformaat' => $payload['bookFormat'] ?? null,
            'aantal_fotos' => $payload['photoCount'] ?? null,
            'opmerkingen' => $payload['comments'] ?? '',
        ];
        return RequestValidator::validate($mapped);
    }
}
