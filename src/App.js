import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
// RGBShiftShader Removed
import { AsciiShader } from './utils/Shaders.js';

import { GUI } from 'lil-gui';

import { CONFIG, CAMERA, LIGHT } from './Config.js';
import { WorldSystem } from './systems/WorldSystem.js';
import { EffectSystem } from './systems/EffectSystem.js';
import { CheckIn } from './CheckIn.js';

class App {
    constructor() {
        // 1. Core Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.VISUAL.FOG.COLOR);
        this.scene.fog = new THREE.Fog(CONFIG.VISUAL.FOG.COLOR, CONFIG.VISUAL.FOG.NEAR, CONFIG.VISUAL.FOG.FAR);

        this.world = new CANNON.World();
        this.world.gravity.set(CONFIG.WORLD.GRAVITY.x, CONFIG.WORLD.GRAVITY.y, CONFIG.WORLD.GRAVITY.z);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.allowSleep = true;

        this.fov = CAMERA.FOV;
        this.camera = new THREE.PerspectiveCamera(this.fov, window.innerWidth / window.innerHeight, CAMERA.NEAR, CAMERA.FAR);
        this.camera.position.set(CAMERA.POS.x, CAMERA.POS.y, CAMERA.POS.z);
        // Apply Initial Rotation from Config (Degree -> Radian)
        if (CAMERA.ROT) {
            this.camera.rotation.set(
                THREE.MathUtils.degToRad(CAMERA.ROT.x),
                THREE.MathUtils.degToRad(CAMERA.ROT.y),
                THREE.MathUtils.degToRad(CAMERA.ROT.z)
            );
        }

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // Post Processing
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);

        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.bloomPass.threshold = CONFIG.VISUAL.BLOOM.THRESHOLD;
        this.bloomPass.strength = CONFIG.VISUAL.BLOOM.STRENGTH;
        this.bloomPass.radius = CONFIG.VISUAL.BLOOM.RADIUS;
        this.bloomPass.enabled = CONFIG.VISUAL.BLOOM.ENABLED;
        this.composer.addPass(this.bloomPass);

        // Glitch FX
        this.glitchPass = new GlitchPass();
        this.glitchPass.enabled = false;
        this.glitchPass.goWild = false;
        this.composer.addPass(this.glitchPass);

        // RGB Shift Removed

        // ASCII FX
        this.asciiPass = new ShaderPass(AsciiShader);
        this.asciiPass.enabled = false;
        this.asciiPass.uniforms['resolution'].value.set(window.innerWidth, window.innerHeight);
        this.asciiPass.uniforms['scale'].value = CONFIG.VISUAL.ASCII.SCALE; // Higher Res (Smaller chars)
        this.asciiPass.uniforms['uColor'].value.setHex(CONFIG.VISUAL.ASCII.COLOR); // Default Green
        this.composer.addPass(this.asciiPass);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: null
        };

        // Fix: Update OrbitControls target to match initial Camera Rotation
        if (CAMERA.ROT) {
            // 1. Create Euler from Config directly (to avoid OrbitControls overriding camera.rotation)
            const initialEuler = new THREE.Euler(
                THREE.MathUtils.degToRad(CAMERA.ROT.x),
                THREE.MathUtils.degToRad(CAMERA.ROT.y),
                THREE.MathUtils.degToRad(CAMERA.ROT.z),
                'XYZ'
            );

            // 2. Get forward direction
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyEuler(initialEuler);

            // 3. Calculate target point
            const distance = 10;
            const target = this.camera.position.clone().add(forward.multiplyScalar(distance));

            // 4. Update controls target
            this.controls.target.copy(target);
            this.controls.update();
        }

        // Debug params for GUI (Degree conversion)
        this.debugParams = {
            rotX: 0,
            rotY: 0,
            rotZ: 0
        };

        // 2. Systems
        this.worldSystem = new WorldSystem(this.scene, this.world, this.camera, this.renderer);
        this.effectSystem = new EffectSystem(this.scene, this.world, this.camera, this.worldSystem, this.controls);

        // Pass Post-Processing to EffectSystem
        this.effectSystem.setPostProcessing(this.glitchPass, this.asciiPass);

        // Bind events
        this.worldSystem.onRightClick = (x, y) => this.effectSystem.spawnBomb(x, y);
        this.worldSystem.onMitosis = () => this.effectSystem.triggerMitosisGlitch(); // Connection
        this.worldSystem.onDragStart = () => { this.controls.enabled = false; };
        this.worldSystem.onDragEnd = () => { this.controls.enabled = true; };

        // 3. Lights
        this.setupLights();
        this.effectSystem.setLights(this.ambientLight, this.spotLight);

        // 4. GUI
        this.setupGUI();

        // 5. Init
        this.worldSystem.init();

        // 6. Loop
        this.clock = new THREE.Clock();
        this.oldElapsedTime = 0;

        window.addEventListener('resize', () => this.onResize());

        // Custom Cursor
        const customCursor = document.getElementById('custom-cursor');
        const updateCursor = (x, y) => {
            customCursor.style.left = `${x}px`;
            customCursor.style.top = `${y}px`;
        };

        window.addEventListener('mousemove', (e) => updateCursor(e.clientX, e.clientY));
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                updateCursor(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                updateCursor(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });

        // Cursor Interaction Feedback
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) customCursor.classList.add('active-left');
            if (e.button === 1) customCursor.classList.add('active-wheel');
            if (e.button === 2) customCursor.classList.add('active-right');
        });

        window.addEventListener('mouseup', () => {
            customCursor.classList.remove('active-left', 'active-wheel', 'active-right');
        });

        // Touch feedback (Treat as Left Click)
        window.addEventListener('touchstart', () => customCursor.classList.add('active-left'), { passive: false });
        window.addEventListener('touchend', () => customCursor.classList.remove('active-left'));

        // Touch configuration for OrbitControls
        this.controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };




        this.setupUI();

        this.animate();
    }

    setupLights() {
        this.ambientLight = new THREE.AmbientLight(LIGHT.AMBIENT.COLOR, LIGHT.AMBIENT.INTENSITY); // Explicit intensity
        this.scene.add(this.ambientLight);

        this.spotLight = new THREE.SpotLight(LIGHT.SPOT.COLOR, LIGHT.SPOT.INTENSITY);
        this.spotLight.position.set(LIGHT.SPOT.POS.x, LIGHT.SPOT.POS.y, LIGHT.SPOT.POS.z);
        this.spotLight.angle = LIGHT.SPOT.ANGLE;
        this.spotLight.penumbra = LIGHT.SPOT.PENUMBRA;
        this.spotLight.decay = LIGHT.SPOT.DECAY;
        this.spotLight.distance = LIGHT.SPOT.DISTANCE;
        this.spotLight.castShadow = true;
        this.spotLight.shadow.mapSize.width = LIGHT.SPOT.SHADOW.MAP_SIZE;
        this.spotLight.shadow.mapSize.height = LIGHT.SPOT.SHADOW.MAP_SIZE;
        this.spotLight.shadow.bias = LIGHT.SPOT.SHADOW.BIAS;
        this.spotLight.target.position.set(LIGHT.SPOT.TARGET.x, LIGHT.SPOT.TARGET.y, LIGHT.SPOT.TARGET.z);
        this.scene.add(this.spotLight);
        this.scene.add(this.spotLight.target);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        // We don't have easy access to bloomPass here without storing it, but for now composer resize handles the buffer.
        // A full implementation would store bloomPass as this.bloomPass and update it, but composer.setSize is usually enough for the passes.
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Sync Camera Rotation to Debug Params (Rad -> Deg)
        this.debugParams.rotX = THREE.MathUtils.radToDeg(this.camera.rotation.x).toFixed(1);
        this.debugParams.rotY = THREE.MathUtils.radToDeg(this.camera.rotation.y).toFixed(1);
        this.debugParams.rotZ = THREE.MathUtils.radToDeg(this.camera.rotation.z).toFixed(1);

        const elapsedTime = this.clock.getElapsedTime();
        const deltaTime = elapsedTime - this.oldElapsedTime;
        this.oldElapsedTime = elapsedTime;

        // Physics step
        this.world.step(1 / 60, deltaTime, 10);

        this.worldSystem.update(deltaTime);
        this.effectSystem.update(deltaTime, elapsedTime);

        this.controls.update();

        // Apply Handheld Offset (Render Only)
        this.effectSystem.applyHandheld(elapsedTime);
        this.composer.render();
        this.effectSystem.removeHandheld();
    }

    setupUI() {
        // Initialize Check-In System
        this.checkIn = new CheckIn();

        const btnAbout = document.getElementById('btn-about');
        const overlay = document.getElementById('coming-soon-overlay');

        const showOverlay = (e) => {
            e.stopPropagation(); // Prevent click from propagating to canvas
            overlay.classList.remove('hidden'); // Ensure hidden class is removed if used
            overlay.classList.add('visible');

            // Auto hide after 3 seconds
            setTimeout(() => {
                overlay.classList.remove('visible');
            }, 3000);
        };

        if (btnAbout) btnAbout.addEventListener('click', showOverlay);

        if (overlay) {
            overlay.addEventListener('click', () => {
                overlay.classList.remove('visible');
            });
        }
    }

    setupGUI() {
        const gui = new GUI({ title: 'Settings' });
        gui.domElement.style.display = 'none';

        // Custom White Theme
        const customStyle = document.createElement('style');
        customStyle.innerHTML = `
            .lil-gui { 
                --background-color: #ffffff;
                --text-color: #000000;
                --title-background-color: #f5f5f5;
                --widget-color: #e0e0e0;
                --hover-color: #d0d0d0;
                --focus-color: #e0e0e0;
                --number-color: #000000;
                --string-color: #000000;
            }
            /* Enforce black title text */
            .lil-gui .title { color: #000000 !important; font-weight: 600; }
        `;
        document.head.appendChild(customStyle);

        window.addEventListener('keydown', (event) => {
            // Check In Modal Input Focus Check
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            if (event.key.toLowerCase() === 's') {
                gui.domElement.style.display = (gui.domElement.style.display === 'none') ? 'block' : 'none';
            }
        });

        // 💡 Lights
        const lightFolder = gui.addFolder('💡 Lights');
        // Ambient Light
        lightFolder.add(this.ambientLight, 'intensity', 0, 5).step(0.1).name('Ambient Level');
        lightFolder.addColor(this.ambientLight, 'color').name('Ambient Color');

        // Spot Light (Using EffectSystem's base value to persist through flicker)
        lightFolder.add(this.effectSystem, 'BASE_SPOT_INTENSITY', 0, 5000).step(50).name('Spot Power');
        lightFolder.addColor(this.spotLight, 'color').name('Spot Color');

        const targetFolder = lightFolder.addFolder('Spot Target');
        targetFolder.add(this.spotLight.target.position, 'x', -100, 100).step(1).name('X');
        targetFolder.add(this.spotLight.target.position, 'y', -100, 100).step(1).name('Y');
        targetFolder.add(this.spotLight.target.position, 'z', -100, 100).step(1).name('Z');

        const posFolder = lightFolder.addFolder('Spot Position');
        posFolder.add(this.spotLight.position, 'x', -100, 100).step(1).name('X');
        posFolder.add(this.spotLight.position, 'y', 0, 100).step(1).name('Y');
        posFolder.add(this.spotLight.position, 'z', -100, 100).step(1).name('Z');
        posFolder.add(this.spotLight, 'angle', 0, Math.PI / 2).step(0.01).name('Cone Angle');
        posFolder.add(this.spotLight, 'penumbra', 0, 1).step(0.01).name('Softness');

        // ✨ Bloom Effect
        const bloomFolder = gui.addFolder('✨ Bloom Effect');
        bloomFolder.add(this.bloomPass, 'enabled').name('Enabled'); // Toggle
        bloomFolder.add(this.bloomPass, 'strength', 0, 3).step(0.01).name('Strength');
        bloomFolder.add(this.bloomPass, 'radius', 0, 1).step(0.01).name('Radius');
        bloomFolder.add(this.bloomPass, 'threshold', 0, 1).step(0.01).name('Threshold');

        // 🎥 Camera
        const camFolder = gui.addFolder('🎥 Camera');
        camFolder.add(this.effectSystem, 'handheldStrength', 0, 10).step(0.1).name('Handheld Shake');
        camFolder.add(this.camera, 'fov', 10, 120).step(1).name('FOV').onChange(() => {
            this.camera.updateProjectionMatrix();
        });

        // Real-time Camera Info
        const camPos = camFolder.addFolder('Position');
        camPos.add(this.camera.position, 'x').listen().disable();
        camPos.add(this.camera.position, 'y').listen().disable();
        camPos.add(this.camera.position, 'z').listen().disable();

        const camRot = camFolder.addFolder('Rotation (Degree)');
        camRot.add(this.debugParams, 'rotX').listen().disable();
        camRot.add(this.debugParams, 'rotY').listen().disable();
        camRot.add(this.debugParams, 'rotZ').listen().disable();

        // 💣 Chaos System
        const chaosFolder = gui.addFolder('💣 Chaos System');

        chaosFolder.add(CONFIG.EXPLOSION, 'FIRE_COUNT', 0, 5000).step(10).name('Fire Particles');
        chaosFolder.add(CONFIG.EXPLOSION, 'FIRE_SPEED', 0, 200).step(1).name('Explosion Speed');
        chaosFolder.add(CONFIG.EXPLOSION, 'SOOT_COUNT', 0, 5000).step(10).name('Smoke Density');
        chaosFolder.add(CONFIG.EXPLOSION, 'FRACTURE_RADIUS', 1, 20).step(0.5).name('Break Radius');

        // 🔤 Title Physics
        const titleFolder = gui.addFolder('🔤 Title Physics');
        titleFolder.add(CONFIG.TEXT_EXPLOSION, 'RADIUS', 10, 1000).step(10).name('Blast Range');
        titleFolder.add(CONFIG.TEXT_EXPLOSION, 'FORCE_BASE', 0, 200).step(1).name('Force');
        titleFolder.add(CONFIG.TEXT_EXPLOSION, 'GRAVITY', 0, 2).step(0.01).name('Gravity');
        titleFolder.add(CONFIG.TEXT_EXPLOSION, 'ROTATION_SPEED', 0, 5).step(0.1).name('Spin');

        // 📺 FX Debug
        const fxFolder = gui.addFolder('📺 FX Debug (Secret)');
        const forced = this.effectSystem.forced;

        fxFolder.add(forced, 'glitch').name('Force Glitch').listen();
        fxFolder.add(forced, 'wild').name('Force Wild Mode').listen();
        fxFolder.add(forced, 'ascii').name('Force ASCII').listen();

        fxFolder.addColor(this.asciiPass.uniforms['uColor'], 'value').name('ASCII Color');
        fxFolder.add(this.asciiPass.uniforms['scale'], 'value', 5, 50).step(1).name('ASCII Resolution');
    }
}

// Start
new App();
