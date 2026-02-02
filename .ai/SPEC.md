# 🏗 프로젝트 명세서 (Project Specification)

## 1. 프로젝트 개요
- **프로젝트명**: Plastic Chair Club (plasticchairweb)
- **목표**: "플라스틱 의자"를 테마로 한 고품질 3D 인터랙티브 웹사이트 프로토타입.
- **핵심 경험**: 물리 엔진 기반의 상호작용(던지기, 부수기)과 심미적인 시각 효과(Bloom, 조명) 제공.

## 2. 기술 스택 (Tech Stack)
- **Core**: HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
- **3D Engine**: [Three.js](https://threejs.org/) (렌더링)
- **Physics**: [Cannon-es](https://github.com/pmndrs/cannon-es) (물리 시뮬레이션)
- **Post-Processing**: Three.js EffectComposer (UnrealBloomPass)
- **UI/Tools**: lil-gui (디버깅, 글리치 강제 토글 기능 포함), OrbitControls
- **Environment**: Docker, Docker Compose

## 3. 주요 기능 (Features)

### A. 월드 구성 (World System)
- **의자 배치**: 11개의 의자가 원형으로 배치되며, 위치와 회전에 무작위성(Chaos) 부여.
- **물리 모델**: 좌판, 등받이, 다리 4개로 구성된 정교한 Compound Shape 적용.
- **바닥**: 그림자를 받는 평면(Plane) 및 물리 바디.

### B. 인터랙션 (Interaction)
- **공통**:
  - **의자 생성 (Mitosis)**: 기존 의자를 클릭(탭)하면 세포 분열하듯 복제.
- **PC (Mouse)**:
  - 좌클릭 드래그: 의자 집어 던지기.
  - 우클릭: 폭탄 설치 및 폭파.
- **Mobile (Touch)**:
  - 1터치 드래그: 의자 이동.
  - 2터치 탭: 폭탄 설치.
  - 2터치 드래그: 화면(카메라) 패닝.

### C. 시각 효과 (Visual Effects)
- **조명**: Ambient Light + Spot Light (그림자 생성).
- **블룸(Bloom)**: 몽환적인 분위기를 위한 강한 발광 효과.
- **파괴(Fracture)**: 의자 폭파 시 여러 개의 파편(Debris)으로 쪼개지며 날아감.
- **디지털 글리치(Digital Glitch)**: 폭발 충격 시 발생하는 시퀀스 외에, **상시적으로 발생하는 미세한 환경 글리치(Passive Environmental Glitch)** 추가.
- **아스키 아트(ASCII Art)**: `ShaderPass`를 활용한 8단계 명도 코드 변환. 사용자 색상 변경 가능(Custom Color)하며, 고해상도(Scale 14.0)로 일정 시간(Sustained) 유지됨.

## 4. 파일 구조 (Architecture)
- `src/App.js`: 메인 진입점. 렌더 루프, 씬 설정, 시스템 통합.
- `src/World.js`: 3D 객체 생성, 물리 연산, 마우스/터치 인터랙션 로직.
- `src/Effects.js`: 폭발, 파티클 등 특수 효과 관리.
- `src/Config.js`: 상수 및 설정값 관리.
