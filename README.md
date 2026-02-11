# 🪑 Plastic Chair Club (Polypropylene Support Group)

**"A Digital Sanctuary for the Ubiquitous Monobloc Chair"**

이 페이지는 비개발자를 위한 웹 개발 모임인 'Plastic Chair Club'의 홈페이지입니다. 이 페이지는 인터랙티브 3D 웹 경험에 중점을 둔 JS 기술 데모로 구현되었습니다.

## 🛠️ 기술 스택 및 자바스크립트 활용 (Tech Stack & Implementation)

이 프로젝트는 **Vanilla JavaScript (ES6 Modules)**를 기반으로, 최신 웹 3D 기술을 적극 활용하여 구현되었습니다.

### 1. 3D 렌더링 및 물리 엔진 (Three.js & Cannon-es)
- **Three.js**: 웹 브라우저 상에서 하드웨어 가속을 이용한 3D 장면을 구성했습니다. `GLTFLoader`를 통해 최적화된 의자 모델을 비동기적으로 로드하고, 인스턴싱(InstancedMesh) 기법을 사용하지 않고 개별 객체로 관리하여 각각의 독자적인 물리적 움직임을 구현했습니다.
- **Cannon-es**: 리얼타임 물리 엔진을 도입하여 의자들의 낙하, 충돌, 회전 등 자연스러운 역학(Dynamics)을 시뮬레이션했습니다. 사용자가 의자를 드래그하거나 폭발시키는 상호작용 또한 물리 엔진 기반으로 계산됩니다.

### 2. 커스텀 쉐이더 및 포스트 프로세싱 (Custom Shaders & Post-Processing)
- **EffectComposer**: `Three.js`의 후처리 효과를 체이닝하여 독창적인 비주얼을 완성했습니다.
    - **UnrealBloomPass**: 몽환적이고 흐릿한 느낌을 주는 과도한 블룸 효과 적용.
    - **GlitchPass**: 디지털 노이즈와 화면 깨짐 효과를 통해 불안정한 아이덴티티 표현.
    - **ShaderPass (ASCII)**: 화면을 텍스트(ASCII 문자)로 변환하는 커스텀 쉐이더를 적용하여 레트로하고 거친 질감을 구현.

### 3. 인터랙티브 시스템 (User Interaction System)
- **Raycaster**: 마우스/터치 입력을 3D 공간 좌표로 변환하여 객체와 상호작용합니다.
    - **Mitosis (세포 분열)**: 의자를 클릭하면 두 개로 분열되며 글리치 효과가 발생합니다.
    - **Explosion**: 우클릭 시 강력한 물리력을 가해 쌓인 의자들을 흩트립니다.
- **Custom Cursor**: 마우스 상태(클릭, 휠, 우클릭)에 따라 형태와 색상이 실시간으로 변하는 반응형 커스텀 커서(DOM 기반)를 구현했습니다.

### 4. 서버리스 데이터 연동 (Serverless Integration)
- **Google Apps Script**: 별도의 백엔드 서버 구축 없이, 'Check-In' 기능(사용자 등록)을 구현하기 위해 Google Apps Script를 웹 앱(Web App)으로 배포하여 API 엔드포인트로 활용했습니다.
- **Fetch API & FormData**: 프론트엔드에서 `CheckIn.js` 모듈을 통해 비동기적으로(`async/await`) 폼 데이터를 전송하며, `FormData`를 사용하여 CORS 문제를 우회하고 안정적인 데이터 통신을 구축했습니다.

## 📂 프로젝트 구조 (Project Structure)
- `src/App.js`: 애플리케이션의 진입점(Entry Point). 렌더 루프 및 시스템 초기화 담당.
- `src/World.js`: 3D 객체 생성, 물리 연산, 사용자 입력 처리 등 핵심 로직 관리.
- `src/Effects.js`: 쉐이더, 파티클, 글리치 등 시각 효과 제어.
- `src/CheckIn.js`: 모달 UI 제어 및 외부 API 통신 로직.
- `src/Config.js`: 전역 설정값(카메라, 조명, 물리 상수 등) 중앙 관리.


---

# 🪑 Plastic Chair Club (English)

**"A Digital Sanctuary for the Ubiquitous Monobloc Chair"**

This page is the homepage of the Plastic Chair Club, a web development gathering for non-developers. This page is implemented as a JS technical demo focusing on interactive 3D web experiences.

## 🛠️ Tech Stack & Implementation

This project is built with **Vanilla JavaScript (ES6 Modules)**, leveraging modern web 3D technologies.

### 1. 3D Rendering & Physics Engine (Three.js & Cannon-es)
- **Three.js**: Utilizes hardware-accelerated 3D scenes in the web browser. `GLTFLoader` asynchronously loads optimized chair models, managing them as individual objects (without instancing) to implement unique physical behaviors for each.
- **Cannon-es**: Integrating a real-time physics engine simulates natural dynamics like falling, collisions, and rotations. User interactions such as dragging or exploding chairs are calculated based on this physics engine.

### 2. Custom Shaders & Post-Processing
- **EffectComposer**: Chains post-processing effects in `Three.js` to create unique visuals.
    - **UnrealBloomPass**: Applies excessive bloom effects for a dreamy, blurry atmosphere.
    - **GlitchPass**: Uses digital noise and screen tearing to express an unstable identity.
    - **ShaderPass (ASCII)**: A custom shader that converts the screen into text (ASCII characters), implementing a retro and rough texture.

### 3. User Interaction System
- **Raycaster**: Converts mouse/touch inputs into 3D spatial coordinates to interact with objects.
    - **Mitosis**: Clicking a chair splits it into two, triggering a glitch effect.
    - **Explosion**: Right-clinking applies powerful physical force to scatter piled chairs.
- **Custom Cursor**: Implements a responsive custom cursor (DOM-based) that changes shape and color in real-time based on mouse states (click, wheel, right-click).

### 4. Serverless Integration
- **Google Apps Script**: To implement the 'Check-In' feature (user registration) without building a separate backend server, Google Apps Script is deployed as a Web App to serve as an API endpoint.
- **Fetch API & FormData**: The frontend uses the `CheckIn.js` module to asynchronously send form data via `fetch` (async/await), utilizing `FormData` to bypass CORS issues and establish stable data communication.

## 📂 Project Structure
- `src/App.js`: Entry point. Handles render loop and system initialization.
- `src/World.js`: Manages core logic including 3D object creation, physics calculations, and user inputs.
- `src/Effects.js`: Controls visual effects such as shaders, particles, and glitches.
- `src/CheckIn.js`: Manages modal UI control and external API communication logic.
- `src/Config.js`: Central management of global settings (Camera, Light, Physics constants, etc.).

---
*Built by The Plastic Chair Club Dev Team*
