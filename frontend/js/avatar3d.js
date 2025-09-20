(function(){
class Avatar3D {
    constructor(containerId){
        this.container=document.getElementById(containerId);
        this.width=this.container.clientWidth; this.height=this.container.clientHeight;
        this.scene=new THREE.Scene();
        this.camera=new THREE.PerspectiveCamera(45,this.width/this.height,0.1,1000);
        this.camera.position.set(0,1.6,3);
        this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
        this.renderer.setSize(this.width,this.height);
        this.container.appendChild(this.renderer.domElement);
        this.clock=new THREE.Clock();
        const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0); this.scene.add(hemi);
        const dir = new THREE.DirectionalLight(0xffffff, 0.6); dir.position.set(5,10,7.5); this.scene.add(dir);
        this.loaderGLTF = (THREE.GLTFLoader)? new THREE.GLTFLoader(): null;
        this.loaderOBJ = (THREE.OBJLoader)? new THREE.OBJLoader(): null;
        this.model=null; this.mixer=null; this.jawSpeaking=false;
        this._internalQuality = 'high';
        this._doLoad(this._internalQuality);
        this.animate();
        window.addEventListener('resize', ()=>this.onResize());
    }

    getModelPath(quality){
        quality = quality || this._internalQuality || 'high';
        if (quality === 'low') return 'assets/avatars/3d/model_low.obj';
        if (quality === 'medium') return 'assets/avatars/3d/model_medium.obj';
        return 'assets/avatars/3d/model_high.obj';
    }

    _doLoad(quality){
        const p = this.getModelPath(quality);
        if(this.model){ try{ this.scene.remove(this.model); }catch(e){} this.model=null; }
        const tryGLTF = p.replace('.obj','.glb');
        const self = this;
        if(this.loaderGLTF){
            this.loaderGLTF.load(tryGLTF, (gltf)=>{
                self.model = gltf.scene; self.scene.add(self.model);
                if(gltf.animations && gltf.animations.length){ self.mixer = new THREE.AnimationMixer(self.model); gltf.animations.forEach((c)=> self.mixer.clipAction(c).play()); }
                try { self.model.visible = true; self.model.scale.set(1,1,1); self.camera.position.set(0,1.6,3); } catch(e){}
            }, undefined, (err)=>{
                console.warn('GLTF load failed', err);
                fetch('/api/log/system', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({message:'GLTF load failed', details: String(err)})}).catch(()=>{});
                self._loadOBJ(p);
            });
        } else {
            this._loadOBJ(p);
        }
    }

    _loadOBJ(path){
        const self=this;
        if(this.loaderOBJ){
            this.loaderOBJ.load(path, (obj)=>{
                self.model = obj;
                obj.traverse((c)=>{ if(c.isMesh) c.material = new THREE.MeshStandardMaterial({color:0x88aaff}); });
                self.scene.add(obj);
                try { self.model.visible = true; self.model.scale.set(1,1,1); self.camera.position.set(0,1.6,3); } catch(e){}
            }, undefined, async (err)=>{
                console.warn('OBJ load failed', err);
                try{ await fetch('/api/log/system',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({message:'3D model load failed', details: (err && err.message)?err.message:String(err)})}); }catch(e){}
                this._createPrimitive();
            });
        } else {
            (async ()=>{
                try{ await fetch('/api/log/system',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({message:'No OBJ/GLTF loader present', details:'loaders missing'})}); }catch(e){}
                this._createPrimitive();
            })();
        }
    }

    _createPrimitive(){ const geo=new THREE.CapsuleGeometry(0.6,1.2,4,8); const mat=new THREE.MeshStandardMaterial({color:0x88aaff}); const mesh=new THREE.Mesh(geo,mat); this.model=mesh; this.scene.add(mesh); }

    loadQuality(q){ this._internalQuality = q || 'high'; this._doLoad(this._internalQuality); }

    speakStart(){ this.jawSpeaking = true; }
    speakStop(){ this.jawSpeaking = false; }

    onResize(){ this.width=this.container.clientWidth; this.height=this.container.clientHeight; this.camera.aspect=this.width/this.height; this.camera.updateProjectionMatrix(); this.renderer.setSize(this.width,this.height); }

    animate(){ requestAnimationFrame(()=>this.animate()); const delta=this.clock.getDelta(); if(this.mixer) this.mixer.update(delta); if(this.model){ this.model.rotation.y += 0.002; if(this.jawSpeaking){ const t = Date.now()*0.01; this.model.position.y = Math.sin(t)*0.02; } else this.model.position.y = 0; } this.renderer.render(this.scene,this.camera); }
}

document.addEventListener('DOMContentLoaded', ()=>{ const c=document.getElementById('avatar-container'); if(c) window.avatar3D = new Avatar3D('avatar-container'); });
})();
