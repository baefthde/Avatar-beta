class Avatar2D {
    constructor(containerId){
        this.container=document.getElementById(containerId);
        this.canvas=document.createElement('canvas');
        this.canvas.style.width='100%'; this.canvas.style.height='100%';
        this.canvas.width=this.container.clientWidth; this.canvas.height=this.container.clientHeight;
        this.container.appendChild(this.canvas);
        this.ctx=this.canvas.getContext('2d');
        this.settings=JSON.parse(localStorage.getItem('avatarSettings')||'{}');
        this.speaking=false; this.frame=0;
        this.animate();
    }
    setSpeaking(flag){ this.speaking=!!flag; }
    draw(){
        const ctx=this.ctx; ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        const w=this.canvas.width,h=this.canvas.height,cx=w/2,cy=h/2;
        ctx.fillStyle='#071228'; ctx.fillRect(0,0,w,h);
        ctx.save(); ctx.translate(cx,cy-40); ctx.scale(1.2,1.2); ctx.fillStyle=this.settings.skin_color||'#f2d0b3'; ctx.beginPath(); ctx.ellipse(0,0,80,110,0,0,Math.PI*2); ctx.fill(); ctx.restore();
        ctx.fillStyle=this.settings.hair_color||'#2b1b12'; ctx.fillRect(cx-90, cy-140, 180, 60);
        ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(cx-30, cy-30, 8,6,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+30, cy-30, 8,6,0,0,Math.PI*2); ctx.fill();
        const mouthOpen = this.speaking && ((this.frame%30)<15);
        ctx.fillStyle='#400'; const mh = mouthOpen?18:6; ctx.beginPath(); ctx.ellipse(cx, cy+40, 28, mh, 0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#3b82f6'; ctx.fillRect(cx-90, cy+70, 180, 120);
        this.frame++;
    }
    animate(){ this.draw(); requestAnimationFrame(()=>this.animate()); }
}
document.addEventListener('DOMContentLoaded', ()=>{ const c=document.getElementById('avatar-container'); if(c) window.avatar2D = new Avatar2D('avatar-container'); });
