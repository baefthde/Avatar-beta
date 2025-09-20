const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const router = express.Router();
const configPath = path.join(__dirname, 'config.json');

function readConfig() {
    try { return JSON.parse(fs.readFileSync(configPath,'utf-8')); } catch(e){ return {}; }
}

router.post('/chat', async (req, res) => {
    const { message, model } = req.body;
    const cfg = readConfig();
    const url = cfg.openwebui_url;
    const apiKey = cfg.openwebui_api_key;
    if (!url || !apiKey) return res.status(500).json({ error: "OpenWebUI URL or API key not configured" });
    try {
        const resp = await fetch(`${url.replace(/\/$/,'')}/api/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: model || cfg.default_model || "gpt-4o-mini", messages:[{role:"user", content: message}], max_tokens:512 })
        });
        if (!resp.ok) {
            const txt = await resp.text();
            return res.status(resp.status).json({ error: "OpenWebUI error", details: txt });
        }
        const data = await resp.json();
        let replyText = "";
        if (Array.isArray(data.choices) && data.choices.length>0) replyText = data.choices[0].message?.content || data.choices[0].text || JSON.stringify(data.choices[0]);
        else if (data.reply) replyText = data.reply;
        else replyText = JSON.stringify(data);
        const lower = (replyText||'').toLowerCase();
        let emotion = "normal";
        if (lower.includes('glücklich')||lower.includes('freude')||lower.includes('haha')) emotion='freude';
        else if (lower.includes('traurig')||lower.includes('trauer')) emotion='traurig';
        else if (lower.includes('wüt')||lower.includes('ärger')) emotion='wütend';
        else if (lower.includes('?')) emotion='denk';
        return res.json({ reply: replyText, emotion });
    } catch (err) {
        console.error("Error contacting OpenWebUI:", err);
        try { fs.appendFileSync(path.join(__dirname,'system.log'), `[${new Date().toISOString()}] Chat error:\n${err.toString()}\n`); } catch(e){}
        return res.status(500).json({ error: "Communication error with OpenWebUI", details: err.toString() });
    }
});

// config endpoints
router.get('/config', (req,res)=>{ res.json(readConfig()); });
router.post('/config', (req,res)=>{
    try {
        const allowed = ["openwebui_url","openwebui_api_key","use_speech_input","use_speech_output","default_model","tts_engine_url","tts_api_key","tts_voice","tts_model"];
        const cur = readConfig();
        allowed.forEach(k=>{ if (req.body[k] !== undefined) cur[k] = req.body[k]; });
        fs.writeFileSync(configPath, JSON.stringify(cur, null, 2), 'utf-8');
        return res.json({ status:'ok' });
    } catch(e){ return res.status(500).json({status:'error', message:e.toString()}); }
});

// Logging endpoints
router.post('/log/system', (req, res) => {
    try {
        const payload = req.body || {};
        const entry = `[${new Date().toISOString()}] ${payload.message || ''}\n${payload.details || ''}\n`;
        const p = path.join(__dirname, 'system.log');
        fs.appendFileSync(p, entry, 'utf-8');
        return res.json({ status: 'ok' });
    } catch (e) { return res.status(500).json({ status: 'error', message: e.toString() }); }
});
router.post('/log/all', (req, res) => {
    try {
        const payload = req.body || {};
        const entry = `[${new Date().toISOString()}] ${payload.message || ''}\n${JSON.stringify(payload, null, 2)}\n`;
        const p = path.join(__dirname, 'all.log');
        fs.appendFileSync(p, entry, 'utf-8');
        return res.json({ status: 'ok' });
    } catch (e) { return res.status(500).json({ status: 'error', message: e.toString() }); }
});
router.get('/logs/system', (req,res)=> {
    try { const p=path.join(__dirname,'system.log'); if(!fs.existsSync(p)) return res.json({content:''}); return res.json({content: fs.readFileSync(p,'utf-8')}); } catch(e){ return res.status(500).json({status:'error', message:e.toString()}); }
});
router.get('/logs/all', (req,res)=> {
    try { const p=path.join(__dirname,'all.log'); if(!fs.existsSync(p)) return res.json({content:''}); return res.json({content: fs.readFileSync(p,'utf-8')}); } catch(e){ return res.status(500).json({status:'error', message:e.toString()}); }
});

// ensure log files exist helper
function ensureLogFiles(){
    try{
        const p1 = path.join(__dirname,'system.log');
        const p2 = path.join(__dirname,'all.log');
        if(!fs.existsSync(p1)) fs.writeFileSync(p1,'', 'utf-8');
        if(!fs.existsSync(p2)) fs.writeFileSync(p2,'', 'utf-8');
    }catch(e){}
}

// Test OpenWebUI connectivity (GET /api/test/openwebui)
router.get('/test/openwebui', async (req, res) => {
    const cfg = readConfig();
    const url = cfg.openwebui_url;
    const apiKey = cfg.openwebui_api_key;
    if (!url || !apiKey) return res.status(400).json({ ok:false, error: 'OpenWebUI URL or API key not configured' });
    try {
        const testUrl = url.replace(/\/$/,'') + '/api/health';
        const resp = await fetch(testUrl, { headers: { 'Authorization': 'Bearer ' + apiKey } });
        const txt = await resp.text();
        ensureLogFiles();
        fs.appendFileSync(path.join(__dirname,'system.log'), `[${new Date().toISOString()}] OpenWebUI test: status ${resp.status}\n`);
        return res.json({ ok: resp.ok, status: resp.status, body: txt });
    } catch (e) {
        ensureLogFiles();
        fs.appendFileSync(path.join(__dirname,'system.log'), `[${new Date().toISOString()}] OpenWebUI test error: ${e.toString()}\n`);
        return res.status(500).json({ ok:false, error: e.toString() });
    }
});

// Test TTS connectivity (POST /api/test/tts) - OpenAI-compatible
router.post('/test/tts', async (req, res) => {
    const cfg = readConfig();
    const ttsUrl = req.body.url || cfg.tts_engine_url;
    const ttsKey = req.body.key || cfg.tts_api_key;
    const ttsModel = req.body.model || cfg.tts_model;
    const ttsVoice = req.body.voice || cfg.tts_voice;
    if (!ttsUrl || !ttsKey || !ttsModel) return res.status(400).json({ ok:false, error: 'TTS engine, key or model not configured' });
    try {
        const url = ttsUrl.replace(/\/$/,'') + '/v1/audio/speech';
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + ttsKey },
            body: JSON.stringify({ model: ttsModel, voice: ttsVoice || undefined, input: 'Dieser Testtext prüft die Verbindung.' })
        });
        const ok = resp.ok;
        ensureLogFiles();
        fs.appendFileSync(path.join(__dirname,'system.log'), `[${new Date().toISOString()}] TTS test: status ${resp.status}\n`);
        return res.json({ ok, status: resp.status, text: ok ? 'audio' : await resp.text() });
    } catch (e) {
        ensureLogFiles();
        fs.appendFileSync(path.join(__dirname,'system.log'), `[${new Date().toISOString()}] TTS test error: ${e.toString()}\n`);
        return res.status(500).json({ ok:false, error: e.toString() });
    }
});

module.exports = router;

// Test TTS connectivity (OpenAI with German Thorsten voice)
app.post('/api/test/tts', async (req, res) => {
  const cfg = loadConfig();
  const base = cfg.tts_engine_url || 'https://api.openai.com';
  const path = cfg.tts_path || '/v1/audio/speech';
  const fullUrl = base.replace(/\/$/, '') + path;
  try {
    const r = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.tts_api_key || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: cfg.tts_model,
        voice: cfg.tts_voice || 'thorsten',
        input: 'Dies ist ein deutscher Test mit der Stimme Thorsten.'
      })
    });
    if (!r.ok) {
      const txt = await r.text();
      logSystem(`TTS test failed ${r.status} ${txt}`);
      return res.status(r.status).send(txt);
    }
    const arrayBuffer = await r.arrayBuffer();
    logSystem(`TTS test OK, received ${arrayBuffer.byteLength} bytes`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(arrayBuffer));
  } catch (e) {
    logSystem(`TTS test error: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
});
