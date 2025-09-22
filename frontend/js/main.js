// Version information
const APP_VERSION = '1.0';
console.log(`Avatar Chat UI Version ${APP_VERSION}`);

// main.js - Enhanced Avatar Chat UI
document.addEventListener("DOMContentLoaded", async () => {
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    const messages = document.getElementById("messages");

    // Global state
    let avatarSettings = JSON.parse(localStorage.getItem("avatarSettings")) || { 
        type: "3d", 
        quality: "high", 
        avatar_name: "Ava", 
        skin_color: "#f2d0b3", 
        hair_color: "#2b1b12", 
        top_style: "tshirt", 
        system_prompt: "" 
    };
    
    let currentConversation = {
        id: Date.now().toString(),
        history: []
    };
    
    let isRecording = false;
    let recognition = null;
    let currentAudio = null;

    // Initialize Speech Recognition
    function initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return null;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'de-DE'; // German by default
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isRecording = true;
            updateMicrophoneButton(true);
            displayStatusMessage("🎤 Höre zu...", "info");
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            displayStatusMessage(`✅ Erkannt: "${transcript}"`, "success");
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            displayStatusMessage(`❌ Spracherkennung fehlgeschlagen: ${event.error}`, "error");
            updateMicrophoneButton(false);
        };

        recognition.onend = () => {
            isRecording = false;
            updateMicrophoneButton(false);
        };

        return recognition;
    }

    // Initialize speech recognition
    recognition = initSpeechRecognition();

    // Create microphone button
    function createMicrophoneButton() {
        const micBtn = document.createElement('button');
        micBtn.id = 'mic-btn';
        micBtn.innerHTML = '🎤';
        micBtn.title = 'Spracheingabe (Klicken und sprechen)';
        micBtn.style.cssText = 'margin-left: 6px; padding: 8px 12px; border-radius: 6px; background: #4ade80; border: none; cursor: pointer;';
        
        micBtn.addEventListener('click', toggleSpeechRecognition);
        
        // Insert after send button
        sendBtn.parentNode.insertBefore(micBtn, sendBtn.nextSibling);
        return micBtn;
    }

    function updateMicrophoneButton(recording) {
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.innerHTML = recording ? '🔴' : '🎤';
            micBtn.style.background = recording ? '#ef4444' : '#4ade80';
            micBtn.title = recording ? 'Aufnahme stoppen' : 'Spracheingabe starten';
        }
    }

    function toggleSpeechRecognition() {
        if (!recognition) {
            displayStatusMessage("❌ Spracherkennung nicht unterstützt", "error");
            return;
        }

        if (isRecording) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (e) {
                console.error('Could not start speech recognition:', e);
                displayStatusMessage("❌ Spracherkennung konnte nicht gestartet werden", "error");
            }
        }
    }

    // Create microphone button if speech recognition is available
    if (recognition) {
        createMicrophoneButton();
    }

    // Status messages
    function displayStatusMessage(msg, type = "info") {
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        statusDiv.textContent = msg;
        statusDiv.style.cssText = `
            padding: 8px 12px; 
            margin: 4px 0; 
            border-radius: 4px; 
            font-size: 0.9em;
            opacity: 0.8;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'};
            color: white;
        `;
        
        messages.appendChild(statusDiv);
        messages.scrollTop = messages.scrollHeight;
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 3000);
    }

    // Enhanced avatar management
    function switchAvatar() {
        const container = document.getElementById('avatar-container');
        if (!container) return;

        // Clear existing avatar
        container.innerHTML = '';

        if (avatarSettings.type === '3d') {
            // Initialize 3D avatar
            if (window.Avatar3D) {
                window.currentAvatar = new window.Avatar3D('avatar-container');
                if (avatarSettings.quality) {
                    setTimeout(() => {
                        window.currentAvatar.loadQuality(avatarSettings.quality);
                    }, 100);
                }
            }
        } else {
            // Initialize 2D avatar
            if (window.Avatar2D) {
                window.currentAvatar = new window.Avatar2D('avatar-container');
            }
        }
    }

    // Avatar speaking animation
    function startSpeaking(durationMs, emotion = 'normal') {
        if (window.currentAvatar) {
            if (window.currentAvatar.setSpeaking) {
                window.currentAvatar.setSpeaking(true);
            }
            if (window.currentAvatar.speakStart) {
                window.currentAvatar.speakStart();
            }
            if (window.currentAvatar.setEmotion) {
                window.currentAvatar.setEmotion(emotion);
            }
        }

        setTimeout(() => {
            if (window.currentAvatar) {
                if (window.currentAvatar.setSpeaking) {
                    window.currentAvatar.setSpeaking(false);
                }
                if (window.currentAvatar.speakStop) {
                    window.currentAvatar.speakStop();
                }
                if (window.currentAvatar.setEmotion) {
                    window.currentAvatar.setEmotion('normal');
                }
            }
        }, durationMs);
    }

    // Enhanced TTS with better error handling
    async function playTTS(text) {
        try {
            const cfgRes = await fetch('/api/config');
            const cfg = await cfgRes.json();
            
            if (!cfg.use_speech_output || !cfg.tts_engine_url || !cfg.tts_api_key || !cfg.tts_model) {
                console.log("TTS not configured or disabled");
                return false;
            }

            displayStatusMessage("🔊 Generiere Sprache...", "info");

            const ttsUrl = cfg.tts_engine_url.replace(/\/$/, '') + '/v1/audio/speech';
            const requestBody = {
                model: cfg.tts_model,
                voice: cfg.tts_voice || 'alloy',
                input: text,
                speed: cfg.tts_speed || 1.0
            };

            const ttsResp = await fetch(ttsUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + cfg.tts_api_key
                },
                body: JSON.stringify(requestBody)
            });

            if (ttsResp.ok) {
                const arrayBuffer = await ttsResp.arrayBuffer();
                const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(blob);
                
                // Stop any currently playing audio
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio = null;
                }
                
                currentAudio = new Audio(audioUrl);
                
                currentAudio.onplay = () => {
                    displayStatusMessage("🔊 Wiedergabe gestartet", "success");
                };
                
                currentAudio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    currentAudio = null;
                };
                
                currentAudio.onerror = (e) => {
                    console.error('Audio playback error:', e);
                    displayStatusMessage("❌ Audiowiedergabe fehlgeschlagen", "error");
                    URL.revokeObjectURL(audioUrl);
                    currentAudio = null;
                };

                await currentAudio.play();
                return true;
                
            } else {
                const errorText = await ttsResp.text();
                console.error('TTS request failed:', errorText);
                displayStatusMessage(`❌ TTS fehlgeschlagen: ${ttsResp.status}`, "error");
                return false;
            }
            
        } catch (e) {
            console.error('TTS error:', e);
            displayStatusMessage(`❌ TTS Fehler: ${e.message}`, "error");
            return false;
        }
    }

    // Enhanced chat functionality
    async function sendMessage(message) {
        if (!message.trim()) return;

        // Display user message
        displayMessage(`${avatarSettings.avatar_name || 'Du'}: ${message}`, 'user');
        
        // Clear input
        chatInput.value = '';
        
        try {
            displayStatusMessage("🤔 Denke nach...", "info");

            const systemPrompt = avatarSettings.system_prompt || '';
            const finalMessage = systemPrompt ? `[System Prompt]\n${systemPrompt}\n\n${message}` : message;

            const requestBody = {
                message: finalMessage,
                conversation_id: currentConversation.id,
                history: currentConversation.history
            };

            const res = await fetch('/api/chat', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(requestBody) 
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(`Chat API error: ${errorData.error} (${res.status})`);
            }

            const data = await res.json();
            const reply = data.reply || 'Keine Antwort erhalten';
            const emotion = data.emotion || 'normal';
            
            // Update conversation history
            currentConversation.history = data.history || [];
            currentConversation.id = data.conversation_id || currentConversation.id;

            // Display assistant message
            displayMessage(`${avatarSettings.avatar_name || 'Avatar'}: ${reply}`, 'assistant');

            // Calculate speaking duration based on text length
            const words = reply.split(/\s+/).filter(Boolean).length;
            const duration = Math.max(1000, Math.min(15000, (words / 150) * 60000));
            
            // Start avatar animation
            startSpeaking(duration, emotion);

            // Play TTS
            await playTTS(reply);

            // Log conversation if enabled
            const mode = localStorage.getItem('logMode') || 'none';
            if (mode === 'all') {
                await fetch('/api/log/all', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        event: 'chat', 
                        message, 
                        reply, 
                        emotion, 
                        conversation_id: currentConversation.id,
                        timestamp: new Date().toISOString() 
                    })
                });
            }

        } catch (e) {
            console.error('Chat error:', e);
            displayMessage(`❌ Fehler: ${e.message}`, 'error');
            displayStatusMessage(`❌ Chat fehlgeschlagen: ${e.message}`, "error");
            
            // Log error
            await fetch('/api/log/system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: 'Chat request failed', 
                    details: e.toString() 
                })
            }).catch(() => {});
        }
    }

    // Enhanced message display
    function displayMessage(msg, type = 'system') {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.style.cssText = `
            padding: 12px;
            margin: 8px 0;
            border-radius: 8px;
            line-height: 1.4;
            max-width: 85%;
            word-wrap: break-word;
            ${type === 'user' ? 'background: #1e40af; color: white; margin-left: auto; text-align: right;' : 
              type === 'assistant' ? 'background: #059669; color: white;' : 
              type === 'error' ? 'background: #dc2626; color: white;' : 
              'background: #374151; color: #e5e7eb;'}
        `;
        
        // Parse and display message with basic formatting
        const formattedMsg = msg
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background: rgba(0,0,0,0.2); padding: 2px 4px; border-radius: 3px;">$1</code>');
        
        div.innerHTML = formattedMsg;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    // Event listeners
    sendBtn.addEventListener("click", () => {
        const msg = chatInput.value.trim();
        if (msg) sendMessage(msg);
    });

    chatInput.addEventListener("keypress", (e) => { 
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });

    // Avatar settings change handler
    window.addEventListener('avatarSettingsChanged', (e) => {
        avatarSettings = e.detail;
        switchAvatar();
    });

    // Initialize avatar on load
    setTimeout(() => {
        switchAvatar();
    }, 500);

    // Export functions for global access
    window.sendMessage = sendMessage;
    window.switchAvatar = switchAvatar;
    window.getAvatarSettings = () => avatarSettings;
    window.setAvatarSettings = (settings) => {
        avatarSettings = { ...avatarSettings, ...settings };
        localStorage.setItem('avatarSettings', JSON.stringify(avatarSettings));
        window.dispatchEvent(new CustomEvent('avatarSettingsChanged', { detail: avatarSettings }));
    };

    // Conversation management
    window.clearConversation = () => {
        currentConversation = {
            id: Date.now().toString(),
            history: []
        };
        messages.innerHTML = '';
        displayStatusMessage("🗑️ Unterhaltung gelöscht", "info");
    };

    window.exportConversation = () => {
        const conversation = {
            id: currentConversation.id,
            history: currentConversation.history,
            avatar: avatarSettings.avatar_name,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(conversation, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation_${currentConversation.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Periodic connection check
    setInterval(async () => {
        try {
            const response = await fetch('/api/config');
            if (!response.ok) {
                displayStatusMessage("⚠️ Verbindung zum Server verloren", "error");
            }
        } catch (e) {
            displayStatusMessage("⚠️ Server nicht erreichbar", "error");
        }
    }, 30000); // Check every 30 seconds

    console.log("Avatar Chat UI initialized successfully");
});
