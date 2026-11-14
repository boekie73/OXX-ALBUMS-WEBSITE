# OXX Albums V5.0 — PHP 8.3 prototype (HOLD)

**Ontwikkelbranch:** `codex/v5-0-vimexx-php`. **Niet deployen.**

Dit is een eerste geïsoleerde PHP-validatiebasis voor Vimexx Basic, niet de afgeronde V5.0-productie-API. De endpoint geeft voor valide invoer bewust HTTP 503 terug: er is geen opslag, verzending of aanvraagacceptatie. Geen persoonsgegevens worden verwerkt in een database.

## Bestanden
- `src/RequestValidator.php`: servervalidatie voor Classic (max 180), Essential (max 300), zes formaten en basisvelden.
- `public/api/aanvragen/index.php`: JSON-ingang met bodylimiet, afgeschermde origin en expliciete HOLD-response.

## Belangrijke blokkades
1. **Broncontract:** de exacte V4.8-backend en actuele Studio/Engine-opdrachtregistercontracten moeten eerst aantoonbaar worden ingezien. De veldnamen in dit prototype zijn voorlopig; niet aannemen dat de frontend ze al gebruikt.
2. **Opslag:** er is nog geen PDO/MySQL-adapter, migratie, opdrachtidentiteit-mapping of beveiligde opslag geactiveerd. Geen tweede zelfstandig opdrachtregister maken.
3. **Beveiliging:** origin-allowlist, CSRF/abuse-verificatie, persistente rate limiting, HTTPS-only deployment, privacybeleid, log-redactie en herstelbare backups moeten vóór activatie worden uitgewerkt en getest.
4. **Omgeving:** PHP 8.3 met pdo_mysql is zichtbaar in DirectAdmin, maar daadwerkelijke DB-toegang, document root en SSL zijn niet getest.
5. **Testen:** PHP CLI/unit- en integratietests moeten nog worden uitgevoerd. Deze commit is **geen PASS**.

De goedgekeurde V4.4-homepage, V4.7/V4.8-formulieren, eerdere previews en livewebsite zijn niet aangepast.

## Geplande testgevallen
- Classic 180 PASS / 181 FAIL; Essential 300 PASS / 301 FAIL
- Premium FAIL; onbekend formaat FAIL; ontbrekende velden FAIL
- Ongeldig e-mailadres, ongeldig JSON, oversized payload, ongeldige methode
- Valide aanvraag: HTTP 503 zonder opslag, verzending of succesmelding

**Publicatiebeleid:** geen merge naar main of deployment op Vimexx zonder expliciete beoordeling.
