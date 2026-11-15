<?php
declare(strict_types=1);

namespace OxxAlbums\V5;

use PDO;
use RuntimeException;

/**
 * Private intake-only persistence. Does not create or modify I3 orders,
 * revisions, photos, ZIP files or proofs.
 */
final class IntakeRepository
{
    public function __construct(private PDO $db) {}

    public function save(array $validated): string
    {
        if (!isset($validated['naam'], $validated['email'], $validated['collectie'],
            $validated['boekformaat'], $validated['aantal_fotos'], $validated['opmerkingen'])) {
            throw new RuntimeException('Validated intake fields missing');
        }
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        $hex = bin2hex($bytes);
        $id = sprintf('%s-%s-%s-%s-%s', substr($hex,0,8), substr($hex,8,4),
            substr($hex,12,4), substr($hex,16,4), substr($hex,20,12));
        $stmt = $this->db->prepare(
            'INSERT INTO oxx_intake (intake_id, customer_name, email, collection_name, book_format, photo_count, comments) ' .
            'VALUES (:id, :name, :email, :collection, :format, :photos, :comments)'
        );
        $stmt->execute([
            ':id' => $id,
            ':name' => $validated['naam'],
            ':email' => $validated['email'],
            ':collection' => $validated['collectie'],
            ':format' => $validated['boekformaat'],
            ':photos' => $validated['aantal_fotos'],
            ':comments' => $validated['opmerkingen'],
        ]);
        return $id;
    }
}
