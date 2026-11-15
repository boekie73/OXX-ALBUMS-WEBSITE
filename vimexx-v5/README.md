# OXX Albums V5 — PHP 8.3 / Vimexx Basic (PRODUCTIE HOLD)

**Branch:** `codex/v5-0-vimexx-php`. **Niet deployen, niet mergen zonder akkoord.**

## Bewezen teststatus
- V5.6 HTTP-contract en PHP 8.3: PASS — [run 43627354431](https://github.com/boekie73/OXX-ALBUMS-WEBSITE/actions/runs/43627354431)
- V5.7 PDO SQLite opslag en validatie: PASS — [run 43695774776](https://github.com/boekie73/OXX-ALBUMS-WEBSITE/actions/runs/43695774776)
- V5.8 MariaDB 11.4 migratie + echte PDO INSERT/SELECT + ongeldige aanvraag: PASS — [run 43697899069](https://github.com/boekie73/OXX-ALBUMS-WEBSITE/actions/runs/43697899069)

Dit zijn **geïsoleerde GitHub Actions-tests**, niet de Vimexx-productieomgeving.

## Bestanden en verantwoordelijkheid
- `src/RequestValidator.php`: Classic/Essential-limieten en velden controleren.
- `src/V48IntakeMapper.php`: Engelstalig V4.8-aanvraagcontract naar interne velden.
- `src/IntakeRepository.php`: PDO-opslag in **aparte intakewachtrij**, geen I3-opdrachtregister.
- `sql/001_intake.sql`: MariaDB/MySQL-schema met aanvraag-ID, contactgegevens, collectie, formaat, aantal foto's, opmerkingen en wachtrijstatus.
- `public/api/aanvragen/index.php`: **altijd HOLD**, valide POST krijgt HTTP 503; geen databasekoppeling, e-mail of acceptatie.
- `tests/`: validator, mapper, HTTP, SQLite en MariaDB integratietests.

## Openstaande blokkades vóór productie
1. Exacte V4.8-formulierwaarden en contract tegen de daadwerkelijke HTML bevestigen.
2. Echte Vimexx Basic-omgeving: PHP-versie, `pdo_mysql`, databaseprivileges, documentroot, HTTPS en backups controleren; geen credentials in GitHub.
3. Veilige origin-/CSRF-bescherming, anti-bot, persistente rate limiting, foutafhandeling en minimale logging.
4. Geauthenticeerd beheer, veilige overdracht van intake naar bestaande lokale I3-workflow, status/idempotentie en herstel.
5. Privacytekst, bewaring en verwijderen van persoonsgegevens vaststellen.
6. Expliciet akkoord op deploy, DB-migratie en activering; vooraf gecontroleerde test op hosting.

**HOLD:** geen live aanvragen, geen Vimexx-installatie, geen extra hosting en geen wijziging aan goedgekeurde website of Studio-masters.
