// Version 1.0

const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const router = express.Router();
const configPath = path.join(__dirname, 'config.json');

function readConfig() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        // Validierung hinzufügen
        if (!config.openwebui_timeout) config.openwebui_timeout = 20000;
        return config;
    } catch(e) {
        console.error('Fehler beim Lesen der Konfiguration:', e);
        return {openwebui_timeout: 20000}; // Standardwerte
    }
}

function ensureLogFiles() {
    const files = ['system.log', 'all.log'];
    try {
        files.forEach(file => {
            const filePath = path.join(__dirname, file);
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, '', 'utf-8');
            }
        });
    } catch(e) {
        console.error('Fehler beim Erstellen der Log-Dateien:', e);
    }
}

function logToFile(filename, message, details = '') {
    try {
        const entry = `[${new Date().toISOString()}] ${message}\n${details ? details + '\n' : ''}`;
        const filePath = path.join(__dirname, filename);
        fs.appendFileSync(filePath, entry, 'utf-8');
    } catch(e) {
        console.error('Logging failed:', e);
    }
}

// Chat endpoint with conversation history support
router.post('/chat', async (req, res) => {
    const { message, model, conversation_id, history = [] } = req.body;
    const cfg = readConfig();
    const url = cfg.openwebui_url;
    const apiKey = cfg.openwebui_api_key;
    
    if (!url || !apiKey) {
        logToFile('system.log', 'Chat request failed: OpenWebUI not configured');
        return res.status(500).json({ error: "OpenWebUI URL or API key not configured" });
    }
    
    try {
        // Build message history for conversation context
        const messages = [...history];
        if (message) {
            messages.push({role: "user", content: message});
        }
        
        const requestBody = {
            model: model || cfg.default_model || "gpt-4o-mini",
            messages: messages,
            max_tokens: 512,
            temperature: 0.7,
            stream: false
        };
        
        logToFile('system.log', `Chat request to ${url}`, `Model: ${requestBody.model}, Messages: ${messages.length}`);
        
        const resp = await fetch(`${url.replace(/\/$/,'')}/api/chat/completions`, {
            method: 'POST',
            headers: { 
                'Content-Type':'application/json', 
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!resp.ok) {
            const errorText = await resp.text();
            logToFile('system.log', `OpenWebUI error ${resp.status}`, errorText);
            return res.status(resp.status).json({ 
                error: "OpenWebUI error", 
                details: errorText,
                status: resp.status 
            });
        }
        
        const data = await resp.json();
        let replyText = "";
        
        if (Array.isArray(data.choices) && data.choices.length > 0) {
            replyText = data.choices[0].message?.content || data.choices[0].text || JSON.stringify(data.choices[0]);
        } else if (data.reply) {
            replyText = data.reply;
        } else {
            replyText = JSON.stringify(data);
        }
        
        // Enhanced emotion detection
        const lower = (replyText || '').toLowerCase();
        let emotion = "normal";
        
        if (lower.match(/\b(glücklich|freude|freu|haha|lach|:\)|😊|😄|toll|super|prima)\b/)) {
            emotion = 'freude';
        } else if (lower.match(/\b(traurig|trauer|😢|😭|schade|bedauer|tut.*leid)\b/)) {
            emotion = 'traurig';
        } else if (lower.match(/\b(wüt|ärger|sauer|😠|😡|verdammt|ärgerlich)\b/)) {
            emotion = 'wütend';
        } else if (lower.match(/\?|hmm|überlegen|denk|🤔|interessant|verstehe/)) {
            emotion = 'denkend';
        } else if (lower.match(/\b(überrascht|wow|oh|😮|😲|unglaublich|erstaunlich)\b/)) {
            emotion = 'überrascht';
        }
        
        // Update conversation history
        const updatedHistory = [
            ...messages,
            {role: "assistant", content: replyText}
        ];
        
        logToFile('system.log', `Chat response generated`, `Emotion: ${emotion}, Length: ${replyText.length} chars`);
        
        return res.json({ 
            reply: replyText, 
            emotion,
            conversation_id: conversation_id || Date.now().toString(),
            history: updatedHistory.slice(-20) // Keep last 20 messages
        });
        
    } catch (err) {
        console.error("Error contacting OpenWebUI:", err);
        logToFile('system.log', 'Chat error', err.toString());
        return res.status(500).json({ 
            error: "Communication error with OpenWebUI", 
            details: err.toString() 
        });
    }
});

// Configuration endpoints
router.get('/config', (req,res) => { res.json(readConfig()); });

router.post('/config', (req,res) => {
    try {
        const allowed = [
            "openwebui_url", "openwebui_api_key", "use_speech_input", "use_speech_output",
            "default_model", "tts_engine_url", "tts_api_key", "tts_voice", "tts_model",
            "tts_speed", "tts_volume", "speech_recognition_lang", "openwebui_timeout",
            "enable_system_log", "enable_all_log"
        ];
        const cur = readConfig();
        allowed.forEach(k => { 
            if (req.body[k] !== undefined) cur[k] = req.body[k]; 
        });
        fs.writeFileSync(configPath, JSON.stringify(cur, null, 2), 'utf-8');
        logToFile('system.log', 'Configuration updated', JSON.stringify(req.body, null, 2));
        return res.json({ status:'ok' });
    } catch(e){ 
        logToFile('system.log', 'Configuration update failed', e.toString());
        return res.status(500).json({status:'error', message: e.toString()}); 
    }
});

// Logging endpoints
router.post('/log/system', (req, res) => {
    try {
        const payload = req.body || {};
        logToFile('system.log', payload.message || '', payload.details || '');
        return res.json({ status: 'ok' });
    } catch (e) { 
        return res.status(500).json({ status: 'error', message: e.toString() }); 
    }
});

router.post('/log/all', (req, res) => {
    try {
        const payload = req.body || {};
        const entry = `[${new Date().toISOString()}] ${payload.message || ''}\n${JSON.stringify(payload, null, 2)}\n`;
        const p = path.join(__dirname, 'all.log');
        fs.appendFileSync(p, entry, 'utf-8');
        return res.json({ status: 'ok' });
    } catch (e) { 
        return res.status(500).json({ status: 'error', message: e.toString() }); 
    }
});

router.get('/logs/system', (req,res) => {
    try { 
        const p = path.join(__dirname,'system.log'); 
        if(!fs.existsSync(p)) return res.json({content:''}); 
        const content = fs.readFileSync(p,'utf-8');
        return res.json({content: content.split('\n').slice(-100).join('\n')}); // Last 100 lines
    } catch(e){ 
        return res.status(500).json({status:'error', message: e.toString()}); 
    }
});

router.get('/logs/all', (req,res) => {
    try { 
        const p = path.join(__dirname,'all.log'); 
        if(!fs.existsSync(p)) return res.json({content:''}); 
        const content = fs.readFileSync(p,'utf-8');
        return res.json({content: content.split('\n').slice(-100).join('\n')}); // Last 100 lines
    } catch(e){ 
        return res.status(500).json({status:'error', message: e.toString()}); 
    }
});

// Enhanced OpenWebUI connectivity test
router.get('/test/openwebui', async (req, res) => {
    const cfg = readConfig();
    const url = cfg.openwebui_url;
    const apiKey = cfg.openwebui_api_key;
    
    if (!url || !apiKey) {
        return res.status(400).json({ 
            ok: false, 
            error: 'OpenWebUI URL or API key not configured',
            tests: {
                url_configured: !!url,
                api_key_configured: !!apiKey
            }
        });
    }
    
    const tests = {
        url_accessible: false,
        auth_valid: false,
        models_available: false,
        chat_endpoint: false
    };
    
    try {
        // Test 1: Basic connectivity
        const healthUrl = url.replace(/\/$/,'') + '/api/health';
        logToFile('system.log', `Testing OpenWebUI health endpoint: ${healthUrl}`);
        
        try {
            const testTimeout = cfg.openwebui_timeout || 20000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), testTimeout);
            
            const healthResp = await fetch(healthUrl, { 
                headers: { 'Authorization': 'Bearer ' + apiKey },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            tests.url_accessible = true;
            tests.auth_valid = healthResp.ok || healthResp.status === 404; // 404 is ok, means server is running
            
            logToFile('system.log', `Health check result: ${healthResp.status}`);
        } catch (e) {
            logToFile('system.log', `Health check failed: ${e.message}`);
        }
        
        // Test 2: Models endpoint
        try {
            const testTimeout = cfg.openwebui_timeout || 20000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), testTimeout);
            
            const modelsUrl = url.replace(/\/$/,'') + '/api/models';
            const modelsResp = await fetch(modelsUrl, { 
                headers: { 'Authorization': 'Bearer ' + apiKey },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (modelsResp.ok) {
                const modelsData = await modelsResp.json();
                tests.models_available = Array.isArray(modelsData.data) && modelsData.data.length > 0;
                logToFile('system.log', `Models available: ${tests.models_available}`, JSON.stringify(modelsData));
            }
        } catch (e) {
            logToFile('system.log', `Models check failed: ${e.message}`);
        }
        
        // Test 3: Chat completions endpoint
        try {
            const testTimeout = cfg.openwebui_timeout || 20000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), testTimeout);
            
            const chatUrl = url.replace(/\/$/,'') + '/api/chat/completions';
            const chatResp = await fetch(chatUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': 'Bearer ' + apiKey 
                },
                body: JSON.stringify({
                    model: cfg.default_model || "gpt-4o-mini",
                    messages: [{role: "user", content: "Test"}],
                    max_tokens: 5
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            tests.chat_endpoint = chatResp.ok;
            logToFile('system.log', `Chat endpoint test: ${chatResp.status}`);
        } catch (e) {
            logToFile('system.log', `Chat endpoint test failed: ${e.message}`);
        }
        
        const allTestsPassed = Object.values(tests).every(Boolean);
        
        return res.json({ 
            ok: allTestsPassed, 
            tests,
            url: url,
            configured_model: cfg.default_model
        });
        
    } catch (e) {
        logToFile('system.log', 'OpenWebUI comprehensive test error', e.toString());
        return res.status(500).json({ 
            ok: false, 
            error: e.toString(),
            tests
        });
    }
});

// Enhanced TTS testing with detailed diagnostics
router.post('/test/tts', async (req, res) => {
    const cfg = readConfig();
    const ttsUrl = req.body.url || cfg.tts_engine_url;
    const ttsKey = req.body.key || cfg.tts_api_key;
    const ttsModel = req.body.model || cfg.tts_model;
    const ttsVoice = req.body.voice || cfg.tts_voice;
    
    const diagnostics = {
        url_configured: !!ttsUrl,
        key_configured: !!ttsKey,
        model_configured: !!ttsModel,
        voice_configured: !!ttsVoice,
        url_accessible: false,
        auth_valid: false,
        speech_generated: false,
        audio_size: 0
    };
    
    if (!ttsUrl || !ttsKey) {
        return res.status(400).json({ 
            ok: false, 
            error: 'TTS engine URL or API key not configured',
            diagnostics
        });
    }
    
    try {
        const testUrl = ttsUrl.replace(/\/$/,'') + '/v1/audio/speech';
        logToFile('system.log', `Testing TTS endpoint: ${testUrl}`, `Model: ${ttsModel}, Voice: ${ttsVoice}`);
        
        const requestBody = {
            model: ttsModel || 'tts-1',
            input: 'Dies ist ein Test der Text-zu-Sprache Funktion.',
            voice: ttsVoice || 'alloy'
        };
        
        const resp = await fetch(testUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': 'Bearer ' + ttsKey 
            },
            body: JSON.stringify(requestBody),
            timeout: 15000
        });
        
        diagnostics.url_accessible = true;
        diagnostics.auth_valid = resp.status !== 401 && resp.status !== 403;
        
        if (resp.ok) {
            const arrayBuffer = await resp.arrayBuffer();
            diagnostics.speech_generated = arrayBuffer.byteLength > 0;
            diagnostics.audio_size = arrayBuffer.byteLength;
            
            logToFile('system.log', `TTS test successful`, `Audio size: ${arrayBuffer.byteLength} bytes`);
            
            // Return audio data as base64 for testing
            const buffer = Buffer.from(arrayBuffer);
            const audioBase64 = buffer.toString('base64');
            
            return res.json({ 
                ok: true, 
                diagnostics,
                audio_data: audioBase64,
                content_type: resp.headers.get('content-type') || 'audio/mpeg'
            });
            
        } else {
            const errorText = await resp.text();
            diagnostics.error_details = errorText;
            
            logToFile('system.log', `TTS test failed ${resp.status}`, errorText);
            
            return res.json({ 
                ok: false, 
                status: resp.status,
                error: errorText,
                diagnostics
            });
        }
        
    } catch (e) {
        logToFile('system.log', 'TTS test error', e.toString());
        return res.status(500).json({ 
            ok: false, 
            error: e.toString(),
            diagnostics
        });
    }
});

// TTS models discovery endpoint
router.get('/tts/models', async (req, res) => {
    const cfg = readConfig();
    if (!cfg.tts_engine_url || !cfg.tts_api_key) {
        return res.status(400).json({ error: 'TTS not configured' });
    }
    
    try {
        const modelsUrl = cfg.tts_engine_url.replace(/\/$/,'') + '/v1/models';
        const resp = await fetch(modelsUrl, {
            headers: { 'Authorization': 'Bearer ' + cfg.tts_api_key }
        });
        
        if (resp.ok) {
            const data = await resp.json();
            const ttsModels = data.data?.filter(model => 
                model.id.includes('tts') || 
                model.id.includes('speech') ||
                model.id.includes('voice')
            ) || [];
            
            return res.json({ 
                models: ttsModels,
                suggested_voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'thorsten']
            });
        } else {
            return res.status(resp.status).json({ error: await resp.text() });
        }
    } catch (e) {
        return res.status(500).json({ error: e.toString() });
    }
});

// Speech-to-Text endpoint (if supported by OpenWebUI or TTS engine)
router.post('/speech/transcribe', async (req, res) => {
    const cfg = readConfig();
    if (!cfg.tts_engine_url || !cfg.tts_api_key) {
        return res.status(400).json({ error: 'Speech service not configured' });
    }
    
    try {
        const transcribeUrl = cfg.tts_engine_url.replace(/\/$/,'') + '/v1/audio/transcriptions';
        
        // Forward the audio data
        const resp = await fetch(transcribeUrl, {
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + cfg.tts_api_key,
                'Content-Type': req.headers['content-type']
            },
            body: req.body
        });
        
        if (resp.ok) {
            const data = await resp.json();
            logToFile('system.log', 'Speech transcription successful', `Text: ${data.text}`);
            return res.json(data);
        } else {
            const errorText = await resp.text();
            logToFile('system.log', 'Speech transcription failed', errorText);
            return res.status(resp.status).json({ error: errorText });
        }
    } catch (e) {
        logToFile('system.log', 'Speech transcription error', e.toString());
        return res.status(500).json({ error: e.toString() });
    }
});

// Initialize log files on startup
ensureLogFiles();

module.exports = router;
