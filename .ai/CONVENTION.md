# 📏 코딩 컨벤션 및 규칙 (Conventions)

## 1. 언어 및 주석 가이드
- **기본 언어**: 한국어 (Korean).
- **코드 (식별자)**: 영어 (CamelCase 권장).
  - 클래스: `PascalCase` (e.g., `WorldSystem`)
  - 변수/함수: `camelCase` (e.g., `createFloor`, `isDragging`)
  - 상수: `UPPER_SNAKE_CASE` (e.g., `PANEL_COUNT`)
- **주석 (Comments)**:
  - **모든 설명은 한국어로 작성한다.**
  - 복잡한 로직 위에는 반드시 동작 원리를 설명하는 주석을 단다.
  - 함수 헤더에 역할과 매개변수 설명을 간단히 적는다.

## 2. 코드 스타일
- **모듈화**: 코드는 기능별로 파일을 분리한다 (`export`/`import`).
- **들여쓰기**: Space 4칸을 기본으로 한다.
- **세미콜론**: 문장 끝에 반드시 세미콜론(`;`)을 사용한다.
- **안전성**: `null` 또는 `undefined` 체크를 철저히 한다 (Optional Chaining `?.` 적극 활용).

## 3. 작업 프로세스 (Workflow)
1. **Context Analysis**: 현재 코드 상태 파악.
2. **Design**: 기획자(Planner)가 변경 사항 명세.
3. **Implementation**: 개발자(Coder)가 코드 작성.
4. **Audit**: 감시자(Auditor)가 코드 리뷰 및 피드백.

## 4. 금기 사항 (Anti-Patterns)
- **하드코딩**: 매직 넘버는 `Config.js`로 분리한다.
- **전역 변수 남용**: 클래스 멤버 변수나 모듈 스코프를 사용한다.
- **혼합된 언어**: 주석에 영어를 섞어 쓰지 마라 (용어 제외).
