// main.js
document.addEventListener("DOMContentLoaded", async () => {
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    const messages = document.getElementById("messages");

    let avatarSettings = JSON.parse(localStorage.getItem("avatarSettings")) || { type: "3d", quality: "high", avatar_name: "Ava", skin_color: "#f2d0b3", hair_color: "#2b1b12", top_style: "tshirt", system_prompt: "" };

    function saveLocalAvatarSettings() { localStorage.setItem("avatarSettings", JSON.stringify(avatarSettings)); }

    async function sendSystemLog(message, details) {
        try { await fetch('/api/log/system', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({message, details})}); } catch(e){ console.warn(e); }
    }
    async function sendAllLog(payload) {
        try { await fetch('/api/log/all', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}); } catch(e){ console.warn(e); }
    }

    function startSpeaking(durationMs) {
        if (window.avatar2D && typeof window.avatar2D.setSpeaking === 'function') window.avatar2D.setSpeaking(true);
        if (window.avatar3D && typeof window.avatar3D.speakStart === 'function') window.avatar3D.speakStart();
        setTimeout(() => {
            if (window.avatar2D && typeof window.avatar2D.setSpeaking === 'function') window.avatar2D.setSpeaking(false);
            if (window.avatar3D && typeof window.avatar3D.speakStop === 'function') window.avatar3D.speakStop();
        }, durationMs);
    }

    async function sendMessage(message) {
        displayMessage((avatarSettings.avatar_name || 'Du') + ': ' + message);
        try {
            const systemPrompt = avatarSettings.system_prompt || '';
            const finalMessage = systemPrompt ? ("[System Prompt]\n" + systemPrompt + "\n\n" + message) : message;

            const res = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: finalMessage }) });
            const data = await res.json();
            displayMessage((avatarSettings.avatar_name || 'Avatar') + ': ' + (data.reply || ''));

            const words = (data.reply || '').split(/\s+/).filter(Boolean).length;
            const duration = Math.max(600, Math.min(15000, (words / 150) * 60000));
            startSpeaking(duration);

            // TTS playback (OpenAI-compatible endpoint expected)
            try {
                const cfgRes = await fetch('/api/config'); const cfg = await cfgRes.json();
                if (cfg && cfg.tts_engine_url && cfg.tts_api_key && cfg.tts_model && cfg.use_speech_output) {
                    try {
                        const ttsUrl = cfg.tts_engine_url.replace(/\/$/, '') + '/v1/audio/speech';
                        const ttsResp = await fetch(ttsUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + cfg.tts_api_key
                            },
                            body: JSON.stringify({
                                model: cfg.tts_model,
                                voice: cfg.tts_voice || undefined,
                                input: data.reply || ''
                            })
                        });
                        if (ttsResp.ok) {
                            const ab = await ttsResp.arrayBuffer();
                            const blob = new Blob([ab], { type: 'audio/mpeg' });
                            const url = URL.createObjectURL(blob);
                            const audio = new Audio(url);
                            audio.play().catch(e=>console.warn('Audio play failed', e));
                        } else {
                            console.warn('TTS request failed', await ttsResp.text());
                        }
                    } catch (e) {
                        console.warn('TTS call error', e);
                    }
                }
            } catch (e) {
                console.warn('Could not fetch config for TTS', e);
            }

            const mode = localStorage.getItem('logMode') || 'none';
            if (mode === 'all') await sendAllLog({ event:'chat', message, reply: data.reply, emotion: data.emotion || 'normal', timestamp: new Date().toISOString() });

        } catch (e) {
            console.error(e); displayMessage('Fehler beim Kontakt mit API'); await sendSystemLog('Chat request failed', e.toString());
        }
    }

    function displayMessage(msg) { const div=document.createElement('div'); div.textContent=msg; messages.appendChild(div); messages.scrollTop = messages.scrollHeight; }

    sendBtn.addEventListener("click", () => {
        const msg = chatInput.value.trim();
        if(msg) { sendMessage(msg); chatInput.value=''; }
    });
    chatInput.addEventListener("keypress", (e) => { if(e.key==='Enter') sendBtn.click(); });

    // load avatarSettings from localStorage on start
    (function(){ avatarSettings = JSON.parse(localStorage.getItem('avatarSettings')||JSON.stringify(avatarSettings)); })();

    window.getAvatarSettings = () => avatarSettings;
});


async function speakText(text) {
  const cfg = await (await fetch('/api/config')).json();
  if (!cfg.tts_engine_url || !cfg.tts_api_key) {
    console.log("TTS not configured");
    return;
  }
  const base = cfg.tts_engine_url.replace(/\/$/, '');
  const path = cfg.tts_path || '/v1/audio/speech';
  const url = base + path;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.tts_api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: cfg.tts_model,
        voice: cfg.tts_voice || 'thorsten',
        input: text
      })
    });
    if (!r.ok) {
      console.error("TTS error", await r.text());
      return;
    }
    const blob = await r.blob();
    const urlObj = URL.createObjectURL(blob);
    const audio = new Audio(urlObj);
    audio.play();
  } catch(e) {
    console.error("TTS request failed", e);
  }
}

// Hook in send button to also speak assistant replies
const origSend = async ()=>{};
document.getElementById('sendBtn').onclick = async ()=>{
  const msg = document.getElementById('input').value;
  const r = await fetch('/api/chat', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({messages:[{role:'user', content: msg}]})});
  const data = await r.json();
  const reply = data.choices && data.choices[0] ? data.choices[0].message.content : JSON.stringify(data);
  document.getElementById('messages').innerHTML += `<div>User: ${msg}</div><div>KI: ${reply}</div>`;
  document.getElementById('input').value='';
  await speakText(reply);
};
