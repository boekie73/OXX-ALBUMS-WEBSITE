# V4.8 responsive interface

Uitsluitend V4.8 op `work/v48-responsive-interface`; geen hosting-, database- of backendwijzigingen.

## Indeling

- Onder 600 CSS-pixels: verticale homepage en collecties, leesbare HTML-tekst en bediening.
- 600–1023 pixels: twee kolommen voor homepagekaarten en collectie-informatie, ook in telefoonlandschap.
- Vanaf 1024 pixels: bestaande volledige desktopontwerpen met hun navigatiehotspots.
- Geen extra mobiele bovenbalk, Leesstand of Overzicht. De navigatie staat in het collectieontwerp; browser-terug/vooruit werkt via de collectiehash.
- Het collectie-iframe gebruikt de actuele viewporthoogte en scrolt zelf. Daardoor kunnen informatievensters ook onderaan een lange collectiepagina binnen het scherm openen. Tabellen krijgen op smallere schermen afbreekbare cellen.
- Formulieren, validatie, lokale controle/samenvatting en wissen bij sluiten blijven de bestaande implementatie gebruiken. Publieke verzending blijft uitgeschakeld. Premium blijft uitsluitend informatief en niet bestelbaar.

## Afbeeldingen en concrete beperkingen

De goedgekeurde Classic- en Essential-pagina's zijn rasterafbeeldingen: navigatie, koppen, beschrijvingen, prijzen, kenmerken en knoppen zitten in de pixels. CSS kan die tekst niet laten omlopen. Alleen verkleinen zou op 360 pixels tekst van ongeveer 5–8 pixels opleveren. Daarom heeft de mobiele/tabletweergave leesbare HTML-equivalenten van de zichtbare producttekst en knoppen; details, voorwaarden en prijzen in informatievensters blijven behouden.

De volledige originele collectieafbeelding staat ongesneden onder die HTML-informatie als referentie, expliciet met bijschrift. **De ingebakken tekst in deze referentieafbeelding is op telefoons nog klein en niet zelfstandig goed leesbaar.** Dit is geen volledig herbouwde fotografische compositie. De productinformatie is erboven en in de bestaande informatievensters leesbaar beschikbaar. Een volledig heringedeeld ontwerp met losse foto's en logo's vereist oorspronkelijke losse ontwerpbestanden; die ontbreken in deze repository.

Essential bevat in de rastermaster foutief **2 herstelrondes**. De bestaande desktop-overlay corrigeert dit naar **3**; de responsive HTML en het bestaande detailvenster vermelden eveneens 3. De ongewijzigde referentieafbeelding zelf bevat nog 2. Dat beeld is bewust niet stilzwijgend aangepast.

De mobiele homepage gebruikt de reeds bestaande uitsneden: header 512×360, Classic/Premium 363×401, Essential 359×401 en Design 330×401. De header bevat slechts het oorspronkelijke logo/tekstgedeelte, niet de volledige brede homepagefoto. Deze bronuitsneden blijven ongewijzigd en worden volledig getoond; de kaartteksten zijn aanvullend in HTML beschikbaar. De desktophomepage behoudt de brede originele afbeelding. Premium heeft in V4.8 geen zelfstandige collectiepagina: de bestaande kaart en het informatievenster blijven behouden, met een leesbare ON HOLD-vermelding bij de mobiele kaart.

Alle ingebedde afbeeldingsgegevens en beide oorspronkelijke collectie-HTML-documenten zijn byte voor byte vergeleken met de uitgangscommit en behouden. Geen afbeeldingen of logo's gegenereerd of bewerkt. De bestaande donkerblauwe/gouden kleuren worden gebruikt.

## Controle

Uitgevoerd in lokaal headless Chromium, met Playwright op CSS-viewports 360×800, 412×915, 800×360, 915×412, 1024×768 en 1440×900. Dit is browseremulatie, geen test op fysieke Android- of Windows-apparaten.

Gecontroleerd: homepage, Classic/Essential-routes, Premium vanaf homepage en collectie, details/vergelijking/account, validatie van lege velden en limieten 180/181 en 300/301, controleoverzicht/corrigeren, wissen bij sluiten, Escape, browser-terug en interne home-navigatie, horizontale overloop en ontbreken van JavaScript-fouten en schrijvende netwerkverzoeken. Daarnaast rotatie met een geopend formulier en behoud van invoer. Screenshots van homepage, collectie en formulier zijn lokaal visueel bekeken; afbeeldingen en formulierinhoud blijven via verticaal scrollen bereikbaar.

Herhalen (Playwright en Chromium vereist):

```sh
# Vanuit repositoryroot, in een aparte terminal:
python3 -m http.server 8765 --bind 127.0.0.1
node preview/v4.8/tests/responsive.cjs
```

Optioneel: `V48_URL`, `CHROMIUM_PATH`, `V48_SCREENSHOTS`. Screenshots gaan standaard naar `/tmp/v48-checks`, buiten de repository. Geen externe dienst of hosting nodig.
