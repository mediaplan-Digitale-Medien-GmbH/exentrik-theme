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

## Produktbilder

Theme Editor, Produktvorlage, Sektion **Produkt**, Bereich **Produktbilder**:

| Einstellung | Wirkung |
|---|---|
| **Bildformat** | Wie hochgeladen, quadratisch 1:1, hoch 4:5 oder 3:4, quer 4:3 oder 16:9. Alle Bilder der Galerie bekommen dasselbe Format, dadurch springt die Seite beim Blättern nicht. |
| **Bild im Format** | Format füllen schneidet die Ränder ab. Vollständig zeigen legt das ganze Bild ins Format und lässt seitlich Fläche frei, die sichere Wahl bei Freistellern und Verpackungsfotos. |
| **Vorschaubilder pro Reihe** | Drei bis sechs Miniaturen unter dem großen Bild. |

Mit **Wie hochgeladen** behält jedes Bild sein eigenes Seitenverhältnis. Das Format der Produktkarten in Listen und Rastern steht davon getrennt in den Theme-Einstellungen unter Produktkarten.

## Seiten bauen

Jede Seite hat oben ihr Inhaltsfeld aus dem Admin. Steht dort Text, erscheint er über allem anderen, ist das Feld leer, wird nichts angezeigt und es entsteht auch keine Lücke. Darunter lässt sich die Seite mit Blöcken erweitern:

Die Ausrichtung steuert jede Textsektion selbst. **Seite** und **Textabschnitt** haben dafür die Einstellung **Ausrichtung** mit Links, Mitte und Rechts, damit Titel und Text darunter zusammenpassen. Über **Abstand oben** lässt sich der Freiraum über dem Seitentitel auf Klein oder Ohne stellen, wenn darüber schon ein anderer Baustein steht.

| Block | Wofür |
|---|---|
| **Seiteninhalt aus dem Admin** | Nur nötig, wenn der Text nicht oben, sondern zwischen den Blöcken stehen soll |
| **Überschrift / Text** | Zwischenüberschriften und Absätze direkt im Editor |
| **Bild** | Mit optionaler Bildunterschrift, volle Spaltenbreite |
| **Video** | Shopify-Video, MP4-Adresse oder YouTube und Vimeo, wahlweise mit Bedienelementen oder stumm im Autoplay |
| **Metafeld der Seite** | Werte aus Einstellungen, Benutzerdefinierte Daten, Seiten |
| **Button, Trennlinie** | Handlungsaufruf und Gliederung |

Auch die gestalteten Vorlagen wie Kontakt haben das Inhaltsfeld, dort ohne Seitentitel, weil sie schon eine eigene Überschrift mitbringen. Die Einstellungen der Vorlage gelten für alle Seiten, die sie nutzen. Für eine Seite mit eigenem Aufbau im Editor oben die Vorlage duplizieren und der Seite zuweisen. Über **Breite** steht der Text entweder in angenehmer Lesebreite oder über die volle Spalte.

Rechtstexte bekommen eine eigene Vorlage: **widerruf** (`templates/page.widerruf.json`). Sie zeigt Titel und Inhalt der Seite in Lesebreite, ohne zusätzliche Blöcke, damit der Text so erscheint, wie er im Admin oder von einem Rechtstexte-Dienst hinterlegt ist. Beim Anlegen der Seite unter Onlineshop, Seiten rechts unter Theme-Vorlage **widerruf** auswählen.

## Git / Shopify

- Repo-Root = Theme-Root
- Branches: `main` (Live), `staging` (Preview)
- Repo: https://github.com/mediaplan-Digitale-Medien-GmbH/exentrik-theme

## Seitenvorlagen und Rechtstexte

Fertige Vorlagen mit festem Suffix: `impressum`, `datenschutz`, `agb`, `widerruf`, `versand`, `zahlung`, dazu `contact` und `baukasten`. Die Rechtstext-Vorlagen zeigen Titel und Inhalt der Seite in Lesebreite.

Hintergrund ist eine Falle in Shopify: Steht bei einer Seite im Admin unter **Theme-Vorlage** ein Suffix, das das aktive Theme nicht als Datei hat, rendert Shopify die Seite **leer**. Kopf und Fuß erscheinen, der Inhalt fehlt, ohne Fehlermeldung und ohne Rückfall auf die Standardvorlage. Prüfen unter Admin → Onlineshop → Seiten → Seite öffnen → rechts **Theme-Vorlage**.

Rechtstexte aus Einstellungen → Richtlinien laufen über `/policies/...` und bringen eigenes Markup mit. Dafür sorgt `.shopify-policy__container` in `base.css` für Lesebreite und Abstände.

## Von Staging nach Live

Der Shop hängt an `main`. Alles, was im Theme-Editor eingestellt wird, landet als Commit von `shopify[bot]` direkt dort. Entwickelt wird auf `staging`. Übertragen mit:

```bash
python3 deploy.py          # Vorschau: was kommt aus dem Shop, was würden wir überschreiben
python3 deploy.py --push   # holen, zusammenführen, prüfen, pushen
```

Das Skript holt zuerst den Stand aus dem Shop, führt ihn in `staging` zusammen, prüft das Theme und schreibt erst dann nach `main`. Es pusht nie mit Gewalt und bricht bei einem Konflikt in einer Inhaltsdatei ab, statt eine Seite zu bevorzugen.

Diese Dateien schreibt der Theme-Editor, sie gehören dem Shop: `templates/*.json` (Aufbau der Seiten), `sections/*-group.json` (Kopf und Fuß), `config/settings_data.json` (Farben, Schriften, Logo), `locales/*.json` (im Editor geänderte Texte). Neue Funktionen kommen deshalb als neue Sektion oder als neuer Block dazu und werden im Editor eingesetzt, statt bestehende Vorlagen zu überschreiben. Vor größeren Eingriffen im Admin unter Onlineshop → Themes das Live-Theme duplizieren, das ist ein vollständiger Schnappschuss aller Inhalte.

Neue Einstellungen erscheinen im Theme Editor erst nach einem Neuladen der Seite. Wer den Editor während eines Updates offen lässt, arbeitet mit dem alten Stand und schreibt beim Speichern unter Umständen leere Werte in die Vorlage. Nach jedem Push den Editor einmal neu laden.

## Start

1. In Shopify GitHub anbinden (`staging` zuerst).
2. Logo liegt als Fallback in `assets/logo-exentrik.png` – zusätzlich im Editor hochladen, Favicon setzen.
3. Kachel-Bilder und Links im Hero befüllen.
4. Menüs (`main-menu`, `footer`) und Kollektionen pflegen.
