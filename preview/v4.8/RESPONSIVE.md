# V4.8 responsive interface — visuele optimalisatie

Branch: `work/v48-responsive-interface`. Nulmeting: `faf2d7af9a0fc93ed5033a514fbc5d69918531d4` en het bijbehorende Chromium-bevindingenrapport.

## Huidige indeling

- Onder 600 CSS-pixels: verticale homepage en collecties met leesbare HTML-tekst en echte bediening.
- 600–1023 pixels: twee homepagekolommen, brede collectiehero en gedeelde structuur voor Classic en Essential.
- Vanaf 1024 pixels: ongewijzigde goedgekeurde desktopmasters, oorspronkelijke hotspots en bestaande Essential-correctie.
- Geen extra bovenbalk, Leesstand of Overzicht. Compacte navigatie staat binnen de collecties. Logo en home-link gaan terug naar de homepage; browser-terug/vooruit gebruikt collectiehashes.
- De homepageheader gebruikt het oorspronkelijke OXX Albums-logo met losse tekst. In telefoonlandschap is de header minder dan 130 CSS-pixels hoog, in plaats van circa 253 pixels in de nulmeting.
- Premium blijft de bestaande informatieve collectiekaart met de oorspronkelijke kenmerken, fotografie, ON HOLD-vermelding en informatievenster. Er is geen nieuwe Premium-productpagina of bestelroute.

## Oplossing van de rasterdoublures

De oorspronkelijke websiteontwerpen bevatten fotografie, teksten, prijzen, navigatie en getekende knoppen in één rasterafbeelding. De eerdere responsive versie zette leesbare HTML vóór/onder een complete kopie van dat beeld. Dat veroorzaakte herhaling en liet de kleine rastertekst zichtbaar.

De mobiele presentatie toont die complete referentiebeelden niet meer. In plaats daarvan selecteren CSS-weergavevensters nauwkeurig omschreven fotogedeelten, logo's en kenmerkeniconen uit de **bestaande, ongewijzigde bronafbeeldingen**. Er worden geen nieuwe afbeeldingbestanden gegenereerd, pixels geretoucheerd, AI-beelden gemaakt of logo's vervangen. De bronbestanden en alle ingebedde afbeeldingen blijven byte-identiek.

- Homepage: dezelfde vier collectietegels, ieder met het eigen bestaande beeld, eenmalige kenmerken en één echte HTML-actie. De bestaande goudkleurige iconen blijven zichtbaar als uitsneden zonder de ingebakken begeleidende tekst.
- Classic/Essential: gedeelde header, albumfotografie uit de eigen bestaande collectiekaart, eenmalige tekst/prijzen/Start-knop, kenmerken en een detailsectie met de eigen vuurtorenfotografie uit de oorspronkelijke master.
- Essential: mobiel uitsluitend **3 herstelrondes inbegrepen**. De oude rastervermelding **2** is geen deel van de gekozen mobiele beeldvensters. Er staat geen volledige referentieafbeelding meer onderaan waarin die fout alsnog zichtbaar is. Op desktop blijft de reeds bestaande correctie-overlay met 3 behouden.
- De selectie van fotografische regio's is een bewuste responsive hercompositie. De oorspronkelijke hele afbeeldingen blijven behouden in de desktoppresentatie en in de bron; mobiel zijn tekstregio's daaruit bewust niet zichtbaar. De volledige albums binnen de gekozen kaartfoto's blijven zichtbaar.

Prijzen, voorwaarden en productinformatie zijn inhoudelijk behouden. Alleen de goedgekeurde Essential-correctie (3 herstelrondes) wordt consequent toegepast. Informatie in een apart, door de gebruiker geopend vergelijkings- of detailvenster kan uiteraard terugkomen.

## Formulieren en veiligheid

`index.html`, inclusief beide complete ingebedde collectiedocumenten, formulieren, validatie, dialooginhoud en klantprocescode, is byte-identiek aan de nulmeting. `web/application-api.mjs` is eveneens ongewijzigd; `enabled` blijft `false` en `send()` weigert verzending. Geen betalings- of backendwijzigingen, databases, externe diensten of klantgegevens.

Het iframe gebruikt de actuele viewporthoogte en scrolt intern. Vensters kunnen ook onderaan de collectie binnen het scherm openen. Vergelijkingstabellen krijgen onder 480 pixels zichtbare collectielabels per onderdeel, met behoud van alle waarden.

## Validatie

Chromium/Playwright, met mobiele viewport-/touch-emulatie waar toepasselijk:

- Android staand: 393×852.
- Android liggend: 852×393.
- Klein Android: 320×640.
- Tablet: 768×1024.
- Desktop: 1440×900.

Gecontroleerd: vier homepagekaarten; interne home-/Classic-/Essential-navigatie; logo-teruglink; browser-terug; Premium ON HOLD; details, vergelijking en account; lege/ongeldige velden en grenzen 180/181 en 300/301; lokaal controleoverzicht/corrigeren; wissen bij sluiten; Escape; rotatie met behoud van invoer; horizontale overloop; geen JavaScript-fouten of schrijvende netwerkverzoeken. De OXX Design-links vanaf homepage en beide collecties worden aangeklikt met een door Playwright lokaal onderschepte bestemming, zodat het doelvenster werkelijk wordt gecontroleerd zonder de externe website te bezoeken. Dit is geen beschikbaarheidstest van oxxdesign.nl.

Gerichte regressiecontroles: geen volledige `.master`-referentiebeelden in de mobiele collectie; één Start-bediening; Essential alleen 3 herstelrondes in de mobiele presentatie; geen volledige oude tegelafbeelding met rastertekst naast de HTML; compacte landschapheader; minimaal 44 pixels hoge navigatievlakken.

De nieuwe screenshots komen uit werkelijk gerenderde Chromium-pagina's. De volledige iframe-opnamen worden uit ongeschaalde scrollscreenshots op hun gemeten scrollposities samengesteld; overzichten zijn uitsluitend verkleinde browseropnamen. Geen mock-ups of AI-ontwerpen.

Herhalen (Playwright en Chromium geïnstalleerd):

```sh
# Vanuit de repositoryroot in een aparte terminal:
python3 -m http.server 8765 --bind 127.0.0.1
node preview/v4.8/tests/responsive.cjs
```

Optioneel: `V48_URL`, `CHROMIUM_PATH`, `V48_SCREENSHOTS`. Testuitvoer staat standaard buiten de repository in `/tmp/v48-checks`.

## Grenzen

De oorspronkelijke kaartfoto's zijn circa 330–363 pixels breed. Ze worden niet door AI opgeschaald en kunnen op een groter tablet of een toestel met hoge pixeldichtheid wat zachter ogen dan nieuwe hoge-resolutie bronfoto's. De logo's behouden hun oorspronkelijke donkere achtergrond. Er zijn geen fysieke Android- of Windows-apparaten getest: dit is Chromium op Linux met de opgegeven viewports.

De oorspronkelijke rastertekst op desktop blijft van het bronontwerp afhankelijk; inhoudelijk is deze niet herbouwd. Mobiel worden geen kleine complete referentieontwerpen of de foutieve Essential-vermelding meer aangeboden. Livewebsite, main en Vimexx blijven onaangeroerd; uitsluitend de ontwikkelbranch mag worden gepusht.
