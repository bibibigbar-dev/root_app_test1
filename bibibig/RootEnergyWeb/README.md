# 루트에너지 홈페이지

Next.js 기반 루트에너지 공식 홈페이지입니다.

## 기술 스택

- **프론트엔드**: Next.js 14, TypeScript, Tailwind CSS
- **백엔드**: Firebase (Firestore, Storage, Authentication)
- **폰트**: Pretendard
- **배포**: Vercel
- **버전관리**: GitHub

## 색상 팔레트

- Primary: `#2c3db8`
- Black: `#000`
- White: `#fff`

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 Firebase 설정값을 입력합니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

### 4. 빌드

```bash
npm run build
```

### 5. 프로덕션 실행

```bash
npm start
```

## 프로젝트 구조

```
/src
  /app              # Next.js App Router
  /components       # 재사용 가능한 컴포넌트
  /lib             # 유틸리티 및 Firebase 설정
  /styles          # 전역 스타일
  /types           # TypeScript 타입 정의
/public
  /images          # 이미지 파일
  /fonts           # 폰트 파일
```

## 주요 페이지

### 사용자 페이지
- 메인 (`/`)
- 회사소개 (`/about`)
- 솔루션 (`/solution01`, `/solution02`, `/solution03`, `/funds`)
- 뉴스룸 (`/press`, `/newsletter`, `/notice`)
- 채용 (`/recruitment`)

### 관리자 페이지
- 로그인 (`/admin/login`)
- 대시보드 (`/admin`)
- 게시판 관리 (`/admin/board`)
- 팝업 관리 (`/admin/popup`)
- 통계 (`/admin/statistics`)

## 배포

Vercel을 통해 자동 배포됩니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/rootenergy-web)

