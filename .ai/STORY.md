# 📅 프로젝트 진행 상황 (Project Story)

## Current Status
**2026-02-12**: 시스템 구조 리팩토링 완료 (Architecture Update).
- 하드코딩된 설정값(Config)을 통합하고, 파일 역할을 시스템별(Systems)로 분리 완료.
- 서비스 런칭을 위한 브랜딩 및 편의 기능(Check-In, Mobile Guide) 탑재.

## Version History

### v1.0.0 - Architecture Refactoring (2026-02-12)
- **Structure**: `src/systems/`, `src/utils/` 폴더 구조 도입.
- **Components**: `Effects.js`를 `EffectSystem`, `ParticleSystem`, `PostProcessSystem`으로 분리.
- **Config**: 모든 매직 넘버를 `Config.js`로 중앙화.

### v1.0.1 - Marquee Disabled (2026-02-12)
- **UI**: 상단 파란 띠 및 텍스트(Marquee) 비활성화 (주석 처리).

### v1.0.2 - GitHub Link Re-position (2026-02-12)
- **UI**: 우측 상단 GitHub 로고 제거(주석 처리).
- **Footer**: 하단 내비게이션 바 중앙에 "SOURCE" 텍스트 링크 추가.

### v1.1.0 - Camera DOF Effect (2026-02-20)
- **Visual**: 카메라 피사계 심도(DOF) 효과 추가 (`BokehPass`).
- **Config**: DOF 관련 설정값(Focus, Aperture, MaxBlur) 추가.

### v1.0.3 - Transparent Footer (2026-02-20)
- **UI**: 하단 내비게이션 바(`.bottom-nav`)의 파란색 배경 제거 (버튼 유지).

### v0.9.10 - Auto-Hide Guide (2026-02-12)
- **UX**: 모바일 가이드 텍스트가 **로딩 5초 후 자동으로 Fade-Out** 되도록 CSS Animation 적용.

### v0.9.9 - Guide Text & Spacing (2026-02-12)
- **Text**: 가이드 문구를 `Move`, `Panning`으로 간소화.
- **Spacing**: 줄간격(`line-height`)을 `0.6`으로 완화하여 가독성 확보.

### v0.9.0 ~ v0.9.8 - Branding & Mobile Features (2026-02-12)
- **GitHub Link**: 우측 상단 고정 링크 아이콘 추가 (v0.9.0).
- **Mobile Guide**: 모바일 전용 조작법 오버레이 추가 및 스타일 튜닝 (v0.9.2 ~ v0.9.8).
  - 반응형 폰트, `mix-blend-mode: difference` 적용, 레이아웃 밀착 조정.

### v0.8.0 - Check-In Feature (2026-02-11)
- **Feature**: Google Apps Script 연동 방문자 등록 시스템 구현.
- **Design**: 미니멀한 모달 폼, 입력값 검증 및 중복 전송 방지.

### v0.7.29 - Marquee Alignment Fix (2026-02-06)
- **Fix**: 스크롤 배너 텍스트가 화면 중간에서 시작하는 문제 수정 (Justify-content: flex-start).

### v0.7.28 - Marquee Simplification (2026-02-06)
- **Design**: 텍스트 반복 횟수를 줄이고 간격을 넓혀 여유로운 연출 구현.

### v0.7.27 - Spawn Height Adjustment (2026-02-06)
- **Fix**: 의자가 카메라 시야 밖(높이 12)에서 떨어지도록 수정.

### v0.7.26 - Cursor Z-Index Fix (2026-02-06)
- **Fix**: 커스텀 커서가 UI에 가려지는 문제 해결 (`z-index: 999999`).

### v0.7.15 ~ v0.7.25 - Branding & UI Polish (2026-02-06)
- **Branding**: "Plastic Chair Club" 타이틀 및 파비콘 적용.
- **Marquee**: 상단 "POLYPROPYLENE..." 무한 스크롤 배너 구현.
- **UI**: 하단 `Check In`, `About` 버튼 및 띠 디자인 적용.

### v0.7.14 - Glitch Density Tuning (2026-02-04)
- **Tuning**: 글리치 발생 확률 40%로 상향, Wild Mode 80% 적용으로 임팩트 강화.

### v0.7.13 - Restoration & Tuning (2026-02-04)
- **Restoration**: 프로젝트 리셋 후 모바일 UI 및 FX 설정 복구.
- **Glitch**: 폭발 글리치 지속 시간 연장 및 로직 단순화.

### v0.7.9 - Cursor Feedback (2026-02-03)
- **Feature**: 클릭(수축), 휠(십자), 우클릭(도넛) 시 커서 모양 변형 인터랙션 구현.

### v0.7.7 ~ v0.7.8 - Physics Tuning (2026-02-03)
- **Heavy Drop**: 초기 낙하 시 자연스러운 가속 및 불규칙한 회전 적용.
- **Mitosis Dist**: 분열 거리 계수 1.1로 축소하여 밀집도 향상.

### v0.7.0 ~ v0.7.6 - Interaction Improvements (2026-02-03)
- **Mitosis**: 360도 전방위 랜덤 분열 및 회전 노이즈 추가.
- **Glitch**: 분열 시 확정적(Deterministic) Short Burst 글리치 적용.
- **Config**: Camera 및 Light 설정 값 `Config.js`로 이관 시작.

### v0.5.0 - Visual FX Overhaul (2026-02-03)
- **Glitch System**: Impact → Decay → Echo 시퀀스 구현.
- **ASCII Art**: 쉐이더 기반 아스키 아트 및 해상도 조절 기능 도입.

### v0.1.0 ~ v0.4.0 - Prototyping Phase
- **Core**: Three.js + Cannon-es 물리 엔진 연동.
- **Mobile**: 터치 제스처(이동, 패닝, 탭) 구현.
- **Visuals**: Bloom, Explosion, Debris 시스템 구축.
