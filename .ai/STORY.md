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

### v0.6.1 - Glitch Optimization & Physics Tuning (2026-02-03)
- **Simplify**: `RGBShiftShader` 제거 및 `GlitchPass` 단일화. 과도한 이펙트 의존성 삭제.
- **Physics**: 의자 분열(Mitosis)을 **좌/우(Left-Right)** 방향으로 고정하여 엉킴 현상 완전 해결.
- **Spawn**: 최초 스폰 시 랜덤성(위치/회전)을 복구하되, 착지 안정성을 위해 수직축(Upright)은 유지.
- **Bugfix**: `Effects.js` 내 미삭제된 RGB 참조 코드로 인한 런타임 에러 수정.

### v0.7.0 - Mitosis Variety (2026-02-03)
- **Chaotic Mitosis**: 의자 분열 시 고정 방향(좌우)을 폐기하고 360도 전방위 랜덤 분열 로직 적용.
- **Rotation Noise**: 자식 개체 생성 시 Y축 회전에 무작위 오프셋(Twist)을 추가하여 자연스러움 강화.
- **Physics**: 엉킴 방지를 위해 스폰 거리를 기존 `1.2`배에서 `1.4`배로 소폭 상향 조정.

### v0.7.1 - Effects Refactoring (2026-02-03)
- **Code Clean-up**: `Effects.js` 내 중복 정의된 `updateGlitch` 메서드 및 죽은 코드(`RGBShiftPass`) 완전 삭제.
- **Reliable Glitch**: 분열(Mitosis) 시 글리치 발생 로직을 확률(1%)에서 **확정(Deterministic Short Burst)** 방식으로 변경하여 타격감 보장.

### v0.7.2 - Glitch Tuning (2026-02-03)
- **Exclusive OR Logic**: 의자 분열 시 `GlitchPass`와 `AsciiPass`가 동시에 터져 과도한 시각적 피로를 유발하던 문제 해결.
- **Random Selection**: 50:50 확률로 둘 중 하나만 선택되어 발동.
- **Duration Tweak**: 효과 지속 시간을 `0.25s`에서 `0.15s`로 단축하여 더욱 간결한 타격감(Snap) 연출.

### v0.7.3 - Physics Tuning (2026-02-03)
- **Force Reduction**: 의자 분열 시 튕겨나가는 힘(`MITOSIS_FORCE`)을 `35`에서 `20`으로 하향 조정하여, 의자가 너무 멀리 날아가는 현상 방지.

### v0.7.4 - Config Refactoring (2026-02-03)
- **Centralization**: 하드코딩되어 있던 `Camera` 및 `Light` 설정을 `Config.js`로 이관하여 유지보수성 향상.

### v0.7.5 - GUI Enhancements (2026-02-03)
- **Visibility Fix**: 히든 메뉴(Settings)에서 입력창 선택 시 글씨가 안 보이던 문제 해결 (`focus-color` 변경).
- **Camera Tracking**: `Camera` 섹션에 현재 위치(Position)와 회전(Rotation) 값을 실시간으로 표시. 특히 **회전 값은 도(Degree) 단위로 자동 변환**하여 직관성 제공.
- **Config Update**: `Config.js`에 `CAMERA.ROT` 항목을 추가하여 초기 회전 각도를 Degree 단위로 설정 가능.

### v0.7.6 - ASCII Control (2026-02-03)
- **Resolution Slider**: 히든 메뉴의 `FX Debug` 섹션에 아스키 아트의 입자 크기(Scale)를 조절하는 슬라이더 추가 (범위: 5~50).

### v0.7.7 - Heavy Drop (2026-02-03)
- **Natural Free Fall**: 초기 의자의 강제 하강 속도를 제거하고, 중력에 의해 자연스럽게 가속되도록 `-1.0`의 약한 힘만 부여.
- **Unstable Landing**: 착지 시 의자가 비틀거리며 튀도록 `X/Z` 축에 난수 회전(`±1.0`)과 각속도(`±5`) 추가.
- **Facing Forward**: 초기 생성 시 360도 회전하는 대신, 카메라를 등지지 않도록 앞쪽 180도(`-90°~+90°`) 내에서만 회전.

### v0.7.8 - Mitosis Distance (2026-02-03)
- **Closer Spawn**: 의자 분열 시 자식 오브젝트가 생성되는 거리 계수를 `1.4`에서 `1.1`로 축소하여 더 밀집된 형태로 증식.

- **Config Exposed**: `Config.js`의 `CHAIR.SPAWN.MITOSIS_DIST_FACTOR` 값으로 거리 조절 가능.

### v0.7.9 - Cursor Feedback (2026-02-03)
- **Interactive Cursor**: 마우스 입력에 따라 커서가 시각적으로 반응하도록 개선.
    - **Left Click**: 크기 수축(Scale Down)으로 터치감 표현.
    - **Wheel Click**: 붉은색 십자(Crosshair) 형태로 변형.
    - **Right Click**: 가운데가 비어있는 **도넛(Donut)** 형태로 변형되며 `1.3배` 확대 (조준 모드). 모든 변형은 부드러운 애니메이션(`Ease-out`) 처리.


### v0.7.10 - Mobile UI Fix (2026-02-03)
- **Title Visibility**: 모바일 기기(폭 768px 이하)에서 타이틀 텍스트가 너무 작게 보이던 문제를 해결.
- **Responsive Font**: 모바일 환경에서 `font-size`를 `1.5vw`에서 `7vw`로 대폭 상향 조정.
- **Refactoring**: `index.html`에 혼재되어 있던 타이틀 스타일을 `style.css`로 통합.


### v0.7.11 - Mobile Controls Fix (2026-02-03)
- **Zoom & Pan**: 모바일에서 두 손가락 제스처를 시 `PAN`(이동)만 되던 설정을 `DOLLY_PAN`(줌 & 이동)으로 변경.
- **Touch Action**: `style.css`에 `touch-action: none`을 추가하여 브라우저의 기본 제스처(세로 스크롤 등) 간섭을 차단.

### v0.7.12 - Project Reset (2026-02-04)
- **Hard Reset**: `git reset --hard origin/main` 명령을 통해 로컬 변경 사항을 초기화하고 원격 저장소(`origin/main`) 상태로 되돌림.

### v0.7.13 - Restoration & Tuning (2026-02-04)
- **Restoration**: 이전 세션(v0.7.11)의 모바일 UI 및 FX 튜닝 사항을 일괄 복구 및 적용.
- **Mobile UI**: 제목 폰트 사이즈(`7vw`) 및 터치 액션(`none`), `DOLLY_PAN` 컨트롤 적용 확인.
- **Glitch FX**:
    - 폭발 글리치 지속 시간을 `10.5초`로 연장.
    - Mitosis 시 `ASCII` 없이 `Normal Glitch`만 100% 발생하도록 로직 단순화.
    - Phase 1~3 확률 디테일 튜닝.
- **Fuse FX**: 폭탄 심지 효과를 `Sparkler`에서 `Smoke`(Size 0.3, Darker)로 변경하여 가시성 개선.
- **Light System**:
    - `Config.js`에 `LIGHT.SPOT.TARGET` 속성 추가 및 좌표 매핑 구현.
    - 조명 및 카메라 초기 위치값 정밀 튜닝 (Camera LookAt 매커니즘 개선).

### v0.7.14 - Glitch Density Tuning (2026-02-04)
- **Phase 1 Optimization**:
    - **Glitch Probability**: **40%**로 상향 조정 (User Manual Tuning).
    - **Wild Mode Chance**: 발동 시 **80%** 확률로 강한 이펙트(`goWild`) 발생.
    - **ASCII Probability**: 30% → **10%**로 하향 유지.
    - **Result**: "깜빡임(Strobe)"의 빈도는 적당히 유지하되, 한 번 터질 때 확실하게 강한 임팩트를 주도록 밸런싱.

## Next To-Do
- [x] AI 페르소나 기반 개발 프로세스 안착.
- [x] Glitch & ASCII FX 시스템 완성.
- [ ] 추가 콘텐츠 기획 (예: 새로운 오브젝트, 게임 모드 등).
