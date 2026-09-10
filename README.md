# 하키 데이터 매니저

아이스하키 선수들의 나이별 득점률을 분석하고, 에이징 커브를 학습한 뒤
감독이 되어 선수 영입 결정을 내려보는 웹앱입니다.

## 파일
- `index.html` : 전체 화면 구조
- `styles.css` : 디자인
- `data.js` : 선수 득점률 데이터
- `script.js` : 그래프, 퀴즈, 감독 모드 기능

## GitHub Pages 배포
1. 새 GitHub Repository 생성
2. 이 폴더 안의 4개 파일 업로드
3. Settings → Pages
4. Deploy from a branch 선택
5. Branch를 `main`, 폴더를 `/ (root)`로 선택
6. Save 후 생성된 URL 확인

## 주의
현역 선수의 미래 기록은 아직 알 수 없으므로 감독 모드의 추천은 실제 미래 예측이 아니라
현재 득점률, 최근 변화, 나이를 활용한 게임용 데이터 판단입니다.
