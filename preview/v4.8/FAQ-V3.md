# FAQ V3

Eén homepage-sectie `Veelgestelde vragen`, onder de bestaande vier collectietegels. De tien vragen/antwoorden zijn letterlijk overgenomen uit de goedgekeurde handoff van 18 november 2026.

## Toegankelijke bediening

De accordion gebruikt native HTML `details`/`summary`: standaard alles gesloten, meerdere antwoorden onafhankelijk te openen en sluiten, muis/aanraking en Enter/Spatie ondersteund zonder extra JavaScript. Chromium geeft de actuele `expanded`-status via de toegankelijkheidsboom door. `aria-controls` en `aria-labelledby` koppelen ieder bedieningspunt aan zijn antwoordregio. Er is geen dubbel of handmatig bijgehouden `aria-expanded`-attribuut dat kan achterlopen op de native toestand.

De FAQ is uitsluitend zichtbaar op de homepage, heeft een zichtbare toetsenbordfocus en minimaal 44 pixels hoge bedieningsvlakken. Alle stijlen zijn onder `#home-faq` afgeschermd. De bestaande tegels, header, Mijn OXX, collectie-inhoud, afbeeldingen, formulieren en aanvraagstatus blijven behouden. Premium blijft niet bestelbaar.

## Tests

```sh
python3 -m http.server 8776 --bind 127.0.0.1
node preview/v4.8/tests/faq.cjs
V48_URL=http://127.0.0.1:8776/preview/v4.8/ node preview/v4.8/tests/responsive.cjs
```

`faq.cjs` controleert de tien letterlijke teksten, initiële gesloten toestand, native toegankelijkheidsstatus, Enter/Spatie, onafhankelijk openen, plaatsing onder de collecties, één FAQ, Mijn OXX, collectie-/home-navigatie, vergelijking, accountvensters, Premium, geen overloop, JavaScript-/HTTP-fouten of schrijvende verzoeken. Viewports: 393×852, 852×393, 320×640, 768×1024, 1440×900. `FAQ_SCREENSHOTS` bepaalt de uitvoermap; standaard `/tmp/oxx-faq-v3`. `V48_URL` kan naar de uitgepakte ZIP wijzen.

De bestaande regressiesuite controleert ook de ongewijzigde formulieren, grenzen 180/181 en 300/301, lokaal controleoverzicht, corrigeren, wissen bij sluiten, rotatie en OXX Design-linkdoelen. Het externe OXX Design-doel wordt lokaal onderschept: dit is geen beschikbaarheidstest van die website.

## Publicatiepakket

De complete statische ZIP bevat vijf websitebestanden direct in de webroot:

- `index.html`
- `web/responsive.css`
- `web/responsive.js`
- `web/collection-responsive.css`
- `web/application-api.mjs`

Alle foto's en logo's zijn in HTML ingebed. Geen PHP, database, tests, documenten of Git-archief uploaden. De API-client blijft expliciet uitgeschakeld; het bestand is wel nodig om de bestaande module-import zonder fout te laden. Upload de complete `web/`-map met behoud van structuur vóór het vervangen van `index.html`. De CSS-link heeft cacheversie `20261118-faq-v3`.

Er is geen automatische publicatie, merge of Vimexx-deploy onderdeel van deze wijziging. De gebruiker beoordeelt screenshots en pakket vóór handmatige upload. De vermelding van privacyafspraken in antwoord 10 is uitsluitend de letterlijk aangeleverde tekst; deze wijziging stelt geen bewaartermijn vast en voegt geen gegevensverwerking toe.
