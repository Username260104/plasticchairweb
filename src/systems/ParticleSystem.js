import * as THREE from 'three';
import { CONFIG } from '../Config.js';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];

        // Geometries
        this.particleGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        this.sphereParticleGeo = new THREE.SphereGeometry(0.5, 8, 8);
        this.fireColors = CONFIG.EXPLOSION.PARTICLE_COLORS.FIRE;
    }

    spawn(position, type) {
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
            color = CONFIG.EXPLOSION.PARTICLE_COLORS.DUST;
            life = 1.5 + Math.random() * 1.5;
            velocity.set((Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 8);
            size = 0.8 + Math.random() * 1.5;
        } else if (type === 'spark') {
            color = CONFIG.EXPLOSION.PARTICLE_COLORS.SPARK;
            life = 0.3 + Math.random() * 0.4;
            velocity.set((Math.random() - 0.5) * 25, Math.random() * 20, (Math.random() - 0.5) * 25);
            size = 0.5;
        } else if (type === 'soot') {
            color = CONFIG.EXPLOSION.PARTICLE_COLORS.SOOT;
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
            color = CONFIG.EXPLOSION.PARTICLE_COLORS.SPARKLER; // Gold
            life = 0.1 + Math.random() * 0.3; // Slightly longer variance
            // Full spherical randomness
            const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
            const speed = 10 + Math.random() * 20; // High speed variation
            velocity.copy(dir).multiplyScalar(speed);

            size = 0.15 + Math.random() * 0.15; // Varied size
        } else { // smoke
            // Tuned Dark Smoke for Fuse
            color = CONFIG.EXPLOSION.PARTICLE_COLORS.SMOKE;
            life = 1.5 + Math.random() * 1.5; // Longer life (1.5 ~ 3.0s)

            // Gentle rise
            velocity.set(
                (Math.random() - 0.5) * 0.5,
                0.5 + Math.random() * 1.0,
                (Math.random() - 0.5) * 0.5
            );

            size = 0.3; // Small Fixed Size
        }

        const materialParams = { color: color, transparent: true, opacity: 0.8 };
        if (type === 'fire') {
            materialParams.blending = THREE.AdditiveBlending;
            materialParams.depthWrite = false;
        }

        const material = new THREE.MeshBasicMaterial(materialParams);
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

    update(deltaTime) {
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
}
