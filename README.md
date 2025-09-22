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

## 🔍 Problembehandlung

### TTS funktioniert nicht
1. **TTS-Test** ausführen → Diagnostics prüfen
2. **URL korrekt?** (https://api.openai.com)
3. **API Key gültig?** 
4. **Modell unterstützt?** (`tts-1` verwenden)
5. **Netzwerk-Firewall?**

### 3D Avatar wird nicht angezeigt
1. **WebGL aktiviert?** im Browser
2. **Three.js Loader** verfügbar?
3. **OBJ-Dateien** vorhanden?
4. **Browser-Konsole** für Fehler prüfen

### Spracheingabe funktioniert nicht
1. **Mikrofon-Berechtigung** erteilt?
2. **HTTPS-Verbindung?** (für Web Speech API erforderlich)
3. **Browser unterstützt** Web Speech API?
4. **Sprache korrekt** eingestellt?

### OpenWebUI Verbindung
1. **URL erreichbar?** (Ping testen)
2. **API Key korrekt?**
3. **CORS aktiviert?** in OpenWebUI
4. **Firewall/Proxy** blockiert?

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

### Debug-Modus aktivieren
```javascript
window.avatarChatUI.debug = true;
```

### Logging Level ändern
```json
{
  "logging": {
    "level": "debug"
  }
}
```

### Neue TTS-Engine hinzufügen
1. `backend/api.js` - TTS-Endpoint erweitern
2. OpenAI-kompatible API implementieren
3. Diagnostics für neue Engine hinzufügen

### Custom Avatar-Modelle
1. 3D-Modelle in `frontend/assets/avatars/3d/` ablegen
2. OBJ oder GLB Format verwenden
3. Morph-Targets für Emotionen definieren

## 🚀 Neue Features in v6

### Backend-Verbesserungen
- **Enhanced API** mit besserer Fehlerbehandlung
- **Conversation History** Management
- **Detaillierte TTS-Diagnostics** 
- **Model Discovery** Endpoints
- **Improved Logging** System
- **Health Checks** für alle Services

### Frontend-Verbesserungen
- **Speech Recognition** Integration
- **Enhanced 2D Avatar** mit Emotionen
- **Improved 3D Avatar** mit Three.js r128
- **Real-time Diagnostics** UI
- **Better Error Handling**
- **Responsive Design** Updates

### UX/UI-Verbesserungen
- **Modern Dark Theme** mit Gradients
- **Animated Transitions** und Feedback
- **Keyboard Shortcuts** Support
- **Status Notifications** System
- **Loading Indicators** 
- **Connection Monitoring**

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

### TTS Test Endpoint
```http
POST /api/test/tts
Content-Type: application/json

{
  "url": "https://api.openai.com",
  "key": "sk-...",
  "model": "tts-1",
  "voice": "alloy"
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

## 🎨 Customization

### Avatar-Appearance
```javascript
// Avatar-Einstellungen ändern
window.setAvatarSettings({
  skin_color: "#f2d0b3",
  hair_color: "#2b1b12",
  type: "3d",
  quality: "high"
});
```

### TTS-Konfiguration
```javascript
// TTS-Parameter anpassen
const ttsConfig = {
  speed: 1.2,
  voice: "nova",
  model: "tts-1-hd"
};
```

### Emotion-Mapping
```javascript
// Custom Emotion-Erkennung
const emotionMap = {
  "glücklich|freude": "freude",
  "traurig|trauer": "traurig",
  "wütend|ärger": "wütend"
};
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

## 📊 Performance

### Optimierungen
- **Three.js r128** für bessere 3D-Performance
- **Canvas 2D** optimiert für 2D-Avatar
- **Audio Streaming** für TTS
- **Lazy Loading** für 3D-Modelle

### Monitoring
- **Connection Status** Anzeige
- **Response Time** Tracking
- **Error Rate** Monitoring
- **Memory Usage** (Browser DevTools)

## 🔄 Updates & Migration

### Von v5 auf v6
1. **Backup** der config.json erstellen
2. **Code aktualisieren** 
3. **Dependencies installieren**
4. **Konfiguration überprüfen**
5. **Tests durchführen**

### Breaking Changes
- **Three.js** Version auf r128 aktualisiert
- **API Endpoints** erweitert
- **Config Schema** verändert
- **Avatar Settings** Format geändert

## 🤝 Contributing

### Entwicklung
1. **Fork** des Repositories
2. **Feature Branch** erstellen
3. **Changes implementieren**
4. **Tests durchführen**
5. **Pull Request** stellen

### Bug Reports
- **Issue Template** verwenden
- **Logs** anhängen
- **Browser/OS** angeben
- **Reproduktionsschritte** beschreiben

## 📞 Support

### Hilfe erhalten
- **GitHub Issues** für Bugs
- **Discussions** für Fragen
- **Wiki** für Dokumentation
- **Discord** für Community-Support

### Known Issues
- **CapsuleGeometry** nicht in Three.js r128
- **CORS** Probleme bei localhost
- **Safari** Speech Recognition limitiert
- **Mobile** Touch-Gesten fehlen noch

## 🗺️ Roadmap

### v6.1 (geplant)
- [ ] **TypeScript** Migration
- [ ] **Unit Tests** implementieren
- [ ] **PWA** Support
- [ ] **Mobile** Optimierungen

### v6.2 (geplant)
- [ ] **Voice Commands** 
- [ ] **Avatar Expressions** API
- [ ] **Multi-Language** UI
- [ ] **Themes** System

### v7.0 (Zukunft)
- [ ] **WebRTC** Integration
- [ ] **AI Voice Cloning**
- [ ] **VR/AR** Support
- [ ] **Plugin System**

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei für Details.

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