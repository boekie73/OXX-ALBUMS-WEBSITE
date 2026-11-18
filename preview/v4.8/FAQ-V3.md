# FAQ V3

Eén homepage-sectie `Veelgestelde vragen`, onder de bestaande vier collectietegels. De elf vragen/antwoorden zijn letterlijk overgenomen uit de laatste goedgekeurde V3-handoff. De nieuwe vergelijkingsvraag staat bovenaan; de eerdere tien vragen zijn behouden.

## Toegankelijke bediening

De accordion gebruikt native HTML `details`/`summary`: standaard alles gesloten, meerdere antwoorden onafhankelijk te openen en sluiten, muis/aanraking en Enter/Spatie ondersteund zonder extra JavaScript. Chromium geeft de actuele `expanded`-status via de toegankelijkheidsboom door. `aria-controls` en `aria-labelledby` koppelen ieder bedieningspunt aan zijn antwoordregio. Er is geen dubbel of handmatig bijgehouden `aria-expanded`-attribuut dat kan achterlopen op de native toestand.

De FAQ is uitsluitend zichtbaar op de homepage, heeft een zichtbare toetsenbordfocus en minimaal 44 pixels hoge bedieningsvlakken. Alle stijlen zijn onder `#home-faq` afgeschermd. De bestaande vier tegels, header, Mijn OXX, afbeeldingen, formulieren en aanvraagstatus blijven behouden. Classic en Essential hebben binnen hun tegel de goedgekeurde onderscheidende kop en tekst. Op de productpagina’s verduidelijkt HTML de werkwijze, zonder prijzen of limieten te wijzigen. Premium blijft niet bestelbaar.

## Tests

```sh
python3 -m http.server 8776 --bind 127.0.0.1
node preview/v4.8/tests/faq.cjs
V48_URL=http://127.0.0.1:8776/preview/v4.8/ node preview/v4.8/tests/responsive.cjs
```

`faq.cjs` controleert de elf letterlijke teksten, initiële gesloten toestand, native toegankelijkheidsstatus, Enter/Spatie, onafhankelijk openen, plaatsing onder de collecties, één FAQ, Mijn OXX, collectie-/home-navigatie, vergelijking, accountvensters, Premium, geen overloop, JavaScript-/HTTP-fouten of schrijvende verzoeken. Viewports: 393×852, 852×393, 320×640, 768×1024, 1440×900. `FAQ_SCREENSHOTS` bepaalt de uitvoermap; standaard `/tmp/oxx-faq-v3`. `V48_URL` kan naar de uitgepakte ZIP wijzen.

De bestaande regressiesuite controleert ook de ongewijzigde formulieren, grenzen 180/181 en 300/301, lokaal controleoverzicht, corrigeren, wissen bij sluiten, rotatie en OXX Design-linkdoelen. Het externe OXX Design-doel wordt lokaal onderschept: dit is geen beschikbaarheidstest van die website.

## Publicatiepakket

De complete statische ZIP bevat vijf websitebestanden direct in de webroot:

- `index.html`
- `web/responsive.css`
- `web/responsive.js`
- `web/collection-responsive.css`
- `web/application-api.mjs`

Alle foto's en logo's zijn in HTML ingebed. Geen PHP, database, tests, documenten of Git-archief uploaden. De API-client blijft expliciet uitgeschakeld; het bestand is wel nodig om de bestaande module-import zonder fout te laden. Upload de complete `web/`-map met behoud van structuur vóór het vervangen van `index.html`. De CSS- en scriptlinks hebben cacheversie `20261118-v3-collections`.

Er is geen automatische publicatie, merge of Vimexx-deploy onderdeel van deze wijziging. De gebruiker beoordeelt screenshots en pakket vóór handmatige upload. De vermelding van privacyafspraken in antwoord 10 is uitsluitend de letterlijk aangeleverde tekst; deze wijziging stelt geen bewaartermijn vast en voegt geen gegevensverwerking toe.

## Duidelijker collectieverschil

De bestaande vier HTML-tegels worden op alle schermformaten gebruikt: één kolom op smalle telefoons, twee op bredere mobiele schermen en vier op desktop. De oorspronkelijke desktophero met logo, slogan en fotografie blijft bovenaan; de bestaande gouden afsluiter staat onder de tegels. Classic/Essential krijgen de letterlijk aangeleverde kop en tekst in hun bestaande tekstgebied, zonder een los aanvullend tekstblok. Premium en OXX Design behouden hun inhoud en bestemming.

Classic verduidelijkt OXX Engine, OXX-controle, klantbeoordeling en twee inbegrepen aanpassingsrondes. Essential benoemt persoonlijke wensen, favoriete foto's, indeling en drie rondes. Beide vermelden professionele verzorging en dat zelf ontwerpen niet nodig is. Mobiel zijn dit de bestaande HTML-intro en kenmerken. Op desktop wordt uitsluitend het oorspronkelijke raster-introgebied vervangen door een passend HTML-tekstvlak; de maskercontour blijft buiten het album en de prijs-/bedieningsgebieden. De originele afbeeldingen worden niet gewijzigd of vervangen.

`tests/collections.cjs` controleert letterlijke tegelcopy, vier zichtbare functionele tegels, header vóór de tegels op desktop, professionele verzorging, correcte rondes, geen afgekapte productintro, één FAQ met elf vragen en geen horizontale overloop. Naast de vijf basisformaten wordt 1024×768 getest om de desktopgrens te controleren. `COLLECTION_SCREENSHOTS` kiest de uitvoermap.
