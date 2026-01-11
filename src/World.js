import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { S, LEG_W, LEG_H, SEAT_W, SEAT_H, BACK_W, BACK_H, BACK_D, COM_OFFSET_Y, CONFIG } from './Config.js';
import { GUI } from 'lil-gui';

export class WorldSystem {
    constructor(scene, world, camera, renderer) {
        this.scene = scene;
        this.world = world;
        this.camera = camera;
        this.renderer = renderer;

        this.objectsToUpdate = []; // { mesh, body, comOffsetY }
        this.debrisObjects = [];   // { mesh, body }

        // Materials
        this.defaultMaterial = new CANNON.Material('default');
        this.defaultContactMaterial = new CANNON.ContactMaterial(this.defaultMaterial, this.defaultMaterial, {
            friction: 0.7,
            restitution: 0.1,
        });
        this.world.addContactMaterial(this.defaultContactMaterial);

        // Interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isDragging = false;
        this.mouseConstraint = null;
        this.mouseBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC });
        this.mouseBody.collisionFilterGroup = 0;
        this.mouseBody.collisionFilterMask = 0;
        this.world.addBody(this.mouseBody);

        this.dragPlane = new THREE.Plane();
        this.planeIntersectPoint = new THREE.Vector3();

        // Floor
        this.planeMesh = null; // Reference for bomb spawn raycast

        // Chair Assets
        this.loader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        this.loader.setDRACOLoader(this.dracoLoader);
    }

    init() {
        this.createFloor();
        this.loadChairs();
        this.setupInteraction();
    }

    createFloor() {
        // Visual
        const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
        const planeMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.8,
            metalness: 0.1
        });
        this.planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        this.planeMesh.rotation.x = -Math.PI / 2;
        this.planeMesh.receiveShadow = true;
        this.scene.add(this.planeMesh);

        // Physics
        const planeShape = new CANNON.Plane();
        const planeBody = new CANNON.Body({ mass: 0, material: this.defaultMaterial });
        planeBody.addShape(planeShape);
        planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(planeBody);
    }

    loadChairs() {
        // Chair Setup
        const radius = 4;
        const chairCount = 8;
        const CHAOS_ANGLE = 0.2;
        const CHAOS_RADIUS = 1.1;
        const CHAOS_ROTATION = 0.3;

        this.loader.load(
            './assets/chair.glb?v=' + Date.now(),
            (gltf) => {
                const originalChair = gltf.scene;
                const scale = S;
                originalChair.scale.set(scale, scale, scale);

                originalChair.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                for (let i = 0; i < chairCount; i++) {
                    const chairMesh = originalChair.clone();

                    // 위치 계산
                    let angle = (i / chairCount) * Math.PI * 2;
                    const angleRandomness = (Math.random() - 0.5) * CHAOS_ANGLE;
                    const radiusRandomness = (Math.random() - 0.5) * CHAOS_RADIUS;
                    angle += angleRandomness;
                    const currentRadius = radius + radiusRandomness;
                    const x = Math.cos(angle) * currentRadius;
                    const z = Math.sin(angle) * currentRadius;
                    const y = 0;

                    const rotationRandomness = (Math.random() - 0.5) * CHAOS_ROTATION;

                    chairMesh.position.set(x, y, z);
                    chairMesh.lookAt(0, y, 0);
                    chairMesh.rotation.y += rotationRandomness;

                    this.scene.add(chairMesh);

                    // COM 보정
                    const comOffsetY = COM_OFFSET_Y;

                    // Body
                    const body = new CANNON.Body({
                        mass: 10,
                        position: new CANNON.Vec3(x, y + comOffsetY, z),
                        material: this.defaultMaterial,
                        linearDamping: 0.5,
                        angularDamping: 0.5
                    });

                    // Shapes from Config
                    const seatShape = new CANNON.Box(new CANNON.Vec3(SEAT_W / 2, SEAT_H / 2, SEAT_W / 2));
                    body.addShape(seatShape, new CANNON.Vec3(0, LEG_H + SEAT_H / 2 - comOffsetY, 0));

                    const backShape = new CANNON.Box(new CANNON.Vec3(BACK_W / 2, BACK_H / 2, BACK_D / 2));
                    body.addShape(backShape, new CANNON.Vec3(0, LEG_H + SEAT_H + BACK_H / 2 - comOffsetY, -(SEAT_W / 2 - BACK_D / 2)));

                    const legShape = new CANNON.Box(new CANNON.Vec3(LEG_W / 2, LEG_H / 2, LEG_W / 2));
                    const legOffset = SEAT_W / 2 - LEG_W / 2;

                    body.addShape(legShape, new CANNON.Vec3(-legOffset, LEG_H / 2 - comOffsetY, legOffset));
                    body.addShape(legShape, new CANNON.Vec3(legOffset, LEG_H / 2 - comOffsetY, legOffset));
                    body.addShape(legShape, new CANNON.Vec3(-legOffset, LEG_H / 2 - comOffsetY, -legOffset));
                    body.addShape(legShape, new CANNON.Vec3(legOffset, LEG_H / 2 - comOffsetY, -legOffset));

                    body.quaternion.setFromEuler(chairMesh.rotation.x, chairMesh.rotation.y, chairMesh.rotation.z);

                    this.world.addBody(body);

                    this.objectsToUpdate.push({
                        mesh: chairMesh,
                        body: body,
                        comOffsetY: comOffsetY
                    });
                }
            },
            undefined,
            (error) => {
                console.error('모델 로드 오류:', error);
            }
        );
    }

    setupInteraction() {
        // Prevent context menu
        window.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    getRayIntersection(clientX, clientY) {
        this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const chairMeshes = this.objectsToUpdate.map(obj => obj.mesh);
        const intersects = this.raycaster.intersectObjects(chairMeshes, true);

        if (intersects.length > 0) {
            let targetMesh = intersects[0].object;
            while (targetMesh.parent && targetMesh.parent !== this.scene) {
                targetMesh = targetMesh.parent;
            }
            return {
                object: this.objectsToUpdate.find(obj => obj.mesh === targetMesh),
                point: intersects[0].point
            };
        }
        return null;
    }

    onMouseDown(event) {
        // Right CLick is handled by App calling Bomb logic
        if (event.button === 2) {
            // Let App handle this by passing event or callback
            // For now, we assume App calls World methods or Effects methods
            // But the event listener is here. 
            // We need to trigger bomb spawn. Dispatch event or callback?
            // Or we just check intersection here and call a callback passed in constructor?
            if (this.onRightClick) this.onRightClick(event.clientX, event.clientY);
            return;
        }

        // Left Click - Drag
        // NOTE: controls should be disabled in App if dragging
        // We will emit an event or callback for drag start

        const hit = this.getRayIntersection(event.clientX, event.clientY);

        if (hit && hit.object) {
            this.isDragging = true;
            if (this.onDragStart) this.onDragStart(); // Disable OrbitControls

            this.mouseBody.position.set(hit.point.x, hit.point.y, hit.point.z);

            const normal = new THREE.Vector3();
            this.camera.getWorldDirection(normal).negate();
            this.dragPlane.setFromNormalAndCoplanarPoint(normal, hit.point);

            const localPoint = new CANNON.Vec3();
            hit.object.body.pointToLocalFrame(new CANNON.Vec3(hit.point.x, hit.point.y, hit.point.z), localPoint);

            this.mouseConstraint = new CANNON.PointToPointConstraint(
                hit.object.body,
                localPoint,
                this.mouseBody,
                new CANNON.Vec3(0, 0, 0)
            );
            this.world.addConstraint(this.mouseConstraint);
        }
    }

    onMouseMove(event) {
        if (!this.isDragging) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersectPoint)) {
            this.mouseBody.position.set(this.planeIntersectPoint.x, this.planeIntersectPoint.y, this.planeIntersectPoint.z);
        }
    }

    onMouseUp(event) {
        if (this.isDragging) {
            this.world.removeConstraint(this.mouseConstraint);
            this.mouseConstraint = null;
            this.isDragging = false;
            if (this.onDragEnd) this.onDragEnd(); // Enable OrbitControls
        }
    }

    // Public methods for Effects interaction
    fractureChair(chairObj, explosionCenter, force) {
        this.scene.remove(chairObj.mesh);
        this.world.removeBody(chairObj.body);

        const index = this.objectsToUpdate.indexOf(chairObj);
        if (index > -1) this.objectsToUpdate.splice(index, 1);

        // Debris from mesh structure
        chairObj.mesh.traverse((child) => {
            if (child.isMesh) {
                const worldPos = new THREE.Vector3();
                const worldQuat = new THREE.Quaternion();
                const worldScale = new THREE.Vector3();
                child.getWorldPosition(worldPos);
                child.getWorldQuaternion(worldQuat);
                child.getWorldScale(worldScale);

                child.geometry.computeBoundingBox();
                const bbox = child.geometry.boundingBox;
                const size = new THREE.Vector3();
                bbox.getSize(size);
                size.multiply(worldScale);

                const halfSize = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);

                const debrisMesh = child.clone();
                debrisMesh.material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    roughness: 0.8
                });
                debrisMesh.position.copy(worldPos);
                debrisMesh.quaternion.copy(worldQuat);
                debrisMesh.scale.copy(worldScale);
                this.scene.add(debrisMesh);

                const body = new CANNON.Body({
                    mass: 1.5,
                    position: new CANNON.Vec3(worldPos.x, worldPos.y, worldPos.z),
                    quaternion: new CANNON.Quaternion(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w),
                    material: this.defaultMaterial,
                    linearDamping: 0.1,
                    angularDamping: 0.1
                });
                body.addShape(new CANNON.Box(halfSize));
                this.world.addBody(body);

                const dir = new CANNON.Vec3(worldPos.x - explosionCenter.x, worldPos.y - explosionCenter.y, worldPos.z - explosionCenter.z);
                dir.normalize();
                const impulse = dir.scale(force * (0.1 + Math.random() * 0.2));
                body.applyImpulse(impulse, body.position);
                body.angularVelocity.set((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);

                this.debrisObjects.push({ mesh: debrisMesh, body: body });
            }
        });

        // Small splinters
        const validGeometries = [];
        chairObj.mesh.traverse((child) => {
            if (child.isMesh && child.geometry) validGeometries.push(child.geometry);
        });

        if (validGeometries.length > 0) {
            for (let i = 0; i < CONFIG.EXPLOSION.DEBRIS_SPLINTER_COUNT; i++) {
                const randomGeo = validGeometries[Math.floor(Math.random() * validGeometries.length)];
                const randomScale = 0.2 + Math.random() * 0.3;

                const randomOffset = new THREE.Vector3(
                    (Math.random() - 0.5) * 1.0, (Math.random()) * 1.0, (Math.random() - 0.5) * 1.0
                ).applyQuaternion(chairObj.mesh.quaternion);

                const spawnPos = new THREE.Vector3().copy(chairObj.mesh.position).add(randomOffset);
                const randQuat = new THREE.Quaternion();
                randQuat.setFromEuler(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI));

                this.createGenericDebris(randomGeo, spawnPos, randQuat, explosionCenter, force, randomScale);
            }
        }
    }

    createGenericDebris(geometryOrSize, position, quaternion, explosionCenter, force, scaleVal = 1.0) {
        let geometry;
        let halfSize;

        if (geometryOrSize.isGeometry || geometryOrSize.isBufferGeometry) {
            geometry = geometryOrSize;
            if (!geometry.boundingBox) geometry.computeBoundingBox();
            const size = new THREE.Vector3();
            geometry.boundingBox.getSize(size);
            size.multiplyScalar(scaleVal);
            halfSize = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
        } else {
            const s = geometryOrSize;
            geometry = new THREE.BoxGeometry(s.x * 2, s.y * 2, s.z * 2);
            halfSize = s;
            scaleVal = 1.0;
        }

        const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.quaternion.copy(quaternion);
        mesh.scale.set(scaleVal, scaleVal, scaleVal);
        mesh.castShadow = true;
        this.scene.add(mesh);

        const body = new CANNON.Body({
            mass: 0.5,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            quaternion: new CANNON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w),
            material: this.defaultMaterial
        });
        body.addShape(new CANNON.Box(halfSize));
        this.world.addBody(body);

        const dir = new CANNON.Vec3(position.x - explosionCenter.x, position.y - explosionCenter.y, position.z - explosionCenter.z);
        dir.normalize();
        const impulse = dir.scale(force * 0.05);
        body.applyImpulse(impulse, body.position);

        this.debrisObjects.push({ mesh, body });
    }

    update(deltaTime) {
        // Sync Chairs
        for (const object of this.objectsToUpdate) {
            object.mesh.position.copy(object.body.position);
            if (object.comOffsetY) {
                const offset = new THREE.Vector3(0, object.comOffsetY, 0);
                offset.applyQuaternion(object.mesh.quaternion);
                object.mesh.position.sub(offset);
            }
            object.mesh.quaternion.copy(object.body.quaternion);
        }

        // Sync Debris
        for (const debris of this.debrisObjects) {
            debris.mesh.position.copy(debris.body.position);
            debris.mesh.quaternion.copy(debris.body.quaternion);
        }
    }
}
