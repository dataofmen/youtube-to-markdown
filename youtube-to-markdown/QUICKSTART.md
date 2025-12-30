# 🚀 Quick Start Guide

YouTube to Markdown Converter MVP가 완성되었습니다! 3일 타임라인 내에 모든 핵심 기능이 구현되었습니다.

## ✅ 구현 완료 기능

- ✅ **YouTube 채널 데이터 수집**: 채널 URL만 입력하면 모든 영상 정보 자동 수집
- ✅ **자막 추출**: YouTube InnerTube API를 통한 자동/수동 자막 추출
- ✅ **AI 요약 생성**: Google Gemini 3.0 Pro Preview로 3문장 요약 + 핵심 포인트 자동 생성
- ✅ **마크다운 파일 생성**: 개별 영상별 상세 파일 + NotebookLM용 분기별 통합 파일
- ✅ **실시간 진행 상황**: Server-Sent Events (SSE)로 실시간 진행률 표시
- ✅ **ZIP 다운로드**: 완성된 모든 파일을 ZIP으로 압축하여 다운로드
- ✅ **비용 추적**: Gemini API 사용 비용 실시간 모니터링 (현재 무료/Pay-as-you-go)
- ✅ **Web UI**: React 기반 직관적이고 반응형 사용자 인터페이스

## 📦 설치 방법

### 1. 의존성 설치

```bash
cd youtube-to-markdown

# Backend 의존성 설치
cd backend
npm install

# Frontend 의존성 설치
cd ../frontend
npm install
```

### 2. API 키 설정 확인

`backend/.env` 파일이 이미 생성되어 있으며 다음 내용을 포함합니다:

```env
YOUTUBE_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.0-pro-preview
PORT=3001
```

## 🎯 실행 방법

### 방법 1: 자동 실행 스크립트 (추천)

```bash
cd youtube-to-markdown
./start.sh
```

이 스크립트는 자동으로:
- Backend 서버를 포트 3001에서 시작
- Frontend 개발 서버를 포트 3000에서 시작
- 두 서버를 동시에 실행하고 관리

### 방법 2: 수동 실행

**Terminal 1 - Backend:**
```bash
cd youtube-to-markdown/backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd youtube-to-markdown/frontend
npm run dev
```

## 💻 사용 방법

### Step 1: 웹사이트 접속
브라우저에서 `http://localhost:3000` 접속

### Step 2: 채널 URL 입력
```
기본값으로 설정된 테스트 채널: https://www.youtube.com/@Emmanueltrades
또는 원하는 다른 YouTube 채널 URL 입력
```

### Step 3: 옵션 설정 (선택사항)
- **Date From**: 시작 날짜 (예: 2024-01-01)
- **Date To**: 종료 날짜 (예: 2024-12-31)
- 비워두면 모든 영상 처리

### Step 4: 변환 시작
"🚀 Start Conversion" 버튼 클릭

### Step 5: 진행 상황 확인
실시간으로 표시되는 정보:
- 전체 진행률 (%)
- 총 영상 수 / 처리된 영상 수
- 현재 단계 (자막 추출, AI 요약 생성 등)
- 현재까지 발생한 비용

### Step 6: 완료 및 다운로드
1. "✅ Conversion Completed!" 메시지 확인
2. 결과 통계 확인:
   - 총 영상 수
   - 처리된 영상 수
   - 생성된 파일 수 (Detail Files, Quarterly Files)
   - 총 비용
   - ZIP 파일 크기
3. "📥 Download ZIP File" 버튼 클릭

### Step 7: NotebookLM에 업로드
1. ZIP 파일 압축 해제
2. [NotebookLM](https://notebooklm.google.com) 접속
3. 새 노트북 생성
4. `quarterly/` 폴더의 파일들 업로드
5. 영상 내용에 대해 질문 시작!

## 📊 예상 처리 시간 및 비용

### 소규모 채널 (10-30 영상)
- **처리 시간**: 3-5분
- **예상 비용**: $0.05-$0.15
- **ZIP 크기**: ~0.5MB

### 중간 채널 (50-100 영상)
- **처리 시간**: 8-15분
- **예상 비용**: $0.25-$0.50
- **ZIP 크기**: ~1-2MB

### 대형 채널 (200+ 영상)
- **처리 시간**: 30-60분
- **예상 비용**: $1.00-$2.00
- **ZIP 크기**: ~5-10MB

*비용은 Google Gemini 3.0 Pro Preview 기준이며 정책에 따라 달라질 수 있습니다.*

## 📁 생성되는 파일 구조

```
channel-name-20251118-140530.zip
├── details/                    # 개별 영상 상세 파일
│   ├── 20240115-video-1.md
│   ├── 20240116-video-2.md
│   └── ...
├── quarterly/                  # NotebookLM용 분기별 통합 파일
│   ├── 2024-Q1.md             # 2024년 1분기 영상들 (최대 50개)
│   ├── 2024-Q2.md
│   └── ...
└── index.md                    # 전체 인덱스 파일
```

## 🔍 테스트 시나리오

### 테스트 1: 기본 변환
```
채널: https://www.youtube.com/@Emmanueltrades
날짜 필터: 없음
예상 결과: 모든 공개 영상 변환 성공
```

### 테스트 2: 날짜 범위 필터
```
채널: https://www.youtube.com/@Emmanueltrades
Date From: 2024-01-01
Date To: 2024-06-30
예상 결과: 2024년 상반기 영상만 처리
```

### 테스트 3: 다른 채널
```
원하는 다른 YouTube 채널 URL 입력
예: https://www.youtube.com/@visualPKM
```

## 🐛 문제 해결

### 포트 충돌 오류
```bash
# macOS/Linux
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID [PID] /F
```

### 모듈을 찾을 수 없음
```bash
cd backend && npm install
cd ../frontend && npm install
```

### YouTube API 할당량 초과
- 24시간 후 재시도
- 또는 다른 API 키 사용

### Gemini API 오류
- API 키 유효성 확인
- Google AI Studio 할당량 확인

## 📚 추가 문서

- **README.md**: 전체 프로젝트 개요 및 상세 설명
- **TESTING.md**: 상세한 테스트 가이드 및 체크리스트
- **PRD**: 제품 요구사항 문서 (`__prompts/251118-0001-youtube-to-markdown-converter-prd.md`)

## 🎉 성공!

모든 MVP 기능이 3일 타임라인 내에 완성되었습니다. 이제 바로 사용하실 수 있습니다!

**다음 단계**:
1. ✅ 설치 완료
2. ✅ 실행 테스트
3. 🎯 실제 채널로 테스트
4. 📝 피드백 수집
5. 🚀 개선 및 최적화

---

**질문이나 문제가 있으시면 언제든지 문의해 주세요!**
