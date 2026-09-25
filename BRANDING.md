# Branding-Anpassungen

## Übersicht

SYNDOC bietet die Möglichkeit, das Erscheinungsbild der Anwendung vollständig anzupassen:
- **Logo**: Wird im Login-Bildschirm angezeigt
- **Favicon**: Browser-Tab-Icon
- **App-Name**: Titel der Anwendung

## Einstellungen öffnen

1. Mit Administrator-Zugangsdaten anmelden
2. Einstellungen öffnen (Zahnrad-Symbol)
3. Zum Tab **"Branding"** navigieren

## Logo hochladen

### Empfohlene Spezifikationen
- **Format**: SVG (bevorzugt), PNG, JPEG oder WebP
- **Größe**: Max. 2 MB
- **Abmessungen**: Empfohlen 200x80 Pixel (Breite x Höhe)
- **Transparenz**: Unterstützt bei SVG und PNG

### Upload
1. Auf **"Hochladen"** im Logo-Bereich klicken
2. Datei auswählen
3. Vorschau wird sofort angezeigt
4. Mit **"Speichern"** bestätigen

### Logo entfernen
- Klick auf das **X**-Symbol in der Vorschau
- Standardlogo wird wiederhergestellt

## Favicon hochladen

### Empfohlene Spezifikationen
- **Format**: SVG (bevorzugt), PNG oder ICO
- **Größe**: Max. 2 MB
- **Abmessungen**: 32x32 oder 48x48 Pixel (quadratisch)
- **Transparenz**: Unterstützt

### Upload
1. Auf **"Hochladen"** im Favicon-Bereich klicken
2. Datei auswählen
3. Vorschau wird sofort angezeigt
4. Mit **"Speichern"** bestätigen

### Favicon entfernen
- Klick auf das **X**-Symbol in der Vorschau
- Standard-Favicon wird wiederhergestellt

## App-Name ändern

1. Namen im Textfeld **"App-Name"** eingeben
2. Max. 32 Zeichen
3. Mit **"Speichern"** bestätigen
4. Name erscheint im:
   - Browser-Tab-Titel
   - Login-Bildschirm
   - Navigation

## Speicherung

Nach dem Klick auf **"Speichern"**:
1. Änderungen werden gespeichert
2. Seite wird automatisch neu geladen
3. Neues Branding ist sofort sichtbar

## Technische Details

### Dateispeicherung
```
vault/
└── .scribedog/
    └── server/
        ├── branding.json      # Konfiguration
        └── uploads/           # Hochgeladene Dateien
            ├── logo-*.{svg,png,jpg}
            └── favicon-*.{svg,png,ico}
```

### branding.json Format
```json
{
  "appName": "SYNDOC",
  "logoUrl": "/api/branding/uploads/logo-1234567890.svg",
  "faviconUrl": "/api/branding/uploads/favicon-1234567890.svg"
}
```

### API-Endpoints

#### GET /api/branding
Lädt aktuelle Branding-Konfiguration
```bash
curl http://localhost:3000/api/branding
```

#### POST /api/branding
Speichert neue Branding-Konfiguration (multipart/form-data)
```bash
curl -X POST http://localhost:3000/api/branding \
  -F "appName=MeinApp" \
  -F "logo=@/pfad/zu/logo.svg" \
  -F "favicon=@/pfad/zu/favicon.svg" \
  -H "Cookie: sid=..."
```

#### GET /api/branding/uploads/:filename
Liefert hochgeladene Dateien aus
```bash
curl http://localhost:3000/api/branding/uploads/logo-1234567890.svg
```

## Troubleshooting

### Logo wird nicht angezeigt
- Dateiformat überprüfen (SVG, PNG, JPEG, WebP)
- Dateigröße unter 2 MB?
- Browser-Cache leeren (Strg+F5)

### Favicon wird nicht aktualisiert
- Browser-Cache leeren
- Tab schließen und neu öffnen
- Browser neu starten

### Branding-Einstellungen nicht verfügbar
- Nur im Web-Modus verfügbar (Server-Edition)
- Mit Session-Cookie angemeldet sein
- Als Administrator angemeldet

### Speichern schlägt fehl
- Internetverbindung prüfen
- Als Administrator angemeldet?
- Dateigröße unter 2 MB?
- Logs im Browser-DevTools prüfen

## Best Practices

### Logo-Design
- **Einfarbig**: Funktioniert in Hell- und Dunkelmodus
- **SVG**: Skaliert perfekt, kleine Dateigröße
- **Kontrast**: Gut lesbar auf hellem und dunklem Hintergrund
- **Kein Text**: Logo sollte erkennbar sein, Text separat

### Favicon-Design
- **Einfach**: Erkennbar auch bei 16x16 Pixeln
- **Quadratisch**: Gleiche Breite und Höhe
- **Hoher Kontrast**: Gut sichtbar in Browser-Tab
- **SVG oder PNG**: Moderne Formate bevorzugen

### App-Name
- **Kurz**: Max. 20 Zeichen empfohlen
- **Prägnant**: Leicht zu merken
- **Keine Sonderzeichen**: A-Z, 0-9, Leerzeichen
- **Sprachunabhängig**: International verständlich

## Beispiel-Workflow

### Komplettes Rebranding
1. Anmelden als Administrator
2. Einstellungen → Branding
3. App-Name ändern: `"SYNDOC"` → `"MeineDocs"`
4. Logo hochladen: `firmenlogo.svg`
5. Favicon hochladen: `icon.png`
6. Speichern klicken
7. Seite lädt neu mit neuem Branding

### Nur App-Name ändern
1. Einstellungen → Branding
2. App-Name ändern
3. Speichern
4. Fertig (kein File-Upload nötig)

## Sicherheit

- **Authentifizierung**: Nur angemeldete Nutzer können Branding ändern
- **File-Validierung**: Nur Bild-Formate erlaubt
- **Größenlimit**: Max. 2 MB pro Datei
- **Isolierte Speicherung**: Uploads außerhalb des Vault-Bereichs
- **Keine Skript-Ausführung**: Dateien werden als Bilder geliefert
