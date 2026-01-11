import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CONFIG } from './Config.js';

export class EffectSystem {
    constructor(scene, world, camera, worldSystem) {
        this.scene = scene;
        this.world = world;
        this.camera = camera;
        this.worldSystem = worldSystem; // To call fractureChair and access physics objects

        this.explosions = []; // { mesh, timer, position, body }
        this.particles = [];  // { mesh, velocity, life, maxLife, type }

        this.shakeIntensity = 0;

        // Lighting effects
        this.lightFlickerTimer = 0;
        this.nextFlickerTimer = 0;
        this.ambientLight = null;
        this.spotLight = null;
        this.BASE_SPOT_INTENSITY = 800;

        // Assets
        const texLoader = new THREE.TextureLoader();
        this.decalTexture = texLoader.load('./assets/explosionmark.png?v=' + Date.now());

        // Particle Geometries
        this.particleGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        this.sphereParticleGeo = new THREE.SphereGeometry(0.5, 8, 8);
        this.fireColors = [0xff4500, 0xff8c00, 0xffd700];

        // Title Animation State
        this.titleState = {
            active: false,
            position: new THREE.Vector2(0, 0),
            velocity: new THREE.Vector2(0, 0),
            rotation: 0,
            angularVelocity: 0
        };

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    setLights(ambient, spot) {
        this.ambientLight = ambient;
        this.spotLight = spot;
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

    update(deltaTime) {
        this.updateExplosions(deltaTime);
        this.updateParticles(deltaTime);
        this.updateShake(deltaTime);
        this.updateLighting(deltaTime);
        this.updateTitlePhysics();
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
                if (Math.random() < 0.4) {
                    this.spawnParticle(bomb.position, 'smoke');
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
        const radius = 60;
        const force = 10;

        // Visual FX
        this.shakeIntensity = 2;
        this.lightFlickerTimer = 8.0;
        this.createFlash(center);
        this.triggerTitleExplosion(center);
        this.createDecal(center);

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

            if (p.type === 'dust' || p.type === 'spark' || p.type === 'soot') {
                const gravity = (p.type === 'soot') ? 25 : 15;
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

            this.camera.position.add(new THREE.Vector3(rx, ry, rz));

            this.shakeIntensity -= deltaTime * 2.0;
            if (this.shakeIntensity < 0) this.shakeIntensity = 0;
        }
    }

    updateLighting(deltaTime) {
        if (!this.spotLight || !this.ambientLight) return;

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
                        this.spotLight.intensity = this.BASE_SPOT_INTENSITY * (0.1 + Math.random() * 0.3);
                        this.ambientLight.intensity = 0.2;
                        this.nextFlickerTimer = 0.05 + Math.random() * 0.1;
                    } else {
                        this.spotLight.intensity = this.BASE_SPOT_INTENSITY * 1.5;
                        this.ambientLight.intensity = 1.2;
                        this.nextFlickerTimer = 0.02 + Math.random() * 0.05;
                    }
                } else {
                    this.spotLight.intensity = this.BASE_SPOT_INTENSITY;
                    this.ambientLight.intensity = 1.0;
                    this.nextFlickerTimer = 0.1 + Math.random() * 0.3;
                }
            }
        } else {
            this.spotLight.intensity = this.BASE_SPOT_INTENSITY;
            this.ambientLight.intensity = 1.0;
            this.nextFlickerTimer = 0;
        }
    }

    triggerTitleExplosion(bombPosition) {
        if (this.titleState.active) return;

        const screenPos = bombPosition.clone().project(this.camera);

        if (screenPos.z > 1) return;

        const dir = new THREE.Vector2(-screenPos.x, -screenPos.y);
        const dist = dir.length();

        if (dist < 1.5) {
            this.titleState.active = true;
            dir.normalize();

            const force = 0.05 + Math.random() * 0.05;
            this.titleState.velocity.copy(dir).multiplyScalar(force);
            this.titleState.angularVelocity = (Math.random() - 0.5) * 0.2;
        }
    }

    updateTitlePhysics() {
        if (!this.titleState.active) return;

        this.titleState.velocity.y -= 0.001;
        this.titleState.position.add(this.titleState.velocity);
        this.titleState.rotation += this.titleState.angularVelocity;

        const titleEl = document.querySelector('.title-text');
        if (titleEl) {
            const tx = this.titleState.position.x * 50;
            const ty = -this.titleState.position.y * 50;
            titleEl.style.transform = `translate(${tx}vw, ${ty}vh) rotate(${this.titleState.rotation}rad)`;
        }
    }
}
