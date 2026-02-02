# 📅 프로젝트 진행 상황 (Project Story)

## Current Status
**2026-02-02**: 3D 웹사이트 프로토타입 구현 및 모바일 대응 완료.
- 물리 엔진(Cannon-es)과 렌더링(Three.js) 동기화 안정화.
- 모바일 터치 동작(드래그 vs 패닝 vs 탭) 분기 처리 완료.
- AI 협업을 위한 프로젝트 구조화 작업 수행 중.

## Version History

### v0.1.0 - Prototype
- 기본 3D 씬 구성 (바닥, 조명, 안개).
- 의자 모델(GLB) 로드 및 원형 배치 로직 구현.
- 마우스 드래그를 이용한 물리 상호작용 구현.

### v0.2.0 - Visual & Physics Upgrade
- `EffectComposer`를 이용한 Bloom 효과 적용.
- 의자 물리 충돌체(Compound Shape) 정밀화.
- 폭발(Explosion) 및 파편(Debris) 시스템 구현 (`Effects.js`).

### v0.3.0 - Mobile Support
- 터치 이벤트 리스너 추가.
- 멀티 터치 제스처 구현 (1터치: 이동, 2터치: 폭탄/패닝).

### v0.4.0 - Interaction Polish (2026-02-03)
- **Spawn System**: UI 버튼 제거 → 의자 클릭 시 세포 분열(Mitosis) 방식으로 생성.
- **Physics Tuning**: 엉김 방지 로직 보완 (Horizontal Split + Impulse `20`, Offset `0.85`).
- **Handheld Camera**: Simplex Noise 도입, 기본 강도 `0.2`로 설정.
- **GUI Refactoring**: 계층 구조 평탄화 (Flat Hierarchy) 및 접근성 개선.

### v0.5.0 - Visual FX Overhaul (2026-02-03)
- **Digital Glitch System**: Impact → Decay → Echo 시퀀스 구현. 잔향(Echo) 지속 시간을 8초로 설정하여 긴장감 조성.
- **ASCII Art Engine**: 8단계 명암 `AsciiShader` 도입. 고해상도(Scale 14.0) 및 Short Burst(0.03~0.08s) 튜닝으로 타격감 최적화.
- **Passive Environment**: 폭발 없이도 상시적으로 발생하는 간헐적 노이즈(RGB Shift, ASCII) 구현.
- **Debug Tools**: `S`키 메뉴에 FX 제어(Color, Force Toggle) 기능 통합.

## Next To-Do
- [x] AI 페르소나 기반 개발 프로세스 안착.
- [x] Glitch & ASCII FX 시스템 완성.
- [ ] 추가 콘텐츠 기획 (예: 새로운 오브젝트, 게임 모드 등).
