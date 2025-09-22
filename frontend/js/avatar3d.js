(function(){
    'use strict';
    
    class Avatar3D {
        constructor(containerId) {
            this.version = '1.0';
            console.log(`Avatar3D Module Version ${this.version}`);
            
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.error('Avatar3D: Container not found:', containerId);
                return;
            }
            
            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;
            this.currentEmotion = 'normal';
            this.speaking = false;
            this.jawSpeaking = false;
            
            // Initialize Three.js scene
            this.initScene();
            this.initLighting();
            this.initCamera();
            this.initRenderer();
            
            // Load default model
            this.model = null;
            this.mixer = null;
            this.emotionMorphs = {};
            this._internalQuality = 'high';
            
            // Initialize loaders
            this.initLoaders();
            
            // Load initial model
            this.loadQuality(this._internalQuality);
            
            // Start animation loop
            this.animate();
            
            // Handle window resize
            window.addEventListener('resize', () => this.onResize());
            
            console.log('Avatar3D initialized');
        }
        
        initScene() {
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x071228); // Match the dark theme
            this.clock = new THREE.Clock();
        }
        
        initCamera() {
            this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
            this.camera.position.set(0, 1.6, 3);
            this.camera.lookAt(0, 1.2, 0);
        }
        
        initRenderer() {
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true, 
                alpha: true,
                powerPreference: "high-performance"
            });
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.2;
            
            this.container.appendChild(this.renderer.domElement);
        }
        
        initLighting() {
            // Ambient light for overall illumination
            const ambientLight = new THREE.AmbientLight(0x4a90e2, 0.4);
            this.scene.add(ambientLight);
            
            // Main directional light
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(5, 10, 7.5);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 50;
            directionalLight.shadow.camera.left = -10;
            directionalLight.shadow.camera.right = 10;
            directionalLight.shadow.camera.top = 10;
            directionalLight.shadow.camera.bottom = -10;
            this.scene.add(directionalLight);
            
            // Fill light
            const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
            fillLight.position.set(-5, 5, -5);
            this.scene.add(fillLight);
            
            // Rim light
            const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
            rimLight.position.set(0, 5, -10);
            this.scene.add(rimLight);
        }
        
        initLoaders() {
            // Check for available loaders
            this.loaderGLTF = (typeof THREE.GLTFLoader !== 'undefined') ? new THREE.GLTFLoader() : null;
            this.loaderOBJ = (typeof THREE.OBJLoader !== 'undefined') ? new THREE.OBJLoader() : null;
            
            if (this.loaderGLTF) {
                console.log('GLTF loader available');
            }
            if (this.loaderOBJ) {
                console.log('OBJ loader available');
            }
            if (!this.loaderGLTF && !this.loaderOBJ) {
                console.warn('No 3D model loaders available');
            }
        }
        
        getModelPath(quality) {
            quality = quality || this._internalQuality || 'high';
            const paths = {
                'low': 'assets/avatars/3d/model_low.obj',
                'medium': 'assets/avatars/3d/model_medium.obj',
                'high': 'assets/avatars/3d/model_high.obj'
            };
            return paths[quality] || paths['high'];
        }
        
        loadQuality(quality) {
            this._internalQuality = quality || 'high';
            this.loadModel(this.getModelPath(this._internalQuality));
        }
        
        async loadModel(modelPath) {
            // Clear existing model
            if (this.model) {
                this.scene.remove(this.model);
                this.model = null;
                this.mixer = null;
            }
            
            try {
                console.log('Loading 3D model:', modelPath);
                
                // Try GLTF first (preferred format)
                const gltfPath = modelPath.replace('.obj', '.glb');
                if (this.loaderGLTF) {
                    try {
                        await this.loadGLTF(gltfPath);
                        return;
                    } catch (e) {
                        console.warn('GLTF loading failed, trying OBJ:', e.message);
                    }
                }
                
                // Fallback to OBJ
                if (this.loaderOBJ) {
                    try {
                        await this.loadOBJ(modelPath);
                        return;
                    } catch (e) {
                        console.warn('OBJ loading failed:', e.message);
                    }
                }
                
                // Final fallback: create primitive avatar
                console.warn('All model loading failed, creating primitive avatar');
                this.createPrimitiveAvatar();
                
            } catch (error) {
                console.error('Model loading error:', error);
                this.createPrimitiveAvatar();
            }
        }
        
        loadGLTF(path) {
            return new Promise((resolve, reject) => {
                if (!this.loaderGLTF) {
                    reject(new Error('GLTF loader not available'));
                    return;
                }
                
                this.loaderGLTF.load(
                    path,
                    (gltf) => {
                        this.model = gltf.scene;
                        this.scene.add(this.model);
                        
                        // Setup animations if available
                        if (gltf.animations && gltf.animations.length > 0) {
                            this.mixer = new THREE.AnimationMixer(this.model);
                            gltf.animations.forEach((clip) => {
                                const action = this.mixer.clipAction(clip);
                                if (clip.name.toLowerCase().includes('idle')) {
                                    action.play();
                                }
                            });
                        }
                        
                        // Setup morph targets for emotions if available
                        this.setupMorphTargets();
                        
                        this.model.visible = true;
                        this.model.scale.set(1, 1, 1);
                        this.model.position.set(0, 0, 0);
                        
                        console.log('GLTF model loaded successfully');
                        resolve();
                    },
                    (progress) => {
                        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
                    },
                    (error) => {
                        reject(error);
                    }
                );
            });
        }
        
        loadOBJ(path) {
            return new Promise((resolve, reject) => {
                if (!this.loaderOBJ) {
                    reject(new Error('OBJ loader not available'));
                    return;
                }
                
                this.loaderOBJ.load(
                    path,
                    (obj) => {
                        this.model = obj;
                        
                        // Apply materials to all meshes
                        this.model.traverse((child) => {
                            if (child.isMesh) {
                                const material = new THREE.MeshStandardMaterial({
                                    color: 0x88aaff,
                                    roughness: 0.5,
                                    metalness: 0.2
                                });
                                child.material = material;
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });
                        
                        this.scene.add(this.model);
                        this.model.visible = true;
                        this.model.scale.set(1, 1, 1);
                        this.model.position.set(0, 0, 0);
                        
                        console.log('OBJ model loaded successfully');
                        resolve();
                    },
                    (progress) => {
                        console.log('Loading progress:', progress);
                    },
                    (error) => {
                        reject(error);
                    }
                );
            });
        }
        
        createPrimitiveAvatar() {
            console.log('Creating primitive avatar...');
            
            const group = new THREE.Group();
            
            // Create body using cylinder (CapsuleGeometry not available in r128)
            const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.6, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x4a90e2,
                roughness: 0.5,
                metalness: 0.1
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 0.8;
            body.castShadow = true;
            group.add(body);
            
            // Create head
            const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
            const headMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xf2d0b3,
                roughness: 0.3,
                metalness: 0.0
            });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 1.8;
            head.castShadow = true;
            group.add(head);
            
            // Create eyes
            const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.15, 1.85, 0.25);
            group.add(leftEye);
            
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.15, 1.85, 0.25);
            group.add(rightEye);
            
            // Create mouth (will be animated for speaking)
            const mouthGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
            this.mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
            this.mouth.position.set(0, 1.7, 0.3);
            this.mouth.scale.set(1, 0.3, 0.8);
            group.add(this.mouth);
            
            // Store references for animation
            this.head = head;
            this.leftEye = leftEye;
            this.rightEye = rightEye;
            this.body = body;
            
            this.model = group;
            this.scene.add(group);
            
            console.log('Primitive avatar created');
        }
        
        setupMorphTargets() {
            if (!this.model) return;
            
            this.model.traverse((child) => {
                if (child.isMesh && child.morphTargetInfluences) {
                    // Store morph target indices for common emotions
                    const dictionary = child.morphTargetDictionary;
                    if (dictionary) {
                        this.emotionMorphs = {
                            happy: dictionary['happy'] || dictionary['smile'] || -1,
                            sad: dictionary['sad'] || dictionary['frown'] || -1,
                            angry: dictionary['angry'] || dictionary['mad'] || -1,
                            surprised: dictionary['surprised'] || dictionary['shock'] || -1,
                            thinking: dictionary['thinking'] || dictionary['concentrate'] || -1
                        };
                        console.log('Emotion morph targets found:', this.emotionMorphs);
                    }
                }
            });
        }
        
        setEmotion(emotion) {
            this.currentEmotion = emotion;
            
            if (this.model && this.emotionMorphs) {
                // Reset all morph targets
                this.model.traverse((child) => {
                    if (child.isMesh && child.morphTargetInfluences) {
                        for (let i = 0; i < child.morphTargetInfluences.length; i++) {
                            child.morphTargetInfluences[i] = 0;
                        }
                    }
                });
                
                // Apply emotion morph
                const morphIndex = this.emotionMorphs[emotion];
                if (morphIndex >= 0) {
                    this.model.traverse((child) => {
                        if (child.isMesh && child.morphTargetInfluences && child.morphTargetInfluences[morphIndex] !== undefined) {
                            child.morphTargetInfluences[morphIndex] = 1;
                        }
                    });
                }
            }
            
            // Fallback emotion animations for primitive avatar
            if (this.head && this.leftEye && this.rightEye) {
                switch (emotion) {
                    case 'freude':
                    case 'happy':
                        this.leftEye.scale.set(1, 0.7, 1); // Squinted eyes for smile
                        this.rightEye.scale.set(1, 0.7, 1);
                        break;
                    case 'traurig':
                    case 'sad':
                        this.leftEye.position.y = 1.83; // Droopy eyes
                        this.rightEye.position.y = 1.83;
                        break;
                    case 'wütend':
                    case 'angry':
                        this.leftEye.rotation.z = 0.3; // Angled eyes
                        this.rightEye.rotation.z = -0.3;
                        break;
                    case 'überrascht':
                    case 'surprised':
                        this.leftEye.scale.set(1.5, 1.5, 1.5); // Wide eyes
                        this.rightEye.scale.set(1.5, 1.5, 1.5);
                        break;
                    default:
                        // Reset to normal
                        this.leftEye.scale.set(1, 1, 1);
                        this.rightEye.scale.set(1, 1, 1);
                        this.leftEye.position.y = 1.85;
                        this.rightEye.position.y = 1.85;
                        this.leftEye.rotation.z = 0;
                        this.rightEye.rotation.z = 0;
                        break;
                }
            }
        }
        
        speakStart() {
            this.speaking = true;
            this.jawSpeaking = true;
        }
        
        speakStop() {
            this.speaking = false;
            this.jawSpeaking = false;
            
            // Reset mouth to normal size
            if (this.mouth) {
                this.mouth.scale.set(1, 0.3, 0.8);
            }
        }
        
        onResize() {
            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.width, this.height);
        }
        
        update(deltaTime) {
            if (!this.model) return;
            
            // Update animation mixer
            if (this.mixer) {
                this.mixer.update(deltaTime);
            }
                       
            // Speaking animation
            if (this.jawSpeaking) {
                const time = Date.now() * 0.01;
                
                // Head bobbing
                this.model.position.y = Math.sin(time) * 0.02;
                
                // Mouth animation for primitive avatar
                if (this.mouth) {
                    const mouthScale = 0.3 + Math.sin(time * 3) * 0.2;
                    this.mouth.scale.y = Math.max(0.1, mouthScale);
                }
                
                // Jaw movement for complex models
                if (this.model.getObjectByName) {
                    const jaw = this.model.getObjectByName('jaw') || this.model.getObjectByName('Jaw');
                    if (jaw) {
                        jaw.rotation.x = Math.sin(time * 4) * 0.2;
                    }
                }
            } else {
                this.model.position.y = 0;
                
                if (this.mouth) {
                    this.mouth.scale.y = 0.3;
                }
            }
            
            // Breathing animation when not speaking
            if (!this.speaking && this.body) {
                const breathTime = Date.now() * 0.003;
                this.body.scale.y = 1 + Math.sin(breathTime) * 0.05;
            }
            
            // Eye blinking
            if (this.leftEye && this.rightEye && Math.random() < 0.005) {
                const blinkDuration = 150;
                this.leftEye.scale.y = 0.1;
                this.rightEye.scale.y = 0.1;
                
                setTimeout(() => {
                    if (this.leftEye && this.rightEye) {
                        this.leftEye.scale.y = 1;
                        this.rightEye.scale.y = 1;
                    }
                }, blinkDuration);
            }
        }
        
        animate() {
            requestAnimationFrame(() => this.animate());
            
            const deltaTime = this.clock.getDelta();
            this.update(deltaTime);
            
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        }
        
        // Public methods for external control
        setSpeaking(speaking) {
            if (speaking) {
                this.speakStart();
            } else {
                this.speakStop();
            }
        }
        
        // Cleanup method
        destroy() {
            if (this.renderer) {
                this.container.removeChild(this.renderer.domElement);
                this.renderer.dispose();
            }
            if (this.model) {
                this.scene.remove(this.model);
            }
        }
    }
    
    // Make Avatar3D available globally
    window.Avatar3D = Avatar3D;
    
    // Auto-initialize if container exists
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('avatar-container');
        if (container && !window.avatar3D) {
            window.avatar3D = new Avatar3D('avatar-container');
            window.currentAvatar = window.avatar3D;
            console.log('Avatar3D auto-initialized');
        }
    });
    
})();
