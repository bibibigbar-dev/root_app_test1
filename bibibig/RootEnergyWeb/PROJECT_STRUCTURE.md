# 프로젝트 구조

```
RootEnergyWeb/
├── public/                          # 정적 파일
│   ├── fonts/                       # 폰트 파일
│   │   └── PretendardVariable.woff2
│   └── images/                      # 이미지 파일
│       ├── logo.png
│       ├── logo-white.png
│       ├── solution01.jpg
│       ├── solution02.jpg
│       ├── solution03.jpg
│       ├── funds.jpg
│       ├── about-main.jpg
│       ├── re100.jpg
│       └── ...
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx              # 루트 레이아웃
│   │   ├── page.tsx                # 메인 페이지
│   │   │
│   │   ├── about/                  # 회사소개
│   │   │   └── page.tsx
│   │   │
│   │   ├── solution01/             # 지역수용성 솔루션
│   │   │   └── page.tsx
│   │   ├── solution02/             # 지역주도 사업개발
│   │   │   └── page.tsx
│   │   ├── solution03/             # RE100/탄소중립
│   │   │   └── page.tsx
│   │   ├── funds/                  # 시민펀드
│   │   │   └── page.tsx
│   │   │
│   │   ├── press/                  # 언론보도
│   │   │   └── page.tsx
│   │   ├── newsletter/             # 뉴스레터
│   │   │   └── page.tsx
│   │   ├── notice/                 # 공지사항
│   │   │   └── page.tsx
│   │   │
│   │   ├── recruitment/            # 채용
│   │   │   └── page.tsx
│   │   │
│   │   ├── inquiry/                # 문의하기
│   │   │   └── page.tsx
│   │   │
│   │   └── admin/                  # 관리자 페이지
│   │       ├── layout.tsx
│   │       ├── login/
│   │       │   └── page.tsx
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── board/              # 게시판 관리
│   │       │   └── page.tsx
│   │       ├── popup/              # 팝업 관리
│   │       │   └── page.tsx
│   │       └── statistics/         # 통계
│   │           └── page.tsx
│   │
│   ├── components/                 # 재사용 컴포넌트
│   │   ├── Header.tsx             # 헤더
│   │   ├── Footer.tsx             # 푸터
│   │   └── AdminSidebar.tsx       # 관리자 사이드바
│   │
│   ├── lib/                       # 유틸리티
│   │   └── firebase.ts            # Firebase 설정
│   │
│   ├── types/                     # TypeScript 타입
│   │   └── index.ts
│   │
│   └── styles/                    # 스타일
│       └── globals.css            # 전역 스타일
│
├── .gitignore                     # Git 무시 파일
├── .env.example                   # 환경 변수 예제
├── next.config.js                 # Next.js 설정
├── tailwind.config.js             # Tailwind CSS 설정
├── postcss.config.js              # PostCSS 설정
├── tsconfig.json                  # TypeScript 설정
├── package.json                   # 패키지 정보
└── README.md                      # 프로젝트 문서
```

## 주요 파일 설명

### 설정 파일
- `next.config.js`: Next.js 프로젝트 설정
- `tailwind.config.js`: Tailwind CSS 테마 및 색상 설정
- `tsconfig.json`: TypeScript 컴파일러 설정
- `.env.example`: 환경 변수 템플릿 (Firebase 설정)

### 소스 코드
- `src/app/`: Next.js 13+ App Router 기반 페이지
- `src/components/`: 재사용 가능한 React 컴포넌트
- `src/lib/`: Firebase 등 유틸리티 함수
- `src/types/`: TypeScript 타입 정의
- `src/styles/`: 전역 CSS 및 Tailwind 설정

### 사용자 페이지
- `/`: 메인 페이지
- `/about`: 회사소개
- `/solution01-03`: 솔루션 페이지
- `/funds`: 시민펀드
- `/press`: 언론보도
- `/newsletter`: 뉴스레터
- `/notice`: 공지사항
- `/recruitment`: 채용
- `/inquiry`: 문의하기

### 관리자 페이지
- `/admin/login`: 관리자 로그인
- `/admin/dashboard`: 대시보드
- `/admin/board`: 게시판 관리
- `/admin/popup`: 팝업 관리
- `/admin/statistics`: 통계

## 다음 단계

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**
   - `.env.example`을 참고하여 `.env.local` 파일 생성
   - Firebase 프로젝트 설정값 입력

3. **이미지 업로드**
   - `public/images/` 폴더에 필요한 이미지 파일 업로드

4. **폰트 설치**
   - `public/fonts/` 폴더에 Pretendard 폰트 파일 업로드

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```

6. **Firebase 설정**
   - Firestore 데이터베이스 생성
   - Storage 설정
   - Authentication 설정

