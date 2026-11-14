<?php
declare(strict_types=1);

namespace OxxAlbums\V5;

final class RequestValidator
{
    private const FORMATS = [
        'staand 21x28', 'staand 15x21',
        'liggend 28x19', 'liggend 21x15',
        'vierkant 19x19', 'vierkant 15x15',
    ];

    /**
     * Standalone draft schema. Field names MUST be reconciled with the real V4.8
     * contract before any public integration.
     * @return array{ok:bool,errors:array<string,string>,data:array<string,mixed>}
     */
    public static function validate(mixed $payload): array
    {
        if (!is_array($payload) || array_is_list($payload)) {
            return ['ok' => false, 'errors' => ['body' => 'Ongeldig aanvraagformaat.'], 'data' => []];
        }

        $errors = [];
        $data = [];
        $fields = ['naam', 'email', 'collectie', 'boekformaat', 'aantal_fotos', 'opmerkingen'];
        foreach ($payload as $key => $_) {
            if (!is_string($key) || !in_array($key, $fields, true)) {
                $errors['body'] = 'Onbekend veld in aanvraag.';
                break;
            }
        }

        foreach (['naam' => 120, 'email' => 254, 'collectie' => 30, 'boekformaat' => 50, 'opmerkingen' => 2000] as $field => $max) {
            $value = $payload[$field] ?? ($field === 'opmerkingen' ? '' : null);
            if (!is_string($value) || strlen($value) > $max * 4) {
                $errors[$field] = 'Ongeldige tekst.';
                continue;
            }
            $value = trim($value);
            $length = function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
            if ($length > $max || ($field !== 'opmerkingen' && $value === '')) {
                $errors[$field] = 'Veld ontbreekt of is te lang.';
            }
            $data[$field] = $value;
        }

        if (isset($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Vul een geldig e-mailadres in.';
        }
        if (isset($data['collectie']) && !in_array($data['collectie'], ['Classic', 'Essential'], true)) {
            $errors['collectie'] = 'Deze collectie is niet beschikbaar.';
        }
        if (isset($data['boekformaat']) && !in_array(strtolower(str_replace([' × ', '×', ' X ', ' X'], 'x', $data['boekformaat'])), self::FORMATS, true)) {
            $errors['boekformaat'] = 'Kies een beschikbaar boekformaat.';
        }
        $count = $payload['aantal_fotos'] ?? null;
        if (!(is_int($count) || (is_string($count) && preg_match('/^[1-9][0-9]*$/D', $count) === 1))) {
            $errors['aantal_fotos'] = 'Vul een positief geheel getal in.';
        } else {
            $count = filter_var($count, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 300]]);
            if ($count === false) {
                $errors['aantal_fotos'] = 'Het aantal foto’s is ongeldig.';
            } elseif (isset($data['collectie']) && $data['collectie'] === 'Classic' && $count > 180) {
                $errors['aantal_fotos'] = 'Classic ondersteunt maximaal 180 foto’s.';
            } else {
                $data['aantal_fotos'] = $count;
            }
        }
        return ['ok' => $errors === [], 'errors' => $errors, 'data' => $errors === [] ? $data : []];
    }
}
