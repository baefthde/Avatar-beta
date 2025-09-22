# Avatar Chat UI v6 - Enhanced 🚀

Eine fortschrittliche Chat-Benutzeroberfläche mit KI-Avatar, Spracherkennung, Text-zu-Sprache und erweiterten 3D-Funktionen.

## ✨ Neue Features

### 🎤 Spracheingabe
- **Web Speech API** Integration
- Unterstützung für **mehrere Sprachen** (Deutsch, Englisch, Französisch, Spanisch)
- **Echtzeit-Transkription** mit visueller Rückmeldung
- **Mikrofon-Button** mit Recording-Indikator

### 🔊 Erweiterte Text-zu-Sprache (TTS)
- **OpenAI-kompatible** TTS-Engines
- **Detaillierte Diagnostics** für TTS-Probleme
- **Geschwindigkeitseinstellungen** (0.25x - 4.0x)
- **Mehrere Stimmen** unterstützt
- **Audio-Wiedergabe** mit Fehlerbehandlung

### 👤 Verbesserter Avatar
- **2D Avatar**: Erweiterte Emotionen, Atmung, Augenzwinkern
- **3D Avatar**: Three.js Integration, Morphing, Animationen
- **Emotion-Engine**: 6 verschiedene Emotionen
- **Qualitätseinstellungen**: Low, Medium, High
- **Echtzeit-Switching** zwischen 2D/3D

### 🤖 KI-Integration
- **Verbesserte OpenWebUI** Anbindung
- **Conversation History** mit 20 Nachrichten
- **System Prompts** für Avatar-Persönlichkeit
- **Streaming Support** vorbereitet
- **Error Recovery** und Retry-Logic

### 🔧 Diagnostics & Debugging
- **Umfangreiche TTS-Tests** mit Audio-Output
- **OpenWebUI Connectivity Tests**
- **Real-time Diagnostics** Grid
- **Enhanced Logging** mit Rotation
- **Model Discovery** für TTS

### 💬 Chat-Verbesserungen
- **Message Formatting** (Bold, Italic, Code)
- **Status-Nachrichten** mit Auto-Dismiss
- **Conversation Export/Import**
- **Keyboard Shortcuts** (Ctrl+1/2/D)
- **Connection Monitoring**

## 🛠️ Installation

### Voraussetzungen
```bash
- Node.js >= 14.0.0
- NPM >= 6.0.0
- Moderner Browser mit WebGL-Support
```

### Schnellstart
```bash
git clone https://github.com/baefthde/Avatar-beta.git
cd Avatar-beta
chmod +x install.sh
./install.sh
npm start
```

### Manuelle Installation
```bash
# Dependencies installieren
cd backend && npm install

# Server starten
npm start

# Browser öffnen
open http://localhost:3000
```

## ⚙️ Konfiguration

### OpenWebUI Setup
1. **URL**: Ihre OpenWebUI-Instanz (z.B. `https://localhost:443`)
2. **API Key**: Ihr OpenWebUI API-Schlüssel
3. **Model**: Standard-Modell (z.B. `gpt-4o-mini`)

### TTS Setup
1. **Engine URL**: OpenAI-kompatible TTS-Engine
2. **API Key**: TTS-API-Schlüssel
3. **Model**: TTS-Modell (z.B. `tts-1`)
4. **Voice**: Stimme (alloy, echo, fable, onyx, nova, shimmer)

### Avatar Konfiguration
1. **Typ**: 2D oder 3D Avatar wählen
2. **Qualität**: Low/Medium/High für 3D
3. **Erscheinung**: Haut-/Haarfarbe anpassen
4. **Persönlichkeit**: System-Prompt definieren

## 🎯 Verwendung

### Grundfunktionen
- **Text eingeben** und Enter drücken
- **Mikrofon-Button** für Spracheingabe
- **Avatar reagiert** auf Emotionen
- **TTS spielt** Antworten ab

### Erweiterte Features
- **Ctrl+1**: Systemeinstellungen öffnen
- **Ctrl+2**: Avatar-Einstellungen öffnen
- **Ctrl+D**: Unterhaltung löschen
- **Esc**: Panels schließen

### Diagnostics verwenden
1. **Test OpenWebUI**: Verbindung testen
2. **Test TTS**: Audio-Ausgabe testen
3. **TTS Modelle**: Verfügbare Modelle anzeigen
4. **Logs anzeigen**: System- oder All-Logs


## 📁 Dateistruktur

```
Avatar-beta/
├── backend/
│   ├── server.js          # Express Server
│   ├── api.js            # API Routen (Enhanced)
│   ├── config.json       # Konfiguration (Enhanced)
│   ├── package.json      # Dependencies (Enhanced)
│   ├── system.log        # System Logs
│   └── all.log          # All Logs
├── frontend/
│   ├── index.html        # Hauptseite (Enhanced)
│   ├── css/
│   │   └── style.css     # Styles (Enhanced)
│   ├── js/
│   │   ├── main.js       # Hauptlogik (Enhanced)
│   │   ├── avatar2d.js   # 2D Avatar (Enhanced)
│   │   └── avatar3d.js   # 3D Avatar (Enhanced)
│   └── assets/
│       └── avatars/
│           └── 3d/       # 3D Modelle
├── install.sh            # Installation Script
└── README.md            # Diese Datei
```

## 🔧 Entwicklung




### Neue TTS-Engine hinzufügen
1. `backend/api.js` - TTS-Endpoint erweitern
2. OpenAI-kompatible API implementieren
3. Diagnostics für neue Engine hinzufügen

## 📋 API-Dokumentation

### Chat Endpoint
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Hallo Avatar",
  "model": "gpt-4o-mini",
  "conversation_id": "12345",
  "history": [...]
}
```

### Configuration Endpoint
```http
GET /api/config
POST /api/config
```

### Logging Endpoints
```http
GET /api/logs/system
GET /api/logs/all
POST /api/log/system
POST /api/log/all
```



## 🔒 Sicherheit

### HTTPS-Anforderungen
- **Web Speech API** funktioniert nur über HTTPS
- **Mikrofon-Zugriff** erfordert sichere Verbindung
- **Service Worker** für Offline-Funktionalität

### API-Schlüssel Schutz
- **Umgebungsvariablen** für Produktionseinsatz
- **Rate Limiting** aktivieren
- **CORS konfigurieren**

### Datenschutz
- **Lokale Speicherung** von Einstellungen
- **Keine Audioaufzeichnung** auf Server
- **Conversation History** optional

## 🧪 Testing

### Manuelle Tests
1. **OpenWebUI**: Test-Button verwenden
2. **TTS**: Audio-Output prüfen  
3. **Speech**: Mikrofon-Test durchführen
4. **Avatar**: Emotion-Preview nutzen

### Automatisierte Tests
```bash
# Unit Tests (geplant)
npm test

# API Tests (geplant)  
npm run test:api

# Frontend Tests (geplant)
npm run test:frontend
```

## 👥 Team

- **Hauptentwicklung**: Avatar Chat UI Team
- **3D Graphics**: Three.js Community
- **TTS Integration**: OpenAI API
- **UI/UX Design**: Community Contributors

## 🙏 Danksagungen

- **Three.js** für 3D-Engine
- **OpenWebUI** für AI-Integration  
- **Web Speech API** für Browser-Features
- **Community** für Feedback und Beiträge

---

**Made with ❤️ for the AI Avatar Community**

*Letzte Aktualisierung: Dezember 2024 - Version 6.0 Enhanced*
