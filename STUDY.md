# CTF Writeup Platform 개발 일지 - Phase 1

이 문서는 CTF Writeup 플랫폼 개발 과정(Phase 1)에서 학습하고 적용한 핵심 기술과 해결한 문제들을 정리한 학습 노트입니다.

## 1. Next.js App Router & 트러블슈팅

### 1-1. `useSearchParams`와 Suspense
Next.js App Router에서 클라이언트 컴포넌트가 `useSearchParams()`를 사용할 때, 빌드타임에 정적으로 생성될 수 없는 부분이 있어 반드시 **`<Suspense>`**로 감싸주어야 합니다. 이를 처리하지 않으면 Vercel 배포 시 빌드 에러가 발생합니다.

```tsx
// ❌ 에러 발생 코드
export default function Page() {
  const searchParams = useSearchParams() // 훅을 직접 사용
  return <div>...</div>
}

// ✅ 해결 코드 (컴포넌트 분리 패턴)
function Content() {
  const searchParams = useSearchParams()
  return <div>...</div>
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Content />
    </Suspense>
  )
}
```

### 1-2. 동적 메타데이터 (OG Tag)
동적 경로(`app/posts/[id]`)에서 페이지마다 다른 제목과 이미지를 보여주기 위해 `generateMetadata` 함수를 사용했습니다. 특히 배포 환경과 로컬 환경의 URL 차이를 처리하는 로직이 중요했습니다.

```tsx
export async function generateMetadata({ params }) {
  // NEXT_PUBLIC_APP_URL(운영) 우선, 없으면 VERCEL_URL, 둘 다 없으면 localhost
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ...
  // ... OpenGraph 설정
}
```

## 2. Supabase & 보안 (Security)

### 2-1. RLS (Row Level Security) vs View
*   **문제 상황**: 비공개 글(`is_public: false`)을 메인 페이지 목록에는 띄우고 싶지만, **내용(Content)**은 보여주고 싶지 않음.
*   **RLS의 한계**: RLS는 기본적으로 **행(Row)** 단위로 권한을 제어합니다. "조회 허용"하면 모든 데이터를 다 가져오고, "조회 불가"하면 아예 안 보입니다.
*   **해결 방법 (SQL View)**: 특정 컬럼(Content)만 조건부로 가리는 가상의 테이블(View)을 생성하여 해결했습니다.

```sql
-- 조건부로 내용을 NULL 처리하는 View 생성
create view posts_view as
select id, title,
  (case when is_public or auth.uid() = author_id then content else null end) as content
from posts;
```

### 2-2. 인증 리다이렉트 (Magic Link)
로그인 링크가 `localhost`로 잘못 연결되는 문제를 해결하기 위해, 환경 변수에 따라 리다이렉트 주소를 동적으로 결정하도록 수정했습니다. 또한 Supabase 대시보드에서 **Site URL** 및 **Redirect URLs** 설정(와일드카드 `**` 포함)이 필수적임을 배웠습니다.

## 3. UI/UX & Tailwind CSS

### 3-1. Semantic Colors (의미론적 색상)
다크 모드와 라이트 모드를 효율적으로 관리하기 위해, 색상 값을 하드코딩(예: `bg-gray-900`)하는 대신 **Semantic Variable**(예: `bg-background`, `text-primary`)을 사용했습니다.

*   `globals.css`: `:root`와 `.dark` 클래스에 CSS 변수 정의
*   `tailwind.config.ts`: Tailwind 설정에서 해당 변수를 매핑
*   **장점**: 테마 변경 시 코드 수정 없이 CSS 변수값만 바꾸면 전체 적용됨

### 3-2. 검색 UX 개선
검색 필터 변경 시 페이지를 새로고침하지 않고 URL만 업데이트하기 위해 `router.replace`와 `scroll: false` 옵션을 사용했습니다. 이를 통해 검색 상태(키워드, 태그 등)를 유지하면서도 부드러운 사용자 경험을 제공하고, URL 공유도 가능하게 만들었습니다.


## 4. Phase 2: 심화 기능 구현 및 최적화 (Planned)

Phase 2에서는 사용자가 콘텐츠를 생산하고 발견하는 핵심 기능을 강화하고, 상호작용 요소를 도입하여 플랫폼의 완성도를 높이는 것을 목표로 했습니다.

### 4-1. Rich Text Editor (Tiptap) 도입
*   **목표**: 단순 텍스트가 아닌 코드 블록, 이미지, 서식 등을 지원하는 강력한 에디터 구현.
*   **기술**: `Tiptap` (Headless Editor) 사용.
*   **주요 기능**:
    *   **이미지 업로드**: Supabase Storage와 연동하여 에디터 내 드래그 앤 드롭 업로드 구현.
    *   **코드 하이라이팅**: `highlight.js`와 연동하여 CTF Writeup 특성에 맞는 코드 가독성 제공.

### 4-2. 검색 및 필터링 시스템 고도화
*   **목표**: 방대한 Writeup 중에서 원하는 글을 빠르게 찾을 수 있도록 함.
*   **구현**:
    *   **URL 동기화**: `q`, `tag`, `category` 파라미터를 URL과 동기화하여 검색 결과 공유 가능.
    *   **Live Search**: Navbar에서 입력 즉시 간략한 결과를 보여주는 프리뷰 검색 구현.
    *   **복합 필터**: 태그, 카테고리, CTF 이름 등 여러 조건을 조합(AND/OR 조건)하여 필터링하는 Supabase Query 최적화.

### 4-3. 상호작용 및 소셜 기능
*   **목표**: 사용자 간의 인터랙션 증대.
*   **구현 예정**:
    *   **댓글 시스템**: 계층형(Threaded) 댓글 구조 설계 및 실시간 업데이트.
    *   **좋아요/북마크**: Optimistic Update(낙관적 업데이트)를 적용하여 즉각적인 UI 반응성 확보.
    *   **OG Image 생성**: `@vercel/og`를 사용하여 글 공유 시 동적으로 썸네일(제목, 카테고리 포함) 생성.

## 5. Phase 3: UI 완성도 및 사용자 경험 (Future)

Phase 3는 플랫폼의 시각적 완성도를 높이고, 사용자가 플랫폼에 머무는 동안 최적의 경험을 제공하는 데 초점을 맞춥니다.

### 5-1. 테마 시스템 (Dark/Light Mode)
*   **목표**: 사용자의 시스템 설정 또는 선호에 따라 다크/라이트 모드를 완벽하게 지원.
*   **기술**: `next-themes` 라이브러리 사용.
*   **구현 전략**:
    *   **FOUC 방지**: `suppressHydrationWarning`을 사용하여 새로고침 시 테마 깜빡임 현상 방지.
    *   **Semantic Token 확장**: `bg-card`, `text-muted` 등 추상화된 변수명을 사용하여 테마별 색상 로직을 일원화.

### 5-2. 반응형 디자인 및 접근성
*   **목표**: 모바일, 태블릿, 데스크탑 등 모든 기기에서 최적화된 레이아웃 제공.
*   **구현 내용**:
    *   **Mobile First Styling**: 모바일 레이아웃을 기본으로 하고 `md:`, `lg:` 브레이크포인트를 추가하는 방식.
    *   **Table of Contents (TOC)**: 긴 글을 읽을 때 현재 위치를 파악할 수 있는 사이드바 네비게이션 (데스크탑 전용).
    *   **접근성(a11y)**: 적절한 `aria-label`, 시맨틱 HTML 태그(`main`, `article`, `nav`) 사용 준수.

### 5-3. 성능 최적화 (Web Vitals)
*   **목표**: LCP, CLS 등 핵심 웹 지표 개선.
*   **전략**:
    *   **이미지 최적화**: `next/image`를 사용하여 WebP 포맷 변환 및 Lazy Loading 적용.
    *   **폰트 최적화**: `next/font`를 사용하여 구글 폰트(Inter)를 빌드 타임에 다운로드, 레이아웃 시프트 방지.

## 6. Phase 4: UX 고도화 및 소셜 기능 (Advanced)

Phase 4는 사용자의 체류 시간을 늘리고 커뮤니티성을 강화하기 위한 고급 기능들을 포함합니다.

### 6-1. 상호작용 인터랙션 (Interactions)
*   **목표**: 단순 열람을 넘어 사용자가 반응할 수 있는 요소 제공.
*   **구현 전략**:
    *   **낙관적 UI (Optimistic UI)**: 좋아요/북마크 클릭 시 서버 응답을 기다리지 않고 UI를 먼저 업데이트하여 앱 같은 반응 속도 구현. `useOptimistic` 훅 또는 로컬 상태 관리 활용.
    *   **실시간 카운트**: Supabase Realtime을 활용하여 인기 글의 좋아요 수가 실시간으로 오르는 시각적 효과 고려.

### 6-2. 기여도 시각화 (User Activity)
*   **목표**: 사용자의 학습 및 기여 동기 부여.
*   **구현 내용**:
    *   **잔디 심기 (Contribution Graph)**: GitHub 프로필과 유사하게, 지난 1년간의 Writeup 작성 활동을 히트맵(Heatmap) 형태로 시각화. `react-activity-calendar` 등의 라이브러리 활용 예정.
    *   **활동 로그**: 댓글 작성, 좋아요 등 활동 내역을 타임라인으로 제공.

### 6-3. 소셜 공유 최적화 (OG Images)
*   **목표**: 외부 플랫폼(Twitter, Discord 등) 공유 시 클릭률(CTR) 증대.
*   **기술**: `@vercel/og` (Edge Runtime 기반 이미지 생성).
*   **구현 전략**:
    *   **동적 템플릿**: 글 제목, 카테고리, 작성자, 썸네일 이미지를 합성하여 매번 고유한 OG 이미지를 즉석에서 생성.
    *   **브랜딩 강화**: 플랫폼의 로고와 테마 색상을 반영하여 일관된 브랜드 아이덴티티 전달.

---
*Date: 2025-12-23*
*Author: User & Antigravity*
