class Avatar2D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Avatar2D: Container not found:', containerId);
            return;
        }
        
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
        this.container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.settings = JSON.parse(localStorage.getItem('avatarSettings') || '{}');
        
        // Animation state
        this.speaking = false;
        this.currentEmotion = 'normal';
        this.frame = 0;
        this.animationSpeed = 1;
        
        // Eye blinking
        this.blinkTimer = 0;
        this.blinkDuration = 0;
        this.isBlinking = false;
        
        // Mouth animation for speaking
        this.mouthOpenness = 0;
        this.mouthTarget = 0;
        
        // Head movement
        this.headTilt = 0;
        this.headBob = 0;
        
        // Breathing animation
        this.breathPhase = 0;
        
        // Color palette
        this.colors = {
            background: '#071228',
            skin: this.settings.skin_color || '#f2d0b3',
            hair: this.settings.hair_color || '#2b1b12',
            shirt: '#3b82f6',
            eyes: '#000000',
            eyeWhites: '#ffffff',
            mouth: '#8B0000',
            cheeks: '#ff9999'
        };
        
        // Start animation loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onResize());
        
        console.log('Avatar2D initialized');
    }
    
    onResize() {
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
    }
    
    setSpeaking(flag) { 
        this.speaking = !!flag;
        this.mouthTarget = this.speaking ? 1 : 0;
    }
    
    setEmotion(emotion) {
        this.currentEmotion = emotion || 'normal';
    }
    
    updateSettings() {
        const newSettings = JSON.parse(localStorage.getItem('avatarSettings') || '{}');
        if (JSON.stringify(newSettings) !== JSON.stringify(this.settings)) {
            this.settings = newSettings;
            this.colors.skin = this.settings.skin_color || '#f2d0b3';
            this.colors.hair = this.settings.hair_color || '#2b1b12';
        }
    }
    
    update() {
        // Update animation timers
        this.frame++;
        const time = this.frame * 0.1;
        
        // Smooth mouth animation
        this.mouthOpenness += (this.mouthTarget - this.mouthOpenness) * 0.15;
        
        // Speaking animation
        if (this.speaking) {
            this.mouthOpenness = 0.3 + Math.sin(time * 0.8) * 0.4;
            this.headBob = Math.sin(time * 0.5) * 2;
        } else {
            this.headBob = 0;
            // Breathing animation when not speaking
            this.breathPhase = Math.sin(time * 0.15) * 0.5;
        }
        
        // Eye blinking logic
        this.blinkTimer++;
        if (this.blinkTimer > 180 + Math.random() * 120) { // Random blink interval
            this.isBlinking = true;
            this.blinkDuration = 8; // Blink duration in frames
            this.blinkTimer = 0;
        }
        
        if (this.isBlinking) {
            this.blinkDuration--;
            if (this.blinkDuration <= 0) {
                this.isBlinking = false;
            }
        }
        
        // Head tilt based on emotion
        switch (this.currentEmotion) {
            case 'denkend':
            case 'thinking':
                this.headTilt = Math.sin(time * 0.3) * 5;
                break;
            case 'freude':
            case 'happy':
                this.headTilt = 2;
                break;
            case 'traurig':
            case 'sad':
                this.headTilt = -3;
                break;
            default:
                this.headTilt = 0;
                break;
        }
    }
    
    drawBackground() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#071228');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }
    
    drawBody(cx, cy) {
        const ctx = this.ctx;
        
        // Body (shirt)
        ctx.fillStyle = this.colors.shirt;
        ctx.beginPath();
        const bodyWidth = 180 + this.breathPhase * 2;
        const bodyHeight = 120;
        ctx.roundRect(cx - bodyWidth/2, cy + 70, bodyWidth, bodyHeight, 10);
        ctx.fill();
        
        // Add some shirt details
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx - bodyWidth/2, cy + 70, bodyWidth, bodyHeight, 10);
        ctx.stroke();
    }
    
    drawHead(cx, cy) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(cx, cy - 40 + this.headBob);
        ctx.rotate((this.headTilt * Math.PI) / 180);
        ctx.scale(1.2, 1.2);
        
        // Face (oval)
        ctx.fillStyle = this.colors.skin;
        ctx.beginPath();
        ctx.ellipse(0, 0, 80, 110, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Face shadow for depth
        ctx.fillStyle = this.adjustColor(this.colors.skin, -20);
        ctx.beginPath();
        ctx.ellipse(5, 10, 80, 110, 0, 0, Math.PI * 2);
        ctx.globalCompositeOperation = 'multiply';
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        
        ctx.restore();
    }
    
    drawHair(cx, cy) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(cx, cy - 40 + this.headBob);
        ctx.rotate((this.headTilt * Math.PI) / 180);
        
        // Hair
        ctx.fillStyle = this.colors.hair;
        ctx.beginPath();
        ctx.roundRect(-90, -140, 180, 80, 20);
        ctx.fill();
        
        // Hair highlights
        ctx.fillStyle = this.adjustColor(this.colors.hair, 30);
        ctx.beginPath();
        ctx.roundRect(-70, -135, 40, 15, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(20, -130, 35, 12, 5);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawEyes(cx, cy) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(cx, cy - 40 + this.headBob);
        ctx.rotate((this.headTilt * Math.PI) / 180);
        
        const eyeY = -30;
        const eyeSize = this.isBlinking ? 2 : 12;
        const eyeHeight = this.isBlinking ? 2 : 10;
        
        // Eye whites
        if (!this.isBlinking) {
            ctx.fillStyle = this.colors.eyeWhites;
            ctx.beginPath();
            ctx.ellipse(-30, eyeY, eyeSize + 2, eyeHeight + 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(30, eyeY, eyeSize + 2, eyeHeight + 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Pupils
        ctx.fillStyle = this.colors.eyes;
        ctx.beginPath();
        ctx.ellipse(-30, eyeY, eyeSize, eyeHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(30, eyeY, eyeSize, eyeHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye highlights
        if (!this.isBlinking) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(-32, eyeY - 2, 3, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(28, eyeY - 2, 3, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Eyebrows
        this.drawEyebrows(ctx, eyeY - 25);
        
        ctx.restore();
    }
    
    drawEyebrows(ctx, eyeY) {
        ctx.strokeStyle = this.colors.hair;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        // Eyebrow shape based on emotion
        switch (this.currentEmotion) {
            case 'wütend':
            case 'angry':
                // Angled down (angry)
                ctx.beginPath();
                ctx.moveTo(-45, eyeY - 5);
                ctx.lineTo(-15, eyeY + 5);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(45, eyeY - 5);
                ctx.lineTo(15, eyeY + 5);
                ctx.stroke();
                break;
            case 'überrascht':
            case 'surprised':
                // Raised high
                ctx.beginPath();
                ctx.moveTo(-45, eyeY - 10);
                ctx.lineTo(-15, eyeY - 10);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(45, eyeY - 10);
                ctx.lineTo(15, eyeY - 10);
                ctx.stroke();
                break;
            case 'traurig':
            case 'sad':
                // Slightly angled down
                ctx.beginPath();
                ctx.moveTo(-45, eyeY + 2);
                ctx.lineTo(-15, eyeY - 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(45, eyeY + 2);
                ctx.lineTo(15, eyeY - 2);
                ctx.stroke();
                break;
            default:
                // Normal eyebrows
                ctx.beginPath();
                ctx.moveTo(-45, eyeY);
                ctx.lineTo(-15, eyeY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(45, eyeY);
                ctx.lineTo(15, eyeY);
                ctx.stroke();
                break;
        }
    }
    
    drawMouth(cx, cy) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(cx, cy - 40 + this.headBob);
        ctx.rotate((this.headTilt * Math.PI) / 180);
        
        const mouthY = 40;
        let mouthWidth = 28;
        let mouthHeight = 6;
        
        // Mouth shape based on emotion and speaking
        switch (this.currentEmotion) {
            case 'freude':
            case 'happy':
                // Smiling mouth
                ctx.strokeStyle = this.colors.mouth;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(0, mouthY - 5, 25, 0.2, Math.PI - 0.2);
                ctx.stroke();
                break;
            case 'traurig':
            case 'sad':
                // Frowning mouth
                ctx.strokeStyle = this.colors.mouth;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(0, mouthY + 15, 25, Math.PI + 0.2, 2 * Math.PI - 0.2);
                ctx.stroke();
                break;
            case 'überrascht':
            case 'surprised':
                // Open mouth (surprised)
                mouthWidth = 20;
                mouthHeight = 30;
                ctx.fillStyle = this.colors.mouth;
                ctx.beginPath();
                ctx.ellipse(0, mouthY, mouthWidth, mouthHeight, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'wütend':
            case 'angry':
                // Grimacing mouth
                ctx.fillStyle = this.colors.mouth;
                ctx.beginPath();
                ctx.rect(-20, mouthY - 3, 40, 6);
                ctx.fill();
                break;
            default:
                // Normal/speaking mouth
                if (this.speaking) {
                    mouthHeight = 6 + this.mouthOpenness * 20;
                }
                ctx.fillStyle = this.colors.mouth;
                ctx.beginPath();
                ctx.ellipse(0, mouthY, mouthWidth, mouthHeight, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Teeth when mouth is open
                if (mouthHeight > 10) {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.ellipse(0, mouthY - mouthHeight/3, mouthWidth - 4, 3, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
        
        ctx.restore();
    }
    
    drawCheeks(cx, cy) {
        // Blush for happy emotion
        if (this.currentEmotion === 'freude' || this.currentEmotion === 'happy') {
            const ctx = this.ctx;
            
            ctx.save();
            ctx.translate(cx, cy - 40 + this.headBob);
            ctx.rotate((this.headTilt * Math.PI) / 180);
            
            ctx.fillStyle = this.colors.cheeks;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.ellipse(-50, 10, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(50, 10, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            
            ctx.restore();
        }
    }
    
    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        
        // Clear canvas
        ctx.clearRect(0, 0, w, h);
        
        // Update settings
        this.updateSettings();
        
        // Update animation state
        this.update();
        
        // Draw avatar components
        this.drawBackground();
        this.drawBody(cx, cy);
        this.drawHead(cx, cy);
        this.drawHair(cx, cy);
        this.drawEyes(cx, cy);
        this.drawCheeks(cx, cy);
        this.drawMouth(cx, cy);
        
        // Debug info (uncomment for development)
        // this.drawDebugInfo(ctx, w, h);
    }
    
    drawDebugInfo(ctx, w, h) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(`Emotion: ${this.currentEmotion}`, 10, 20);
        ctx.fillText(`Speaking: ${this.speaking}`, 10, 35);
        ctx.fillText(`Frame: ${this.frame}`, 10, 50);
        ctx.fillText(`Mouth: ${this.mouthOpenness.toFixed(2)}`, 10, 65);
    }
    
    // Utility function to adjust color brightness
    adjustColor(color, amount) {
        const colorValue = parseInt(color.slice(1), 16);
        const r = Math.max(0, Math.min(255, (colorValue >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((colorValue >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (colorValue & 0x0000FF) + amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
    
    // Public methods for external control
    speakStart() {
        this.setSpeaking(true);
    }
    
    speakStop() {
        this.setSpeaking(false);
    }
    
    // Cleanup method
    destroy() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Add CanvasRenderingContext2D.roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
    };
}

// Make Avatar2D available globally
window.Avatar2D = Avatar2D;

// Auto-initialize if container exists and no 3D avatar is active
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('avatar-container');
    if (container && !window.avatar2D) {
        const avatarSettings = JSON.parse(localStorage.getItem('avatarSettings') || '{}');
        if (avatarSettings.type === '2d' || !avatarSettings.type) {
            window.avatar2D = new Avatar2D('avatar-container');
            window.currentAvatar = window.avatar2D;
            console.log('Avatar2D auto-initialized');
        }
    }
});