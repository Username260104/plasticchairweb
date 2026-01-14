import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { GUI } from 'lil-gui';

import { CONFIG } from './Config.js';
import { WorldSystem } from './World.js';
import { EffectSystem } from './Effects.js';

class App {
    constructor() {
        // 1. Core Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.Fog(0x050505, 20, 100);

        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.allowSleep = true;

        this.fov = 85;
        this.camera = new THREE.PerspectiveCamera(this.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 2, 7);

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

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 1.0;
        bloomPass.strength = 1.5;
        bloomPass.radius = 0.4;
        this.composer.addPass(bloomPass);



        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: null
        };

        // 2. Systems
        this.worldSystem = new WorldSystem(this.scene, this.world, this.camera, this.renderer);
        this.effectSystem = new EffectSystem(this.scene, this.world, this.camera, this.worldSystem, this.controls);

        // Bind events
        this.worldSystem.onRightClick = (x, y) => this.effectSystem.spawnBomb(x, y);
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

        // Touch configuration for OrbitControls
        this.controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.PAN
        };

        this.animate();
    }

    setupLights() {
        this.ambientLight = new THREE.AmbientLight(0x333333);
        this.scene.add(this.ambientLight);

        this.spotLight = new THREE.SpotLight(0xffffff, 800);
        this.spotLight.position.set(-10, 8, -5);
        this.spotLight.angle = Math.PI / 4.5;
        this.spotLight.penumbra = 1;
        this.spotLight.decay = 2;
        this.spotLight.distance = 100;
        this.spotLight.castShadow = true;
        this.spotLight.shadow.mapSize.width = 2048;
        this.spotLight.shadow.mapSize.height = 2048;
        this.spotLight.shadow.bias = -0.00001;
        this.scene.add(this.spotLight);
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

        const elapsedTime = this.clock.getElapsedTime();
        const deltaTime = elapsedTime - this.oldElapsedTime;
        this.oldElapsedTime = elapsedTime;

        // Physics step
        this.world.step(1 / 60, deltaTime, 10);

        this.worldSystem.update(deltaTime);
        this.effectSystem.update(deltaTime);

        this.controls.update();
        this.composer.render();
    }

    setupGUI() {
        const gui = new GUI();
        gui.domElement.style.display = 'none';

        window.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 's') {
                if (gui.domElement.style.display === 'none') {
                    gui.domElement.style.display = 'block';
                } else {
                    gui.domElement.style.display = 'none';
                }
            }
        });

        const lightFolder = gui.addFolder('Lights');
        const ambientFolder = lightFolder.addFolder('Ambient Light');
        ambientFolder.add(this.ambientLight, 'intensity', 0, 2).name('Intensity');
        ambientFolder.addColor(this.ambientLight, 'color').name('Color');

        const spotFolder = lightFolder.addFolder('Spot Light');
        spotFolder.add(this.spotLight, 'intensity', 0, 2000).name('Intensity');
        spotFolder.addColor(this.spotLight, 'color').name('Color');
        spotFolder.add(this.spotLight.position, 'x', -50, 50).name('Pos X');
        spotFolder.add(this.spotLight.position, 'y', 0, 50).name('Pos Y');
        spotFolder.add(this.spotLight.position, 'z', -50, 50).name('Pos Z');
        spotFolder.add(this.spotLight, 'angle', 0, Math.PI / 2).name('Angle');
        spotFolder.add(this.spotLight, 'penumbra', 0, 1).name('Penumbra');

        const cameraFolder = gui.addFolder('Camera');
        cameraFolder.add(this.camera.position, 'x', -100, 100).name('Pos X');
        cameraFolder.add(this.camera.position, 'y', -100, 100).name('Pos Y');
        cameraFolder.add(this.camera.position, 'z', -100, 100).name('Pos Z');
        cameraFolder.add(this.camera, 'fov', 10, 100).name('FOV').onChange(() => {
            this.camera.updateProjectionMatrix();
        });

        const explosionFolder = gui.addFolder('Explosion & Visuals');


        const fireFolder = explosionFolder.addFolder('Fire Particles');
        fireFolder.add(CONFIG.EXPLOSION, 'FIRE_SPEED', 0, 100).name('Speed');
        fireFolder.add(CONFIG.EXPLOSION, 'FIRE_SIZE_MIN', 0.1, 5).name('Size Min');
        fireFolder.add(CONFIG.EXPLOSION, 'FIRE_SIZE_MAX', 0.1, 5).name('Size Max');

        const textFolder = explosionFolder.addFolder('Text Explosion');
        textFolder.add(CONFIG.TEXT_EXPLOSION, 'RADIUS', 0, 1000).name('Radius');
        textFolder.add(CONFIG.TEXT_EXPLOSION, 'FORCE_BASE', 0, 100).name('Force Base');
        textFolder.add(CONFIG.TEXT_EXPLOSION, 'FORCE_VAR', 0, 20).name('Force Random');
        textFolder.add(CONFIG.TEXT_EXPLOSION, 'GRAVITY', 0, 2).name('Gravity');
        textFolder.add(CONFIG.TEXT_EXPLOSION, 'DRAG', 0.9, 1.0).name('Drag');
        textFolder.add(CONFIG.TEXT_EXPLOSION, 'ROTATION_SPEED', 0, 2).name('Rotation');
    }
}

// Start
new App();
