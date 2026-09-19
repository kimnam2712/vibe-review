# vibe-review

AI가 짠 웹/모바일 코드를 붙여 넣고, 약 30분용 검수 결과(통과/주의/위험 + 다음에 고칠 것 3개)를 보는 초박 도구입니다.

## 실행

ES 모듈이라 `file://`로 열면 `data/checks.json`을 불러오지 못합니다. 로컬 정적 서버로 엽니다.

```bash
cd /workspace/vibe-review && python3 -m http.server 8765
```

브라우저: http://127.0.0.1:8765/

GitHub Pages는 저장소 루트(`/`) 기준 상대 경로로 동작합니다 (`.nojekyll`).

## 테스트

```bash
node tests/review.test.js
```

## 구조

```
vibe-review/
  index.html
  src/css/styles.css
  src/js/app.js
  src/js/review.js
  src/js/checks-loader.js
  data/checks.json
  tests/review.test.js
  README.md
  .nojekyll
```

## 범위

- 입력: 스택(웹|모바일) + 코드/설명 텍스트
- 검사 축 4개 × 문항 3개 (`data/checks.json`, 임시 플레이스홀더)
- 출력: 통과/주의/위험 + 다음에 고칠 것 3개
- 추가 휴리스틱: 디프 유무 · 검증 명령/로그 유무 · 범위 밖 변경 의심

## 금지

로그인·결제·Drive·대시보드 합치기·자동 수정 PR 없음.
