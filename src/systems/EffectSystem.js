import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONFIG, LIGHT, CAMERA } from '../Config.js';
import { SimplexNoise } from '../utils/Utils.js';
import { ParticleSystem } from './ParticleSystem.js';
import { PostProcessSystem } from './PostProcessSystem.js';

export class EffectSystem {
    constructor(scene, world, camera, worldSystem, controls) {
        this.scene = scene;
        this.world = world;
        this.camera = camera;
        this.worldSystem = worldSystem; // To call fractureChair and access physics objects
        this.controls = controls;

        // Sub-systems
        this.particleSystem = new ParticleSystem(scene);
        this.postProcessSystem = new PostProcessSystem();

        this.explosions = []; // { mesh, timer, position, body }

        this.shakeIntensity = 0;

        // Lighting effects
        this.lightFlickerTimer = 0;
        this.nextFlickerTimer = 0;
        this.ambientLight = null;
        this.spotLight = null;
        this.BASE_SPOT_INTENSITY = LIGHT.SPOT.INTENSITY;

        // Assets
        const texLoader = new THREE.TextureLoader();
        this.decalTexture = texLoader.load('./assets/explosionmark.png?v=' + Date.now());

        // Title Animation State
        this.titleChars = [];
        const titleEl = document.querySelector('.title-text');
        if (titleEl) {
            const text = titleEl.innerText;
            titleEl.innerHTML = '';
            for (let char of text) {
                const span = document.createElement('span');
                span.innerText = char;
                span.style.display = 'inline-block';
                // Handle space width 
                if (char === ' ') {
                    span.style.width = '0.4em';
                    span.innerHTML = '&nbsp;';
                }
                titleEl.appendChild(span);

                this.titleChars.push({
                    element: span,
                    position: new THREE.Vector2(0, 0),
                    velocity: new THREE.Vector2(0, 0),
                    rotation: 0,
                    angularVelocity: 0,
                    active: false
                });
            }
        }

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Handheld Camera State
        this.handheldStrength = CAMERA.SHAKE.BASE_STRENGTH;
        this.noise = new SimplexNoise();
        this.originalPosition = new THREE.Vector3();
        this.originalQuaternion = new THREE.Quaternion();
    }

    setLights(ambient, spot) {
        this.ambientLight = ambient;
        this.spotLight = spot;
    }

    setPostProcessing(glitchPass, asciiPass) {
        this.postProcessSystem.setPasses(glitchPass, asciiPass);
    }

    // Expose for Debug GUI
    get forced() {
        return this.postProcessSystem.forced;
    }

    spawnBomb(clientX, clientY) {
        this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Raycast against the floor plane from WorldSystem
        const intersects = this.raycaster.intersectObject(this.worldSystem.planeMesh);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            const radius = 0.07;

            // 1. Mesh
            const geometry = new THREE.SphereGeometry(radius, 8, 8);
            const material = new THREE.MeshStandardMaterial({
                color: 0x051624,
                roughness: 0.8,
                metalness: 1.0
            });
            const bombMesh = new THREE.Mesh(geometry, material);
            bombMesh.castShadow = true;
            this.scene.add(bombMesh);

            // 2. Physics Body
            const bombBody = new CANNON.Body({
                mass: 2,
                shape: new CANNON.Sphere(radius),
                position: new CANNON.Vec3(point.x, point.y + 5, point.z),
                material: this.worldSystem.defaultMaterial,
                angularDamping: 0.1,
                linearDamping: 0.1
            });

            bombBody.velocity.set((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2);
            bombBody.angularVelocity.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);

            this.world.addBody(bombBody);

            this.explosions.push({
                mesh: bombMesh,
                body: bombBody,
                timer: 3.0,
                position: bombMesh.position
            });
        }
    }

    update(deltaTime, elapsedTime) {
        this.updateExplosions(deltaTime);
        this.particleSystem.update(deltaTime);
        this.updateShake(deltaTime); // Shake is separate, keep it
        this.updateLighting(deltaTime);
        this.updateTitlePhysics();
        this.postProcessSystem.update(deltaTime);
    }

    triggerMitosisGlitch() {
        this.postProcessSystem.triggerMitosis();
    }

    applyHandheld(elapsedTime) {
        if (this.handheldStrength <= 0) return;

        // Save original state
        this.originalPosition.copy(this.camera.position);
        this.originalQuaternion.copy(this.camera.quaternion);

        // Fractal Noise approach
        const time = elapsedTime;
        const speed1 = 0.2;
        const amp1 = 0.5;
        const speed2 = 1.5;
        const amp2 = 0.05;

        // Strength scaling
        const strength = this.handheldStrength * 0.02;

        const getNoise = (offset) => {
            const n1 = this.noise.noise2D(time * speed1, offset);
            const n2 = this.noise.noise2D(time * speed2, offset + 1000);
            return (n1 * amp1 + n2 * amp2);
        };

        const rx = getNoise(0) * strength * 1.5;
        const ry = getNoise(100) * strength * 1.5;
        const rz = getNoise(200) * strength * 4.0;

        const tx = getNoise(300) * strength * 5.0;
        const ty = getNoise(400) * strength * 5.0;
        const tz = getNoise(500) * strength * 5.0;

        // Apply offsets relative to current camera frame
        this.camera.translateX(tx);
        this.camera.translateY(ty);
        this.camera.translateZ(tz);

        // Apply rotation on top
        this.camera.rotation.x += rx;
        this.camera.rotation.y += ry;
        this.camera.rotation.z += rz;
    }

    removeHandheld() {
        if (this.handheldStrength <= 0) return;

        // Restore state
        this.camera.position.copy(this.originalPosition);
        this.camera.quaternion.copy(this.originalQuaternion);
    }

    updateExplosions(deltaTime) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const bomb = this.explosions[i];
            bomb.timer -= deltaTime;

            if (bomb.body) {
                bomb.mesh.position.copy(bomb.body.position);
                bomb.mesh.quaternion.copy(bomb.body.quaternion);
                bomb.position.copy(bomb.body.position);
            }

            if (bomb.timer > 0) {
                // Fuse Effect: Smoke instead of Sparkler
                const smokeCount = 3;
                for (let k = 0; k < smokeCount; k++) {
                    this.particleSystem.spawn(bomb.position, 'smoke');
                }
            }
            else {
                this.explode(bomb);
                this.scene.remove(bomb.mesh);
                if (bomb.body) this.world.removeBody(bomb.body);
                this.explosions.splice(i, 1);
            }
        }
    }

    explode(bomb) {
        const center = bomb.position;
        const radius = CONFIG.EXPLOSION.BLAST_RADIUS;
        const force = CONFIG.EXPLOSION.BLAST_FORCE;

        // Visual FX
        this.shakeIntensity = 2;
        // this.lightFlickerTimer = 8.0; // Disabled by user request
        this.particleSystem.createFlash(center);
        this.triggerTitleExplosion(center);
        this.createDecal(center);

        // Trigger Glitch
        this.postProcessSystem.triggerExplosion();

        for (let i = 0; i < CONFIG.EXPLOSION.FIRE_COUNT; i++) this.particleSystem.spawn(center, 'fire');
        for (let i = 0; i < 150; i++) this.particleSystem.spawn(center, 'dust');
        for (let i = 0; i < 100; i++) this.particleSystem.spawn(center, 'spark');
        for (let i = 0; i < CONFIG.EXPLOSION.SOOT_COUNT; i++) this.particleSystem.spawn(center, 'soot');
        for (let i = 0; i < CONFIG.EXPLOSION.DEFLAGRATION_COUNT; i++) this.particleSystem.spawn(center, 'deflagration');

        // Physics Impulse to Chairs
        const targets = [...this.worldSystem.objectsToUpdate];
        for (const obj of targets) {
            const body = obj.body;
            const dist = body.position.distanceTo(center);
            if (dist < radius) {
                const dir = body.position.vsub(center);
                dir.normalize();
                if (dist < CONFIG.EXPLOSION.FRACTURE_RADIUS) {
                    this.worldSystem.fractureChair(obj, center, force);
                } else {
                    const impulse = dir.scale(force * (1 - dist / radius));
                    body.applyImpulse(impulse, body.position);
                }
            }
        }

        // Physics Impulse to Debris
        for (const debris of this.worldSystem.debrisObjects) {
            const dist = debris.body.position.distanceTo(center);
            if (dist < radius) {
                const dir = debris.body.position.vsub(center);
                dir.normalize();
                const impulse = dir.scale((force * 0.5) * (1 - dist / radius));
                debris.body.applyImpulse(impulse, debris.body.position);
            }
        }

    }

    createDecal(position) {
        const size = 7 + Math.random() * 2;
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshBasicMaterial({
            map: this.decalTexture,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1
        });

        const decal = new THREE.Mesh(geometry, material);
        decal.position.set(position.x, 0.02, position.z);
        decal.rotation.x = -Math.PI / 2;
        decal.rotation.z = Math.random() * Math.PI * 2;

        this.scene.add(decal);
    }

    updateShake(deltaTime) {
        if (this.shakeIntensity > 0) {
            const shakePower = 0.5 * this.shakeIntensity;
            const rx = (Math.random() - 0.5) * shakePower;
            const ry = (Math.random() - 0.5) * shakePower;
            const rz = (Math.random() - 0.5) * shakePower;

            const shakeVec = new THREE.Vector3(rx, ry, rz);
            this.camera.position.add(shakeVec);
            if (this.controls) {
                this.controls.target.add(shakeVec);
            }

            this.shakeIntensity -= deltaTime * 2.0;
            if (this.shakeIntensity < 0) this.shakeIntensity = 0;
        }
    }

    updateLighting(deltaTime) {
        if (!this.spotLight || !this.ambientLight) return;

        // Use the instance variable BASE_SPOT_INTENSITY (controlled by GUI)
        const baseIntensity = this.BASE_SPOT_INTENSITY;

        if (this.lightFlickerTimer > 0) {
            this.lightFlickerTimer -= deltaTime;
            this.nextFlickerTimer -= deltaTime;

            if (this.nextFlickerTimer <= 0) {
                const malfunctionChance = (this.lightFlickerTimer / 5.0);

                if (Math.random() < malfunctionChance) {
                    const rand = Math.random();
                    if (rand < 0.6) {
                        this.spotLight.intensity = 0;
                        this.ambientLight.intensity = 0.05;
                        this.nextFlickerTimer = 0.03 + Math.random() * 0.07;
                    } else if (rand < 0.9) {
                        this.spotLight.intensity = baseIntensity * (0.1 + Math.random() * 0.3);
                        this.ambientLight.intensity = 0.2;
                        this.nextFlickerTimer = 0.05 + Math.random() * 0.1;
                    } else {
                        this.spotLight.intensity = baseIntensity * 1.5;
                        this.ambientLight.intensity = 1.2;
                        this.nextFlickerTimer = 0.02 + Math.random() * 0.05;
                    }
                } else {
                    this.spotLight.intensity = baseIntensity;
                    this.ambientLight.intensity = 1.0;
                    this.nextFlickerTimer = 0.1 + Math.random() * 0.3;
                }
            }
        } else {
            // When not flickering, adhere strictly to the GUI value
            // We do not reset Ambient here because it is controlled directly by GUI.
            this.spotLight.intensity = baseIntensity;
        }
    }

    triggerTitleExplosion(bombPosition) {
        const screenPos = bombPosition.clone().project(this.camera);
        if (screenPos.z > 1) return;

        const bombX = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const bombY = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

        const explosionRadius = CONFIG.TEXT_EXPLOSION.RADIUS; // pixels

        this.titleChars.forEach(char => {
            const rect = char.element.getBoundingClientRect();
            const charX = rect.left + rect.width / 2;
            const charY = rect.top + rect.height / 2;

            const dx = charX - bombX;
            const dy = charY - bombY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < explosionRadius) {
                char.active = true;
                const len = Math.max(dist, 1);
                // Normalized direction
                const nx = dx / len;
                const ny = dy / len;

                // Force falloff
                const forceBase = CONFIG.TEXT_EXPLOSION.FORCE_BASE;
                const forceVar = CONFIG.TEXT_EXPLOSION.FORCE_VAR;
                const force = (1.0 - dist / explosionRadius) * forceBase + forceVar;

                char.velocity.x += nx * force + (Math.random() - 0.5) * forceVar;
                char.velocity.y += ny * force + (Math.random() - 0.5) * forceVar;
                char.angularVelocity += (Math.random() - 0.5) * CONFIG.TEXT_EXPLOSION.ROTATION_SPEED;
            }
        });
    }

    updateTitlePhysics() {
        this.titleChars.forEach(char => {
            if (!char.active) return;

            // Gravity
            char.velocity.y += CONFIG.TEXT_EXPLOSION.GRAVITY;
            char.velocity.x *= CONFIG.TEXT_EXPLOSION.DRAG; // Air resistance
            char.velocity.y *= CONFIG.TEXT_EXPLOSION.DRAG;

            char.position.x += char.velocity.x;
            char.position.y += char.velocity.y;
            char.rotation += char.angularVelocity;

            char.element.style.transform = `translate(${char.position.x}px, ${char.position.y}px) rotate(${char.rotation}rad)`;
        });
    }
}
