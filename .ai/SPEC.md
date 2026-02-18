# 🏗 프로젝트 명세서 (Project Specification)

## 1. 프로젝트 개요
- **프로젝트명**: Plastic Chair Club (plasticchairweb)
- **목표**: "플라스틱 의자"를 테마로 한 고품질 3D 인터랙티브 웹사이트 프로토타입.
- **핵심 경험**: 물리 엔진 기반의 유쾌한 상호작용(던지기, 부수기)과 독창적인 시각 효과(글리치, 아스키 아트) 제공.

## 2. 아키텍처 (Architecture)
프로젝트는 기능별로 모듈화된 **시스템(Systems)** 구조를 따릅니다.

### A. 시스템 (src/systems/)
- **WorldSystem.js**: 3D 월드 구성, 물리 엔진(Cannon-es) 연동, 의자 생성 및 사용자 인터랙션(드래그/터치) 처리.
- **EffectSystem.js**: 전체 시각 효과의 중앙 관리자. 파티클 및 후처리 시스템을 조율.
- **ParticleSystem.js**: 화염, 연기, 파편 등 다양한 파티클 효과의 생성 및 생명주기 관리.
- **PostProcessSystem.js**: 화면 전체에 적용되는 글리치(Glitch), 아스키(ASCII) 아트 등 후처리 효과 제어.

### B. 유틸리티 (src/utils/)
- **Utils.js**: Simplex Noise 등 수학적 도구 모음.
- **Shaders.js**: 커스텀 쉐이더(ASCII Art) 정의.

### C. 설정 (src/Config.js)
- **Config.js**: 게임 내 모든 매직 넘버(물리 상수, 색상, 확률 등)를 통합 관리.

## 3. 주요 기능 (Key Features)

### A. 월드 & 물리 (World & Physics)
- **의자 시뮬레이션**: 정교한 충돌체(Compound Shape)를 가진 의자 생성.
- **상호작용**:
  - **PC**: 마우스 드래그(던지기), 우클릭(폭탄).
  - **Mobile**: 터치 드래그(이동), 탭(폭탄), 핀치/두손가락(패닝).
- **세포 분열(Mitosis)**: 의자 클릭 시 즉시 복제되며 튕겨나가는 효과.

### B. 시각 효과 (Visual Effects)
- **폭발 & 파괴**: 의자 파괴 시 파편(Debris) 생성 및 물리적 충격파 구현.
- **디지털 글리치**: 충격 발생 시 화면 깨짐(Glitch) 및 아스키 아트(ASCII) 변환 효과 연출.
- **조명 & 분위기**: Spot Light 기반의 그림자와 Bloom 효과로 몽환적 분위기 조성.

### C. UI & UX
- **스크롤 배너**: 상단 "POLYPROPYLENE SUPPORT GROUP..." 무한 스크롤 텍스트 (v1.0.1 비활성화).
- **체크인(Check-In)**: Google Apps Script 연동 방문자 등록 시스템.
- **GitHub Link**: 하단 Footer 중앙 "SOURCE" 텍스트 링크 (v1.0.2).
- **모바일 가이드**: 모바일 환경 전용 조작법 오버레이 (자동 숨김).
- **커스텀 커서**: 상태(클릭, 휠, 우클릭)에 반응하는 도형 커서.

## 4. 기술 스택 (Tech Stack)
- **Core**: Three.js, Cannon-es
- **Tooling**: Vite, Docker
