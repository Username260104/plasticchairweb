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

### v0.7.15 - Branding Update (2026-02-06)
- **Title**: 웹사이트 제목을 `Plastic Chair Club`으로 변경.
- **Favicon**: `assets/Favicon.png` 아이콘 적용.

### v0.7.16 - Scrolling Text Banner (2026-02-06)
- **Marquee Effect**: 화면 최상단에 `AN ORDINARY SEAT FOR EXTRAORDINARY THOUGHTS SERVICE` 문구가 무한 스크롤되는 배너 추가.
- **Design**: Pretendard 900, 대문자, 흰색 텍스트로 강렬한 인상 전달. `mix-blend-mode: difference`를 적용하여 배경색에 관계없이 가독성 확보.

### v0.7.17 - Text Polish (2026-02-06)
- **Visual Update**: 텍스트 배너의 폰트 사이즈를 `6rem`으로 대폭 키우고, `Pure White` (#FFFFFF) 색상을 적용하여 가시성 극대화.
- **Micro-tuning**: 텍스트 간격(Spacing)을 미세 조정하여 흐름을 개선.

### v0.7.18 - Font Size Adjustment (2026-02-06)
- **Style**: 텍스트 배너의 폰트 사이즈를 `6rem`에서 `1rem`으로 축소.

### v0.7.19 - Fire FX Optimization (2026-02-06)
- **Performance**: 화염(Fire) 파티클 개수를 5,000개에서 2,000개로 60% 감소시켜 폭발 시 랙(Lag)을 완화.
- **Visual**: `AdditiveBlending` 및 `Emissive Intensity` 상향(10→50)을 통해 개수가 줄어도 더 강렬하고 밝은 화염 표현.

### v0.7.20 - Banner Text Update (2026-02-06)
- **Content**: 스크롤 배너 텍스트를 "POLYPROPYLENE SUPPORT GROUP MENTAL MAINTENANCE SERVICE"로 변경.

### v0.7.21 - Banner Style Update (2026-02-06)
- **Style**: 스크롤 배너의 배경색을 투명(Transparent)에서 순수 파랑(#0000FF)으로 변경.

### v0.7.22 - UI Feature Update (2026-02-06)
- **Feature**: 화면 좌/우 하단에 `Check In`, `About` 버튼 추가.
- **UI**: 버튼 클릭 시 "COMING SOON" 오버레이가 페이드인(Fade-in) 되며 3초 후 사라지는 기능 구현.
- **Style**: 버튼 및 오버레이에 `Pretendard Black` 폰트와 `#0000FF` 테마 적용.

### v0.7.23 - UI Refinement (2026-02-06)
- **Style**: 하단 버튼(`Check In`, `About`)을 화면 모서리에 완전히 밀착시킴 (Padding 제거).
- **Typography**: 버튼 텍스트 크기를 상단 스크롤 배너와 동일한 `1rem`으로 조정.

### v0.7.24 - Footer Band Design (2026-02-06)
- **Design**: 하단 `bottom-nav`에 파란색 배경(#0000FF)을 적용하여 상단 배너와 대칭되는 "띠" 형태의 디자인 구현.
- **Layout**: 버튼의 Padding을 제거하고 배경을 투명하게 변경하여, 텍스트가 띠 위에 얹혀져 좌우 끝에 밀착된 형태로 수정.

### v0.7.25 - UI Alignment Fix (2026-02-06)
- **Fix**: 상단 배너와 하단 배너의 높이가 미세하게 다른 문제 수정.
- **Action**: 두 컨테이너의 `height`를 `1.0rem`으로 강제 고정하고 `line-height: 1.0`을 명시하여 픽셀 퍼펙트한 대칭 구현.

### v0.7.26 - Cursor Z-Index Fix (2026-02-06)
- **Fix**: 커스텀 커서가 오버레이나 네비게이션 바 아래에 가려지는 문제 수정.
- **Action**: `#custom-cursor`의 `z-index`를 `999999`로 상향 조정하여 최상위 레이어에 위치하도록 변경.

### v0.7.27 - Spawn Height Adjustment (2026-02-06)
- **Fix**: 의자 생성 시 카메라 시야 내에서 스폰되는 현상 수정.
- **Action**: 초기 스폰 높이(`y`)를 `6`에서 `12`로 변경하여 화면 밖에서 떨어지도록 개선.

### v0.7.28 - Marquee Simplification (2026-02-06)
- **Design**: 상단 스크롤 배너의 텍스트가 너무 많다는 피드백 반영.
- **Action**: 반복되는 텍스트를 줄이고, `marquee-content`에 `min-width: 100vw`를 적용하여 텍스트 사이에 충분한 여백(Gap)을 추가. "한 번에 한 줄씩" 지나가는 듯한 여유로운 연출 구현.

### v0.7.29 - Marquee Alignment Fix (2026-02-06)
- **Fix**: 스크롤 배너 텍스트가 화면 중간에서 갑자기 나타나는 현상 수정.
- **Root Cause**: `marquee-container`의 `justify-content`가 `center`로 설정되어 있어, 시작점이 화면 중앙으로 이동되어 있었음.
- **Action**: 정렬을 `flex-start`로 변경하여 텍스트가 화면 오른쪽 끝(오프스크린)에서 자연스럽게 진입하도록 수정.

- [x] AI 페르소나 기반 개발 프로세스 안착.
- [x] Glitch & ASCII FX 시스템 완성.
- [x] Check-In 기능 구현 (Google Apps Script 연동).
- [ ] 추가 콘텐츠 기획 (예: 새로운 오브젝트, 게임 모드 등).

### v0.8.0 - Check-In Feature (2026-02-11)
- **Feature**: 'CHECK IN' 버튼 클릭 시 나타나는 모달 폼 구현.
- **Design Refresh**:
    - **Minimalism**: 기존 모달 박스/테두리를 제거하고 투명 배경 위 입력창만 배치.
    - **Layout**: 입력창 간격을 `50px`로 대폭 확대하여 시원한 레이아웃 적용.
    - **Styling**: `30px` 높이의 얇은 입력창, 파란색 배경(#0000FF) 및 흰색 텍스트, 라벨 제거(Placeholder 대체).
- **UX Improvement**:
    - **Title Removal**: 'CHECK IN' 텍스트 제거로 심플함 강조.
    - **Interaction**: 배경 클릭 시 닫기 동작을 방지하고, 오직 'X' 버튼으로만 닫히도록 변경 (오작동 방지).
    - **Input Safety**: 입력 중 'S' 키(설정 단축키)가 트리거되지 않도록 예외 처리.
- **Integration**: Google Apps Script 연동 (`FormData` + `fetch`), `name="phone"`, `name="instagram"` 파라미터 매핑 수정.

### v0.9.0 - GitHub Link (2026-02-12)
- **Feature**: 화면 우측 상단에 GitHub 저장소로 이동하는 링크 아이콘 추가.
- **Design**: Minimal SVG 아이콘(White), Hover 시 Scale/Opacity 효과 적용 (`z-index: 100002`).
- **UX**: 스크롤 시에도 항상 노출되도록 `fixed` 포지셔닝 적용.

### v0.9.1 - Documentation Update (2026-02-12)
- **README**: 프로젝트 타이틀을 간소화 ("Plastic Chair Club").

### v0.9.2 - Mobile Guide (2026-02-12)
- **Feature**: 모바일 환경에서만 보이는 인터랙션 가이드 텍스트 추가.
- **UI**: 우측 하단 네비게이션 바 위에 표시 (`1 FINGER: INTERACT & MOVE / 2 FINGER: PANNING / 2 FINGER TAP: ???`).
- **Style**: 작은 폰트(0.7rem), 흰색, 우측 정렬. PC 환경(`>768px`)에서는 숨김 처리.

### v0.9.3 - Mobile Guide Style (2026-02-12)
- **Design**: 모바일 가이드 텍스트를 3줄로 줄바꿈 처리하여 가독성 개선.
- **Visual**: `mix-blend-mode: difference`를 적용하여 배경색(흰색/파랑)에 따라 텍스트 색상이 자동 반전되도록 수정.

### v0.9.4 - Guide Spacing (2026-02-12)
- **Style**: 모바일 가이드 텍스트의 줄간격(`line-height`)을 `1.4`에서 `1.1`로 축소하여 더 밀집된 형태로 개선.

### v0.9.5 - Guide Spacing Fix (2026-02-12)
- **Style**: 모바일 가이드 줄간격을 `1.1`에서 `0.9`로 재조정하여 확실한 밀집 효과 적용.

### v0.9.6 - Guide Layout Tightening (2026-02-12)
- **Compact**: 줄간격을 `0.9`에서 **`0.75`**로 극한까지 축소하여 시각적 덩어리감 강화.
- **Alignment**: 우측 여백(`right`)을 `20px`에서 **`0`**으로 변경하여 화면 모서리에 완전히 밀착.

### v0.9.7 - Guide Alignment Fix (2026-02-12)
- **Position**: 모바일 가이드 위치를 우측(`right: 0`)에서 좌측(`left: 20px`)으로 변경.
- **Alignment**: 텍스트 정렬도 좌측(`text-align: left`)으로 수정하여 가독성 확보.

### v0.9.8 - Extreme Typos (2026-02-12)
- **Position**: 좌측 여백(`left`)을 `20px`에서 **`6px`**로 줄여 화면 경계에 바짝 붙임.
- **Spacing**: 줄간격(`line-height`)을 **`0.4`**로 설정하여 텍스트가 서로 겹쳐 보이는 듯한 강렬한 타이포그래피 연출.

### v0.9.9 - Guide Text & Spacing (2026-02-12)
- **Text**: 가이드 문구를 `INTERACT & MOVE` → `Move`, `PANNING` → `Panning`으로 간소화 (User Feedback).
- **Spacing**: 줄간격(`line-height`)을 `0.4`에서 **`0.6`**으로 완화하여 가독성과 스타일의 균형 조절.
