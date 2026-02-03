import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONFIG, LIGHT } from './Config.js';
import { SimplexNoise } from './Utils.js';

export class EffectSystem {
    constructor(scene, world, camera, worldSystem, controls) {
        this.scene = scene;
        this.world = world;
        this.camera = camera;
        this.worldSystem = worldSystem; // To call fractureChair and access physics objects
        this.controls = controls;

        this.explosions = []; // { mesh, timer, position, body }
        this.particles = [];  // { mesh, velocity, life, maxLife, type }

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

        // Particle Geometries
        this.particleGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        this.sphereParticleGeo = new THREE.SphereGeometry(0.5, 8, 8);
        this.fireColors = [0xff4500, 0xff8c00, 0xffd700];

        // Title Animation State
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
        this.handheldStrength = 0.2;
        this.noise = new SimplexNoise();
        this.originalPosition = new THREE.Vector3();
        this.originalQuaternion = new THREE.Quaternion();
    }

    setLights(ambient, spot) {
        this.ambientLight = ambient;
        this.spotLight = spot;
    }

    setPostProcessing(glitchPass, asciiPass) {
        this.glitchPass = glitchPass;
        this.asciiPass = asciiPass;
        this.glitchTimer = 0;
        this.glitchPhase = 0; // 0: None, 1: Wild, 2: Decay, 3: Echo

        // Manual Debug Flags
        this.forced = {
            glitch: false,
            wild: false,
            ascii: false
        };

        this.asciiDurationTimer = 0; // To sustain ASCII effect
        this.shortBurst = false; // Deterministic glitch flag
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
        this.updateParticles(deltaTime);
        this.updateShake(deltaTime); // Shake is separate, keep it
        this.updateLighting(deltaTime);
        this.updateTitlePhysics();
        this.updateGlitch(deltaTime);
    }

    updateGlitch(deltaTime) {
        // Manual override check
        if (this.forced.glitch || this.forced.ascii) {
            if (this.glitchPass) {
                this.glitchPass.enabled = this.forced.glitch;
                this.glitchPass.goWild = this.forced.wild;
            }
            if (this.asciiPass) {
                this.asciiPass.enabled = this.forced.ascii;
            }
            return; // SKIP AUTOMATION
        }

        if (this.glitchTimer > 0) {
            this.glitchTimer -= deltaTime;

            // Handle ASCII Duration
            if (this.asciiDurationTimer > 0) {
                this.asciiDurationTimer -= deltaTime;
                if (this.asciiPass) this.asciiPass.enabled = true;
            } else {
                if (this.asciiPass) this.asciiPass.enabled = false;
            }

            // Phase 0: SHORT BURST (Deterministic)
            if (this.shortBurst) {
                if (this.glitchPass) {
                    this.glitchPass.enabled = true;
                    this.glitchPass.goWild = true;
                }
                // ASCII is handled by Duration Timer above
                return; // Override other phases
            }

            // Phase 1: IMPACT (> 7.7) - Total Chaos (0.3s)
            if (this.glitchTimer > 7.7) {
                this.glitchPhase = 1;

                // Trigger ASCII with high probability
                if (this.asciiDurationTimer <= 0 && this.asciiPass) {
                    if (Math.random() < 0.3) { // 30% chance
                        // Sustained Duration (High Frame Count)
                        this.asciiDurationTimer = 0.1 + Math.random() * 0.2;
                        // Scale Fixed at 14.0 (Fine Grain) - ROLLED BACK "Thick" Randomization
                        this.asciiPass.uniforms['scale'].value = 14.0;
                    }
                }
            }
            // Phase 2: DECAY (5.0 ~ 7.7) - Calming Down (2.7s)
            else if (this.glitchTimer > 5.0) {
                this.glitchPhase = 2;

                // Disable Wild Glitch from Phase 1
                if (this.glitchPass) {
                    this.glitchPass.enabled = false;
                    this.glitchPass.goWild = false;
                }

                // Occasional Glitch Spikes
                if (Math.random() < 0.05) {
                    if (this.glitchPass) {
                        this.glitchPass.enabled = true;
                        this.glitchPass.goWild = (Math.random() < 0.5);
                    }
                    if (this.asciiDurationTimer <= 0 && this.asciiPass && Math.random() < 0.2) {
                        this.asciiDurationTimer = 0.05 + Math.random() * 0.1;
                        this.asciiPass.uniforms['scale'].value = 14.0; // Fixed Scale
                    }
                }
            }
            // Phase 3: LONG ECHO (< 5.0) - Intermittent Flickering (5.0s)
            else {
                this.glitchPhase = 3;

                // Randomly trigger independent effects
                // 1. Glitch Pass (Very Rare)
                if (Math.random() < 0.01) {
                    this.glitchPass.enabled = true;
                    this.glitchPass.goWild = (Math.random() < 0.3);
                } else {
                    this.glitchPass.enabled = false;
                    this.glitchPass.goWild = false;
                }

                // 3. ASCII Pass (Very Rare but sustained)
                if (this.asciiDurationTimer <= 0 && this.asciiPass) {
                    if (Math.random() < 0.01) { // 1% chance
                        this.asciiDurationTimer = 0.1 + Math.random() * 0.2; // Hold
                        this.asciiPass.uniforms['scale'].value = 14.0; // Fixed Scale
                    }
                }
            }
        } else {
            // Check for Short Burst Reset
            this.shortBurst = false;

            // Handle residual ASCII duration if any
            if (this.asciiDurationTimer > 0) {
                this.asciiDurationTimer -= deltaTime;
                if (this.asciiPass) this.asciiPass.enabled = true;
            } else {
                if (this.asciiPass) this.asciiPass.enabled = false;
            }

            if (this.glitchPass) {
                this.glitchPass.enabled = false;
                this.glitchPass.goWild = false;
            }
            this.glitchPhase = 0;
        }
    }

    triggerMitosisGlitch() {
        // Randomly choose ONE effect (Exclusive OR) to reduce visual noise
        const useGlitch = Math.random() < 0.5;

        if (useGlitch) {
            // Option A: Glitch Pass Only
            this.shortBurst = true;
            this.glitchTimer = 0.1; // Reduced duration
            this.asciiDurationTimer = 0;
        } else {
            // Option B: ASCII Pass Only
            this.shortBurst = false;
            this.asciiDurationTimer = 0.1;
            if (this.asciiPass) {
                this.asciiPass.uniforms['scale'].value = 14.0;
            }
        }
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
                // Sparkler Effect (Burning FUSE)
                const sparkCount = 3 + Math.floor(Math.random() * 3);
                for (let k = 0; k < sparkCount; k++) {
                    this.spawnParticle(bomb.position, 'sparkler');
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
        this.createFlash(center);
        this.triggerTitleExplosion(center);
        this.createDecal(center);

        // Trigger Glitch
        if (this.glitchPass) {
            this.glitchTimer = 8.0; // Extended Duration for Long Echo
            this.glitchPhase = 1; // Start Impact
            this.glitchPass.enabled = true;
            this.glitchPass.goWild = true; // Start HARD
        }

        for (let i = 0; i < CONFIG.EXPLOSION.FIRE_COUNT; i++) this.spawnParticle(center, 'fire');
        for (let i = 0; i < 150; i++) this.spawnParticle(center, 'dust');
        for (let i = 0; i < 100; i++) this.spawnParticle(center, 'spark');
        for (let i = 0; i < CONFIG.EXPLOSION.SOOT_COUNT; i++) this.spawnParticle(center, 'soot');
        for (let i = 0; i < CONFIG.EXPLOSION.DEFLAGRATION_COUNT; i++) this.spawnParticle(center, 'deflagration');

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

    createFlash(position) {
        const light = new THREE.PointLight(0xffffff, 20000, 60);
        light.position.copy(position);
        light.position.y += 2;
        this.scene.add(light);

        const geometry = new THREE.SphereGeometry(1.5, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const flashMesh = new THREE.Mesh(geometry, material);
        flashMesh.position.copy(position);
        flashMesh.position.y += 2;
        this.scene.add(flashMesh);

        this.particles.push({
            type: 'light',
            light: light,
            flashMesh: flashMesh,
            life: 0.15,
            maxLife: 0.15
        });
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

    spawnParticle(position, type) {
        let life = 1.0;
        let velocity = new THREE.Vector3();
        let color = 0x555555;
        let size = 1.0;

        let selectedGeo = this.particleGeo;

        if (type === 'fire') {
            selectedGeo = this.sphereParticleGeo;
            const c = new THREE.Color(this.fireColors[Math.floor(Math.random() * this.fireColors.length)]);
            c.multiplyScalar(CONFIG.EXPLOSION.FIRE_EMISSIVE_INTENSITY);
            color = c;

            life = 0.4 + Math.random() * 0.6;
            const speed = CONFIG.EXPLOSION.FIRE_SPEED;
            velocity.set((Math.random() - 0.5) * speed, Math.random() * speed, (Math.random() - 0.5) * speed);

            const minSize = CONFIG.EXPLOSION.FIRE_SIZE_MIN;
            const maxSize = CONFIG.EXPLOSION.FIRE_SIZE_MAX;
            size = minSize + Math.random() * (maxSize - minSize);
        } else if (type === 'dust') {
            color = 0xffffff;
            life = 1.5 + Math.random() * 1.5;
            velocity.set((Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 8);
            size = 0.8 + Math.random() * 1.5;
        } else if (type === 'spark') {
            color = 0xffffff;
            life = 0.3 + Math.random() * 0.4;
            velocity.set((Math.random() - 0.5) * 25, Math.random() * 20, (Math.random() - 0.5) * 25);
            size = 0.5;
        } else if (type === 'soot') {
            color = 0x000000;
            life = 15.0 + Math.random() * 10.0;
            const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
            const speed = 5 + Math.random() * 25;
            velocity.copy(dir).multiplyScalar(speed);
            if (velocity.y < 0) velocity.y *= -0.5;
            const min = CONFIG.EXPLOSION.SOOT_SIZE_MIN;
            const range = CONFIG.EXPLOSION.SOOT_SIZE_MAX - min;
            size = min + Math.random() * range;
        } else if (type === 'deflagration') {
            selectedGeo = this.sphereParticleGeo;
            const cVal = 0.1 + Math.random() * 0.2;
            color = new THREE.Color(cVal, cVal, cVal);
            life = CONFIG.EXPLOSION.DEFLAGRATION_LIFE_MIN + Math.random() * (CONFIG.EXPLOSION.DEFLAGRATION_LIFE_MAX - CONFIG.EXPLOSION.DEFLAGRATION_LIFE_MIN);

            velocity.set(
                (Math.random() - 0.5) * 2,
                2.0 + Math.random() * 3.0,
                (Math.random() - 0.5) * 2
            );
            size = 1.0 + Math.random() * 2.0;
        } else if (type === 'sparkler') {
            // New Effect: Bright sparks for fuse - MORE CHAOS
            color = 0xffd700; // Gold
            life = 0.1 + Math.random() * 0.3; // Slightly longer variance
            // Full spherical randomness
            const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
            const speed = 10 + Math.random() * 20; // High speed variation
            velocity.copy(dir).multiplyScalar(speed);

            // Add slight upward bias naturally? No, user said "everywhere". 
            // But usually sparklers shoot out. Let's keep it purely random direction + gravity handles the arc.
            // Maybe slight bias relative to something? No, pure chaos is requested.

            size = 0.15 + Math.random() * 0.15; // Varied size
        } else { // smoke
            color = 0xaaaaaa;
            life = 1.0 + Math.random();
            velocity.set((Math.random() - 0.5) * 2, 2 + Math.random() * 2, (Math.random() - 0.5) * 2);
            size = 1.0;
        }

        const material = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8 });
        const mesh = new THREE.Mesh(selectedGeo, material);
        mesh.position.copy(position);

        if (type === 'deflagration') {
            mesh.position.add(new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random()) * 2, (Math.random() - 0.5) * 3));
            material.opacity = 0.0;
        }

        mesh.scale.set(size, size, size);
        this.scene.add(mesh);

        this.particles.push({
            mesh: mesh,
            velocity: velocity,
            life: life,
            maxLife: life,
            type: type,
            initialScale: size
        });
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            if (p.type === 'light') {
                p.life -= deltaTime;
                const lifeRatio = p.life / p.maxLife;

                p.light.intensity = 20000 * lifeRatio;

                if (p.flashMesh) {
                    const s = 1.0 + (1.0 - lifeRatio) * 20.0;
                    p.flashMesh.scale.set(s, s, s);
                    p.flashMesh.material.transparent = true;
                    p.flashMesh.material.opacity = lifeRatio;
                }

                if (p.life <= 0) {
                    this.scene.remove(p.light);
                    if (p.flashMesh) {
                        this.scene.remove(p.flashMesh);
                        p.flashMesh.geometry.dispose();
                        p.flashMesh.material.dispose();
                    }
                    this.particles.splice(i, 1);
                }
                continue;
            }

            p.life -= deltaTime;
            const lifeRatio = p.life / p.maxLife;

            if (p.type === 'dust' || p.type === 'spark' || p.type === 'soot' || p.type === 'sparkler') {
                let gravity = 15;
                if (p.type === 'soot') gravity = 25;
                if (p.type === 'sparkler') gravity = 30;
                p.velocity.y -= gravity * deltaTime;
            }

            if (p.type === 'deflagration') {
                p.velocity.y += 0.5 * deltaTime;
                p.velocity.multiplyScalar(0.98);
            }

            if (p.type === 'smoke' || p.type === 'soot') {
                const drag = (p.type === 'soot') ? 0.92 : 0.95;
                p.velocity.multiplyScalar(drag);
            }

            if (p.type === 'soot' && p.mesh.position.y <= 0.05) {
                p.velocity.set(0, 0, 0);
                p.mesh.position.y = 0.01;
            } else {
                p.mesh.position.addScaledVector(p.velocity, deltaTime);
            }

            if (p.type === 'deflagration') {
                p.mesh.rotation.z += deltaTime * 0.1;
                p.mesh.rotation.x += deltaTime * 0.1;
            } else {
                if (p.type !== 'soot' || p.velocity.lengthSq() > 0.001) {
                    p.mesh.rotation.x += deltaTime * 5;
                    p.mesh.rotation.y += deltaTime * 5;
                }
            }

            if (p.type === 'smoke') {
                const s = p.initialScale * (2.0 - lifeRatio);
                p.mesh.scale.set(s, s, s);
            } else if (p.type === 'fire') {
                const s = p.initialScale * Math.sin(lifeRatio * Math.PI);
                p.mesh.scale.set(s, s, s);
            } else if (p.type === 'deflagration') {
                const puffProgress = 1.0 - lifeRatio;
                const s = p.initialScale * (1.0 + puffProgress * 4.0);
                p.mesh.scale.set(s, s, s);

                let opacity = 0;
                if (puffProgress < 0.2) opacity = (puffProgress / 0.2) * 0.6;
                else if (puffProgress < 0.6) opacity = 0.6;
                else opacity = 0.6 * (1.0 - (puffProgress - 0.6) / 0.4);
                p.mesh.material.opacity = Math.max(0, opacity);
            } else if (p.type === 'sparkler') {
                const s = p.initialScale * lifeRatio;
                p.mesh.scale.set(s, s, s);
            }

            if (p.type !== 'deflagration') {
                p.mesh.material.opacity = (p.type === 'soot') ? Math.min(0.8, lifeRatio * 2.0) : lifeRatio * 0.8;
            }

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }
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
