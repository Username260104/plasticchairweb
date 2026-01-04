import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as CANNON from 'cannon-es';
import { GUI } from 'lil-gui';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// --- Configuration ---
const CONFIG = {
    VISUAL: {
        BLOOM_STRENGTH: 0.3,
        BLOOM_RADIUS: 0.1,
        BLOOM_THRESHOLD: 1
    },
    EXPLOSION: {
        FIRE_SPEED: 120,
        FIRE_SIZE_MIN: 0.05,
        FIRE_SIZE_MAX: 0.2,
        SOOT_COUNT: 2000,
        SOOT_SIZE_MIN: 0.05,
        SOOT_SIZE_MAX: 0.4,
        DEBRIS_SPLINTER_COUNT: 20,
        DEBRIS_SPLINTER_SIZE_MIN: 0.05,
        DEBRIS_SPLINTER_SIZE_MAX: 0.15,
        DEFLAGRATION_COUNT: 0, // 짙은 잔류 연기
        DEFLAGRATION_LIFE_MIN: 5.0,
        DEFLAGRATION_LIFE_MAX: 8.0
    }
};

// ---------------------------------------------------------
// 1. Scene & Physics World Setup
// ---------------------------------------------------------

// THREE.js Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.Fog(0x050505, 20, 100);

// CANNON.js World
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // 지구 중력
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;

// Materials
const defaultMaterial = new CANNON.Material('default');
const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
    friction: 0.7,    // 마찰력 증가 (잘 미끄러지지 않게)
    restitution: 0.1, // 반발력 감소 (덜 통통 튀게)
});
world.addContactMaterial(defaultContactMaterial);

// ---------------------------------------------------------
// 2. Camera & Renderer
// ---------------------------------------------------------

const fov = 30;
const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 16, 35); // Start at final position

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.getElementById('canvas-container').appendChild(renderer.domElement);

// Post-Processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    CONFIG.VISUAL.BLOOM_STRENGTH,
    CONFIG.VISUAL.BLOOM_RADIUS,
    CONFIG.VISUAL.BLOOM_THRESHOLD
);
composer.addPass(bloomPass);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: null
};

// ---------------------------------------------------------
// 3. Lighting
// ---------------------------------------------------------

const ambientLight = new THREE.AmbientLight(0x333333); // 약간 밝게 조정
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 800);
spotLight.position.set(0, 8, 0); // 조금 더 높게
spotLight.angle = Math.PI / 4.5;
spotLight.penumbra = 1;
spotLight.decay = 2;
spotLight.distance = 100;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 2048;
spotLight.shadow.mapSize.height = 2048;
spotLight.shadow.bias = -0.00001; // bias 조정
scene.add(spotLight);

const BASE_SPOT_INTENSITY = 800;

// ---------------------------------------------------------
// 4. Floor
// ---------------------------------------------------------

// Visual Floor
const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.8,
    metalness: 0.1
});
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
planeMesh.rotation.x = -Math.PI / 2;
planeMesh.receiveShadow = true;
scene.add(planeMesh);

// Physics Floor
const planeShape = new CANNON.Plane();
const planeBody = new CANNON.Body({ mass: 0, material: defaultMaterial });
planeBody.addShape(planeShape);
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(planeBody);

// ---------------------------------------------------------
// 5. Objects & Loader
// ---------------------------------------------------------

const objectsToUpdate = []; // { mesh, body }
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
loader.setDRACOLoader(dracoLoader);

// Chair Setup
const radius = 4;
const chairCount = 8;
const CHAOS_ANGLE = 0.2;
const CHAOS_RADIUS = 1.1;
const CHAOS_ROTATION = 0.3;

// Texture Loader
const texLoader = new THREE.TextureLoader();
const decalTexture = texLoader.load('./assets/explosionmark.png?v=' + Date.now());

// --- Configuration ---
// CONFIG moved to top


loader.load(
    './assets/chair.glb?v=' + Date.now(),
    (gltf) => {
        const originalChair = gltf.scene;
        // 크기 조정 (시각적)
        const scale = 1.5;
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
            const y = 0; // 바닥 높이 0 (사용자 요구)

            // 회전
            const rotationRandomness = (Math.random() - 0.5) * CHAOS_ROTATION;

            // 시각적 초기 위치 설정
            chairMesh.position.set(x, y, z);
            chairMesh.lookAt(0, y, 0);
            chairMesh.rotation.y += rotationRandomness;

            scene.add(chairMesh);

            // 크기 상수 (Scale 1.5 고려)
            const s = 1.5; // Global scale
            const legW = 0.08 * s;
            const legH = 0.45 * s;
            const seatW = 0.5 * s;  // 좌석 폭 증가 (사이드 묻힘 방지)
            const seatH = 0.1 * s;  // 좌석 두께 증가
            const backW = 0.5 * s;  // 등받이 폭 증가
            const backH = 0.45 * s; // 등받이 높이 증가
            const backD = 0.1 * s;  // 등받이 두께 증가 (등면 묻힘 방지)

            // COM 보정: 무게중심을 바닥에서 이만큼 위로 설정
            const comOffsetY = 0.35 * s;

            // 물리 바디 생성 (Compound Shape)
            const body = new CANNON.Body({
                mass: 10,
                // Body의 위치는 COM 위치이므로, 발이 바닥(y)에 닿으려면 y + comOffsetY에 위치해야 함
                position: new CANNON.Vec3(x, y + comOffsetY, z),
                material: defaultMaterial,
                linearDamping: 0.5,
                angularDamping: 0.5
            });

            // 1. 좌석 (Seat)
            const seatShape = new CANNON.Box(new CANNON.Vec3(seatW / 2, seatH / 2, seatW / 2));
            body.addShape(seatShape, new CANNON.Vec3(0, legH + seatH / 2 - comOffsetY, 0));

            // 2. 등받이 (Backrest) - 뒤쪽에 위치
            const backShape = new CANNON.Box(new CANNON.Vec3(backW / 2, backH / 2, backD / 2));
            // 위치: 높이는 좌석 위 + 등받이 절반, 깊이는 뒤쪽 끝
            body.addShape(backShape, new CANNON.Vec3(0, legH + seatH + backH / 2 - comOffsetY, -(seatW / 2 - backD / 2)));

            // 3. 다리 4개 (Legs)
            const legShape = new CANNON.Box(new CANNON.Vec3(legW / 2, legH / 2, legW / 2));
            const legOffset = seatW / 2 - legW / 2; // 모서리 위치

            // FL (Front Left)
            body.addShape(legShape, new CANNON.Vec3(-legOffset, legH / 2 - comOffsetY, legOffset));
            // FR (Front Right)
            body.addShape(legShape, new CANNON.Vec3(legOffset, legH / 2 - comOffsetY, legOffset));
            // BL (Back Left)
            body.addShape(legShape, new CANNON.Vec3(-legOffset, legH / 2 - comOffsetY, -legOffset));
            // BR (Back Right)
            body.addShape(legShape, new CANNON.Vec3(legOffset, legH / 2 - comOffsetY, -legOffset));

            // 초기 회전 적용
            body.quaternion.setFromEuler(chairMesh.rotation.x, chairMesh.rotation.y, chairMesh.rotation.z);

            world.addBody(body);

            objectsToUpdate.push({
                mesh: chairMesh,
                body: body,
                comOffsetY: comOffsetY // 싱크 루프에서 사용하기 위해 저장
            });
        }
    },
    undefined,
    (error) => {
        console.error('모델 로드 오류:', error);
    }
);

// ---------------------------------------------------------
// 6. Interaction Logic (Free 3D Movement)
// ---------------------------------------------------------

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let mouseConstraint;

// 마우스 커서를 위한 키네마틱 바디 (보이지 않음)
const mouseBody = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC });
mouseBody.collisionFilterGroup = 0;
mouseBody.collisionFilterMask = 0;
world.addBody(mouseBody);

// 드래그 평면 (가상의 평면, 카메라를 바라봄)
const dragPlane = new THREE.Plane();
const planeIntersectPoint = new THREE.Vector3();

// 이벤트 리스너
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mouseup', onMouseUp);

function getRayIntersection(clientX, clientY) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // 의자들만 체크
    const chairMeshes = objectsToUpdate.map(obj => obj.mesh);
    const intersects = raycaster.intersectObjects(chairMeshes, true);

    if (intersects.length > 0) {
        let targetMesh = intersects[0].object;
        while (targetMesh.parent && targetMesh.parent !== scene) {
            targetMesh = targetMesh.parent;
        }
        return {
            object: objectsToUpdate.find(obj => obj.mesh === targetMesh),
            point: intersects[0].point
        };
    }
    return null;
}

function onMouseDown(event) {
    // Right Click - Bomb
    if (event.button === 2) {
        spawnBomb(event.clientX, event.clientY);
        return;
    }

    if (controls.enabled && event.button !== 0) return; // 왼쪽 클릭만 logic continuation

    const hit = getRayIntersection(event.clientX, event.clientY);

    if (hit && hit.object) {
        isDragging = true;
        controls.enabled = false;

        // 마우스 바디를 클릭 지점으로 이동
        mouseBody.position.set(hit.point.x, hit.point.y, hit.point.z);

        // 클릭된 지점에서 카메라를 바라보는 평면 생성
        // 평면의 법선(Normal)을 카메라가 바라보는 방향의 반대로 설정 (카메라 쪽을 향함)
        const normal = new THREE.Vector3();
        camera.getWorldDirection(normal).negate(); // 카메라가 보는 방향의 반대 = 카메라를 향하는 방향
        dragPlane.setFromNormalAndCoplanarPoint(normal, hit.point);

        // 제약 조건 생성
        // 클릭된 로컬 지점을 계산
        const localPoint = new CANNON.Vec3();
        hit.object.body.pointToLocalFrame(new CANNON.Vec3(hit.point.x, hit.point.y, hit.point.z), localPoint);

        mouseConstraint = new CANNON.PointToPointConstraint(
            hit.object.body,
            localPoint,
            mouseBody,
            new CANNON.Vec3(0, 0, 0)
        );
        world.addConstraint(mouseConstraint);
    }
}

function onMouseMove(event) {
    if (!isDragging) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // 카메라 기준 평면과 교차점 계산
    if (raycaster.ray.intersectPlane(dragPlane, planeIntersectPoint)) {
        mouseBody.position.set(planeIntersectPoint.x, planeIntersectPoint.y, planeIntersectPoint.z);
    }
}

function onMouseUp(event) {
    if (isDragging) {
        world.removeConstraint(mouseConstraint);
        mouseConstraint = null;
        isDragging = false;
        controls.enabled = true;
    }
}


// ---------------------------------------------------------
// 7. Loop & Resize
// ---------------------------------------------------------

// ---------------------------------------------------------
// 8. Explosion & Fracture System
// ---------------------------------------------------------

// --- Constants (Global for Fracture) ---
const S = 1.5; // Scale
const LEG_W = 0.08 * S;
const LEG_H = 0.45 * S;
const SEAT_W = 0.5 * S;
const SEAT_H = 0.1 * S;
const BACK_W = 0.5 * S;
const BACK_H = 0.45 * S;
const BACK_D = 0.1 * S;
const COM_OFFSET_Y = 0.35 * S;

// --- System State ---
const explosions = []; // { mesh, timer, position }
const debrisObjects = []; // { mesh, body }
const particles = []; // { mesh, velocity, life, maxLife, type }
let shakeIntensity = 0;

// 조명 상태 상수
const BASE_AMBIENT_INTENSITY = 52.5;
let lightFlickerTimer = 0;

// --- 1. Triple Click Trigger ---
// --- 1. Bomb Trigger (Right Click) ---
// Handled in onMouseDown. Prevent context menu.
window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

function spawnBomb(clientX, clientY) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(planeMesh);
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
        scene.add(bombMesh);

        // 2. Physics Body
        const bombBody = new CANNON.Body({
            mass: 2,
            shape: new CANNON.Sphere(radius),
            position: new CANNON.Vec3(point.x, point.y + 5, point.z),
            material: defaultMaterial,
            angularDamping: 0.1,
            linearDamping: 0.1
        });

        // 살짝 던지는 느낌 또는 무작위 회전 추가
        bombBody.velocity.set((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2);
        bombBody.angularVelocity.set(Math.random() * 10, Math.random() * 10, Math.random() * 10);

        world.addBody(bombBody);

        explosions.push({
            mesh: bombMesh,
            body: bombBody,
            timer: 3.0, // 2초로 연장
            position: bombMesh.position // Reference for particles, will be updated from body
        });
    }
}

// --- 2. Explosion Logic ---
function updateExplosions(deltaTime) {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const bomb = explosions[i];
        bomb.timer -= deltaTime;

        // Sync Mesh with Body
        if (bomb.body) {
            bomb.mesh.position.copy(bomb.body.position);
            bomb.mesh.quaternion.copy(bomb.body.quaternion);
            bomb.position.copy(bomb.body.position); // Update explosion center ref
        }

        // Smoke Effect (Pre-explosion)
        if (bomb.timer > 0) {
            if (Math.random() < 0.4) { // 연기 밀도 조금 더 증가
                spawnParticle(bomb.position, 'smoke');
            }
        }
        // Boom!
        else {
            explode(bomb);
            scene.remove(bomb.mesh);
            if (bomb.body) world.removeBody(bomb.body);
            explosions.splice(i, 1);
        }
    }
}

function explode(bomb) {
    const center = bomb.position;
    const radius = 60;
    const force = 10; // 힘 소폭 증가

    // 1. Visual FX
    shakeIntensity = 2; // 강도 증가
    lightFlickerTimer = 8.0; // 조명 깜빡임
    createFlash(center);

    // 4. Decal (Scorch Mark)
    createDecal(center);

    // 파티클 수 대폭 증가
    for (let i = 0; i < 200; i++) spawnParticle(center, 'fire');
    for (let i = 0; i < 150; i++) spawnParticle(center, 'dust');
    for (let i = 0; i < 100; i++) spawnParticle(center, 'spark');
    for (let i = 0; i < CONFIG.EXPLOSION.SOOT_COUNT; i++) spawnParticle(center, 'soot');
    for (let i = 0; i < CONFIG.EXPLOSION.DEFLAGRATION_COUNT; i++) spawnParticle(center, 'deflagration'); // 잔류 폭연

    // 2. Physics Impulse (Existing Chairs)
    const targets = [...objectsToUpdate];
    for (const obj of targets) {
        const body = obj.body;
        const dist = body.position.distanceTo(center);
        if (dist < radius) {
            const dir = body.position.vsub(center);
            dir.normalize();
            if (dist < 8) {
                fractureChair(obj, center, force);
            } else {
                const impulse = dir.scale(force * (1 - dist / radius));
                body.applyImpulse(impulse, body.position);
            }
        }
    }

    // 3. Physics Impulse (Existing Debris)
    for (const debris of debrisObjects) {
        const dist = debris.body.position.distanceTo(center);
        if (dist < radius) {
            const dir = debris.body.position.vsub(center);
            dir.normalize();
            const impulse = dir.scale((force * 0.5) * (1 - dist / radius));
            debris.body.applyImpulse(impulse, debris.body.position);
        }
    }
}

function createFlash(position) {
    // 1. Extreme Light
    const light = new THREE.PointLight(0xffffff, 20000, 60); // Intensity increased significantly
    light.position.copy(position);
    light.position.y += 2;
    scene.add(light);

    // 2. Visible Flash Core (Blinding White Sphere)
    const geometry = new THREE.SphereGeometry(1.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const flashMesh = new THREE.Mesh(geometry, material);
    flashMesh.position.copy(position);
    flashMesh.position.y += 2;
    scene.add(flashMesh);

    particles.push({
        type: 'light',
        light: light,
        flashMesh: flashMesh,
        life: 0.15, // Short flash duration
        maxLife: 0.15
    });
}

// --- 3. Fracturing System ---
function fractureChair(chairObj, explosionCenter, force) {
    scene.remove(chairObj.mesh);
    world.removeBody(chairObj.body);

    const index = objectsToUpdate.indexOf(chairObj);
    if (index > -1) objectsToUpdate.splice(index, 1);

    // 실제 메쉬 구조를 파편으로 활용
    chairObj.mesh.traverse((child) => {
        if (child.isMesh) {
            // 1. 월드 트랜스폼 계산
            const worldPos = new THREE.Vector3();
            const worldQuat = new THREE.Quaternion();
            const worldScale = new THREE.Vector3();
            child.getWorldPosition(worldPos);
            child.getWorldQuaternion(worldQuat);
            child.getWorldScale(worldScale);

            // 2. 물리 모양을 위한 Bounding Box 계산
            child.geometry.computeBoundingBox();
            const bbox = child.geometry.boundingBox;
            const size = new THREE.Vector3();
            bbox.getSize(size);
            size.multiply(worldScale); // 스케일 반영

            const halfSize = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);

            // 3. 파편 메쉬 (하얀색으로 통일)
            const debrisMesh = child.clone();
            debrisMesh.material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.8
            });
            // 로컬 위치/회전을 초기화하고 월드 값으로 설정 (새로운 부모 없이 씬에 추가될 것이므로)
            debrisMesh.position.copy(worldPos);
            debrisMesh.quaternion.copy(worldQuat);
            debrisMesh.scale.copy(worldScale);
            scene.add(debrisMesh);

            // 4. 물리 바디
            const body = new CANNON.Body({
                mass: 1.5,
                position: new CANNON.Vec3(worldPos.x, worldPos.y, worldPos.z),
                quaternion: new CANNON.Quaternion(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w),
                material: defaultMaterial,
                linearDamping: 0.1,
                angularDamping: 0.1
            });
            body.addShape(new CANNON.Box(halfSize));
            world.addBody(body);

            // 폭발력 적용
            const dir = new CANNON.Vec3(worldPos.x - explosionCenter.x, worldPos.y - explosionCenter.y, worldPos.z - explosionCenter.z);
            dir.normalize();
            const impulse = dir.scale(force * (0.1 + Math.random() * 0.2));
            body.applyImpulse(impulse, body.position);
            body.angularVelocity.set((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);

            debrisObjects.push({ mesh: debrisMesh, body: body });
        }
    });

    // 추가적인 작은 파편(Sparks/Splinters) - 실제 지오메트리 재활용
    const validGeometries = [];
    chairObj.mesh.traverse((child) => {
        if (child.isMesh && child.geometry) validGeometries.push(child.geometry);
    });

    if (validGeometries.length > 0) {
        const S = 1.0; // Spread factor
        for (let i = 0; i < CONFIG.EXPLOSION.DEBRIS_SPLINTER_COUNT; i++) {
            const randomGeo = validGeometries[Math.floor(Math.random() * validGeometries.length)];
            const randomScale = 0.2 + Math.random() * 0.3; // 0.2~0.5배 축소

            const randomOffset = new THREE.Vector3(
                (Math.random() - 0.5) * S, (Math.random()) * S, (Math.random() - 0.5) * S
            ).applyQuaternion(chairObj.mesh.quaternion);

            const spawnPos = new THREE.Vector3().copy(chairObj.mesh.position).add(randomOffset);

            // 랜덤 회전 추가
            const randQuat = new THREE.Quaternion();
            randQuat.setFromEuler(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI));

            createGenericDebris(randomGeo, spawnPos, randQuat, explosionCenter, force, randomScale);
        }
    }
}

function createGenericDebris(geometryOrSize, position, quaternion, explosionCenter, force, scaleVal = 1.0) {
    let geometry;
    let halfSize;

    if (geometryOrSize.isGeometry || geometryOrSize.isBufferGeometry) {
        // Reuse chair geometry
        geometry = geometryOrSize; // 이미 존재하는 지오메트리 재사용
        // Bounding Box로 물리 크기 근사
        if (!geometry.boundingBox) geometry.computeBoundingBox();
        const size = new THREE.Vector3();
        geometry.boundingBox.getSize(size);
        size.multiplyScalar(scaleVal);
        halfSize = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
    } else {
        // Fallback to Box
        const s = geometryOrSize; // Vec3
        geometry = new THREE.BoxGeometry(s.x * 2, s.y * 2, s.z * 2);
        halfSize = s;
        scaleVal = 1.0; // 박스는 이미 크기가 반영됨
    }

    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.quaternion.copy(quaternion);
    mesh.scale.set(scaleVal, scaleVal, scaleVal); // 스케일 적용
    mesh.castShadow = true;
    scene.add(mesh);

    const body = new CANNON.Body({
        mass: 0.5,
        position: new CANNON.Vec3(position.x, position.y, position.z),
        quaternion: new CANNON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w),
        material: defaultMaterial
    });
    body.addShape(new CANNON.Box(halfSize));
    world.addBody(body);

    const dir = new CANNON.Vec3(position.x - explosionCenter.x, position.y - explosionCenter.y, position.z - explosionCenter.z);
    dir.normalize();
    const impulse = dir.scale(force * 0.05);
    body.applyImpulse(impulse, body.position);

    debrisObjects.push({ mesh, body });
}

// --- 4. Particle System ---
const particleGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1); // Default Box
const sphereParticleGeo = new THREE.SphereGeometry(0.5, 8, 8); // Round for smoke
const fireColors = [0xff4500, 0xff8c00, 0xffd700];

function spawnParticle(position, type) {
    let life = 1.0;
    let velocity = new THREE.Vector3();
    let color = 0x555555;
    let size = 1.0;

    // Choose Geometry
    let selectedGeo = particleGeo;

    if (type === 'fire') {
        selectedGeo = sphereParticleGeo;
        // High Dynamic Range Color for Bloom
        const c = new THREE.Color(fireColors[Math.floor(Math.random() * fireColors.length)]);
        c.multiplyScalar(10.0); // Very bright!
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
        selectedGeo = sphereParticleGeo; // Only deflagration uses Sphere
        const cVal = 0.1 + Math.random() * 0.2; // 조금 더 밝은 회색으로 '뭉게뭉게' 느낌
        color = new THREE.Color(cVal, cVal, cVal);
        life = CONFIG.EXPLOSION.DEFLAGRATION_LIFE_MIN + Math.random() * (CONFIG.EXPLOSION.DEFLAGRATION_LIFE_MAX - CONFIG.EXPLOSION.DEFLAGRATION_LIFE_MIN);

        // 뭉게뭉게 위로 피어오르도록
        velocity.set(
            (Math.random() - 0.5) * 2,
            2.0 + Math.random() * 3.0, // 위로 확실히 상승
            (Math.random() - 0.5) * 2
        );
        size = 1.0 + Math.random() * 2.0; // 초기 크기
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
        material.opacity = 0.0; // 시작은 투명하게 (피어오르는 느낌)
    }

    mesh.scale.set(size, size, size);
    scene.add(mesh);

    particles.push({
        mesh: mesh,
        velocity: velocity,
        life: life,
        maxLife: life,
        type: type,
        initialScale: size
    });
}

function createDecal(position) {
    const size = 7 + Math.random() * 2; // 3~5m 크기
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshBasicMaterial({
        map: decalTexture,
        transparent: true,
        opacity: 0.9,
        depthWrite: false, // 투명 객체 겹침 문제 완화
        polygonOffset: true,
        polygonOffsetFactor: -1 // 바닥 위에 확실히 그리기
    });

    const decal = new THREE.Mesh(geometry, material);
    decal.position.set(position.x, 0.02, position.z); // 바닥보다 살짝 위
    decal.rotation.x = -Math.PI / 2;
    decal.rotation.z = Math.random() * Math.PI * 2; // 랜덤 회전

    scene.add(decal);
}

function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        if (p.type === 'light') {
            p.life -= deltaTime;
            const lifeRatio = p.life / p.maxLife;

            // Light Fade
            p.light.intensity = 20000 * lifeRatio;

            // Flash Sphere Animation (Blinding Core)
            if (p.flashMesh) {
                const s = 1.0 + (1.0 - lifeRatio) * 20.0; // Rapid expansion
                p.flashMesh.scale.set(s, s, s);
                // Ensure material is transparent for opacity fade
                p.flashMesh.material.transparent = true;
                p.flashMesh.material.opacity = lifeRatio;
            }

            if (p.life <= 0) {
                scene.remove(p.light);
                if (p.flashMesh) {
                    scene.remove(p.flashMesh);
                    p.flashMesh.geometry.dispose();
                    p.flashMesh.material.dispose();
                }
                particles.splice(i, 1);
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
            // 위로 피어오르며 감속 (Buoyancy + Drag)
            p.velocity.y += 0.5 * deltaTime; // 부력 (점점 위로)
            p.velocity.multiplyScalar(0.98); // 공기 저항 (천천히 흐르듯)
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
            // soot가 바닥에 멈췄으면 회전 중지
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
            // 뭉게뭉게 확산 (Scale 커짐)
            const puffProgress = 1.0 - lifeRatio; // 0 -> 1
            const s = p.initialScale * (1.0 + puffProgress * 4.0); // 1배 -> 6배까지 커짐
            p.mesh.scale.set(s, s, s);

            // Opacity: 피어오름(FadeIn) -> 유지 -> 사라짐(FadeOut)
            let opacity = 0;
            if (puffProgress < 0.2) {
                // Fade In (0 ~ 0.2구간)
                opacity = (puffProgress / 0.2) * 0.6; // 최대 0.6
            } else if (puffProgress < 0.6) {
                // Sustain (0.2 ~ 0.6구간)
                opacity = 0.6;
            } else {
                // Fade Out (0.6 ~ 1.0구간)
                opacity = 0.6 * (1.0 - (puffProgress - 0.6) / 0.4);
            }
            p.mesh.material.opacity = Math.max(0, opacity);
        }

        if (p.type !== 'deflagration') {
            p.mesh.material.opacity = (p.type === 'soot') ? Math.min(0.8, lifeRatio * 2.0) : lifeRatio * 0.8;
        }

        if (p.life <= 0) {
            scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
            particles.splice(i, 1);
        }
    }
}

// --- 5. Screen Shake ---
function updateShake(deltaTime) {
    if (shakeIntensity > 0) {
        const shakePower = 0.5 * shakeIntensity;
        const rx = (Math.random() - 0.5) * shakePower;
        const ry = (Math.random() - 0.5) * shakePower;
        const rz = (Math.random() - 0.5) * shakePower;

        camera.position.add(new THREE.Vector3(rx, ry, rz));

        shakeIntensity -= deltaTime * 2.0;
        if (shakeIntensity < 0) shakeIntensity = 0;
    }
}

// --- 6. Lighting Control ---
let nextFlickerTimer = 0;

function updateLighting(deltaTime) {
    if (lightFlickerTimer > 0) {
        lightFlickerTimer -= deltaTime;
        nextFlickerTimer -= deltaTime;

        if (nextFlickerTimer <= 0) {
            const malfunctionChance = (lightFlickerTimer / 5.0);

            if (Math.random() < malfunctionChance) {
                const rand = Math.random();
                if (rand < 0.6) {
                    spotLight.intensity = 0;
                    ambientLight.intensity = 0.05;
                    nextFlickerTimer = 0.03 + Math.random() * 0.07;
                } else if (rand < 0.9) {
                    spotLight.intensity = BASE_SPOT_INTENSITY * (0.1 + Math.random() * 0.3);
                    ambientLight.intensity = 0.2;
                    nextFlickerTimer = 0.05 + Math.random() * 0.1;
                } else {
                    spotLight.intensity = BASE_SPOT_INTENSITY * 1.5;
                    ambientLight.intensity = 1.2;
                    nextFlickerTimer = 0.02 + Math.random() * 0.05;
                }
            } else {
                spotLight.intensity = BASE_SPOT_INTENSITY;
                ambientLight.intensity = 1.0;
                nextFlickerTimer = 0.1 + Math.random() * 0.3;
            }
        }
    } else {
        spotLight.intensity = BASE_SPOT_INTENSITY;
        ambientLight.intensity = 1.0;
        nextFlickerTimer = 0;
    }
}

// ---------------------------------------------------------
// Main Loop Update
// ---------------------------------------------------------

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

function setupGUI() {
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
    ambientFolder.add(ambientLight, 'intensity', 0, 2).name('Intensity');
    ambientFolder.addColor(ambientLight, 'color').name('Color');

    const spotFolder = lightFolder.addFolder('Spot Light');
    spotFolder.add(spotLight, 'intensity', 0, 2000).name('Intensity');
    spotFolder.addColor(spotLight, 'color').name('Color');
    spotFolder.add(spotLight.position, 'x', -50, 50).name('Pos X');
    spotFolder.add(spotLight.position, 'y', 0, 50).name('Pos Y');
    spotFolder.add(spotLight.position, 'z', -50, 50).name('Pos Z');
    spotFolder.add(spotLight, 'angle', 0, Math.PI / 2).name('Angle');
    spotFolder.add(spotLight, 'penumbra', 0, 1).name('Penumbra');

    const cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(camera.position, 'x', -100, 100).name('Pos X');
    cameraFolder.add(camera.position, 'y', -100, 100).name('Pos Y');
    cameraFolder.add(camera.position, 'z', -100, 100).name('Pos Z');
    cameraFolder.add(camera, 'fov', 10, 100).name('FOV').onChange(() => {
        camera.updateProjectionMatrix();
    });

    const explosionFolder = gui.addFolder('Explosion & Visuals');

    const bloomFolder = explosionFolder.addFolder('Bloom Effect');
    bloomFolder.add(CONFIG.VISUAL, 'BLOOM_STRENGTH', 0, 3).name('Strength').onChange(v => bloomPass.strength = v);
    bloomFolder.add(CONFIG.VISUAL, 'BLOOM_RADIUS', 0, 1).name('Radius').onChange(v => bloomPass.radius = v);
    bloomFolder.add(CONFIG.VISUAL, 'BLOOM_THRESHOLD', 0, 1).name('Threshold').onChange(v => bloomPass.threshold = v);

    const fireFolder = explosionFolder.addFolder('Fire Particles');
    fireFolder.add(CONFIG.EXPLOSION, 'FIRE_SPEED', 0, 100).name('Speed');
    fireFolder.add(CONFIG.EXPLOSION, 'FIRE_SIZE_MIN', 0.1, 5).name('Size Min');
    fireFolder.add(CONFIG.EXPLOSION, 'FIRE_SIZE_MAX', 0.1, 5).name('Size Max');
}

setupGUI();

const clock = new THREE.Clock();
let oldElapsedTime = 0;
function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;

    // Physics Update
    world.step(1 / 60, deltaTime, 10);

    // Sync Chairs
    for (const object of objectsToUpdate) {
        object.mesh.position.copy(object.body.position);
        if (object.comOffsetY) {
            const offset = new THREE.Vector3(0, object.comOffsetY, 0);
            offset.applyQuaternion(object.mesh.quaternion);
            object.mesh.position.sub(offset);
        }
        object.mesh.quaternion.copy(object.body.quaternion);
    }

    // Sync Debris
    for (const debris of debrisObjects) {
        debris.mesh.position.copy(debris.body.position);
        debris.mesh.quaternion.copy(debris.body.quaternion);
    }

    // Update Systems
    updateExplosions(deltaTime);
    updateParticles(deltaTime);
    updateShake(deltaTime);
    updateLighting(deltaTime);

    controls.update();
    composer.render();
}

animate();

// Custom Cursor Logic
const customCursor = document.getElementById('custom-cursor');
window.addEventListener('mousemove', (e) => {
    customCursor.style.left = `${e.clientX}px`;
    customCursor.style.top = `${e.clientY}px`;
});
