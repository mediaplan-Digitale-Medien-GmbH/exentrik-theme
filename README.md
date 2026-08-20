# Exentrik (Schompi Trading)

Shopify-Theme für **exentrik.com** (Schompi Trading), gestartet aus dem mediaplan Shopify Theme-Rohling.

Stil: Merch-Shop in der Richtung von EMP (kräftig, dunkler Header, Schwarz/Weiß/Rot, Gelb nur als kleiner Logo-Akzent) – nicht 1:1 kopiert.

## Hero Kacheln

Die Startseite nutzt die Sektion **Hero Kacheln**: ein Bento-Raster, jede Kachel mit Bild, Badge, Text und CTA. Mehrere Slides werden zum Karussell. Bilder im Theme-Editor nachziehen.

## Metafelder der Kategorie

Was auf der Produktseite die Metafeld-Blöcke leisten, übernimmt auf der Kategorieseite die Sektion **Kategorie-Details**, etwa für Material, Größenhinweise oder ein Datenblatt. Sie wird im Editor hinzugefügt, verschoben und bei Bedarf mehrfach verwendet.

1. Admin → Einstellungen → Benutzerdefinierte Daten → **Kategorien**, Felder anlegen.
2. Werte je Kategorie unter Produkte → Kategorien → Metafelder pflegen.
3. Theme Editor → Kategorieseite → Abschnitt hinzufügen → **Kategorie-Details**, pro Feld einen Block mit Anzeigename, Namespace und Key.

Darstellung als Tabelle, Kacheln oder kompakte Zeile. Listen, Bilder, Dateien, Links, Ja/Nein und Datum werden passend formatiert. Leere Felder bleiben im Shop unsichtbar, im Editor stehen sie als „ohne Angabe“ da. Ist für eine Kategorie nichts gepflegt, verschwindet die Sektion dort komplett.

## Seiten bauen

Die Seitenvorlage ist ein Baukasten. Ohne Blöcke zeigt sie wie bisher Titel und Inhalt aus dem Admin, mit Blöcken lassen sich Bausteine frei kombinieren und sortieren:

| Block | Wofür |
|---|---|
| **Seiteninhalt aus dem Admin** | Der Text, der unter Onlineshop, Seiten steht, an beliebiger Stelle |
| **Überschrift / Text** | Zwischenüberschriften und Absätze direkt im Editor |
| **Bild** | Mit optionaler Bildunterschrift, volle Spaltenbreite |
| **Video** | Shopify-Video, MP4-Adresse oder YouTube und Vimeo, wahlweise mit Bedienelementen oder stumm im Autoplay |
| **Metafeld der Seite** | Werte aus Einstellungen, Benutzerdefinierte Daten, Seiten |
| **Button, Trennlinie** | Handlungsaufruf und Gliederung |

Die Einstellungen der Vorlage gelten für alle Seiten, die sie nutzen. Für eine Seite mit eigenem Aufbau im Editor oben die Vorlage duplizieren und der Seite zuweisen. Mitgeliefert ist dafür die Vorlage **baukasten** als fertiges Beispiel mit Inhalt, Bild, Text, Video und Metafeld. Über **Breite** steht der Text entweder in angenehmer Lesebreite oder über die volle Spalte.

Rechtstexte bekommen eine eigene Vorlage: **widerruf** (`templates/page.widerruf.json`). Sie zeigt Titel und Inhalt der Seite in Lesebreite, ohne zusätzliche Blöcke, damit der Text so erscheint, wie er im Admin oder von einem Rechtstexte-Dienst hinterlegt ist. Beim Anlegen der Seite unter Onlineshop, Seiten rechts unter Theme-Vorlage **widerruf** auswählen.

## Git / Shopify

- Repo-Root = Theme-Root
- Branches: `main` (Live), `staging` (Preview)
- Repo: https://github.com/mediaplan-Digitale-Medien-GmbH/exentrik-theme

## Start

1. In Shopify GitHub anbinden (`staging` zuerst).
2. Logo liegt als Fallback in `assets/logo-exentrik.png` – zusätzlich im Editor hochladen, Favicon setzen.
3. Kachel-Bilder und Links im Hero befüllen.
4. Menüs (`main-menu`, `footer`) und Kollektionen pflegen.
