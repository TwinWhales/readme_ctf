# CTF Writeup Platform 개발 일지 - Phase 1

이 문서는 CTF Writeup 플랫폼 개발 과정(Phase 1)에서 학습하고 적용한 핵심 기술과 해결한 문제들을 정리한 학습 노트입니다.

## 1. Next.js App Router & 트러블슈팅

### 1-1. `useSearchParams`와 Suspense

Next.js App Router에서 클라이언트 컴포넌트가 `useSearchParams()`를 사용할 때, 빌드타임에 정적으로 생성될 수 없는 부분이 있어 반드시 **`<Suspense>`**로 감싸주어야 합니다. 이를 처리하지 않으면 Vercel 배포 시 빌드 에러가 발생합니다.

```tsx
// ❌ 에러 발생 코드
export default function Page() {
  const searchParams = useSearchParams(); // 훅을 직접 사용
  return <div>...</div>;
}

// ✅ 해결 코드 (컴포넌트 분리 패턴)
function Content() {
  const searchParams = useSearchParams();
  return <div>...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Content />
    </Suspense>
  );
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

- **문제 상황**: 비공개 글(`is_public: false`)을 메인 페이지 목록에는 띄우고 싶지만, **내용(Content)**은 보여주고 싶지 않음.
- **RLS의 한계**: RLS는 기본적으로 **행(Row)** 단위로 권한을 제어합니다. "조회 허용"하면 모든 데이터를 다 가져오고, "조회 불가"하면 아예 안 보입니다.
- **해결 방법 (SQL View)**: 특정 컬럼(Content)만 조건부로 가리는 가상의 테이블(View)을 생성하여 해결했습니다.

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

- `globals.css`: `:root`와 `.dark` 클래스에 CSS 변수 정의
- `tailwind.config.ts`: Tailwind 설정에서 해당 변수를 매핑
- **장점**: 테마 변경 시 코드 수정 없이 CSS 변수값만 바꾸면 전체 적용됨

### 3-2. 검색 UX 개선

검색 필터 변경 시 페이지를 새로고침하지 않고 URL만 업데이트하기 위해 `router.replace`와 `scroll: false` 옵션을 사용했습니다. 이를 통해 검색 상태(키워드, 태그 등)를 유지하면서도 부드러운 사용자 경험을 제공하고, URL 공유도 가능하게 만들었습니다.

## 4. Phase 2: 심화 기능 구현 및 최적화 (Planned)

Phase 2에서는 사용자가 콘텐츠를 생산하고 발견하는 핵심 기능을 강화하고, 상호작용 요소를 도입하여 플랫폼의 완성도를 높이는 것을 목표로 했습니다.

### 4-1. Rich Text Editor (Tiptap) 도입

- **목표**: 단순 텍스트가 아닌 코드 블록, 이미지, 서식 등을 지원하는 강력한 에디터 구현.
- **기술**: `Tiptap` (Headless Editor) 사용.
- **주요 기능**:
  - **이미지 업로드**: Supabase Storage와 연동하여 에디터 내 드래그 앤 드롭 업로드 구현.
  - **코드 하이라이팅**: `highlight.js`와 연동하여 CTF Writeup 특성에 맞는 코드 가독성 제공.

### 4-2. 검색 및 필터링 시스템 고도화

- **목표**: 방대한 Writeup 중에서 원하는 글을 빠르게 찾을 수 있도록 함.
- **구현**:
  - **URL 동기화**: `q`, `tag`, `category` 파라미터를 URL과 동기화하여 검색 결과 공유 가능.
  - **Live Search**: Navbar에서 입력 즉시 간략한 결과를 보여주는 프리뷰 검색 구현.
  - **복합 필터**: 태그, 카테고리, CTF 이름 등 여러 조건을 조합(AND/OR 조건)하여 필터링하는 Supabase Query 최적화.

### 4-3. 상호작용 및 소셜 기능

- **목표**: 사용자 간의 인터랙션 증대.
- **구현 예정**:
  - **댓글 시스템**: 계층형(Threaded) 댓글 구조 설계 및 실시간 업데이트.
  - **좋아요/북마크**: Optimistic Update(낙관적 업데이트)를 적용하여 즉각적인 UI 반응성 확보.
  - **OG Image 생성**: `@vercel/og`를 사용하여 글 공유 시 동적으로 썸네일(제목, 카테고리 포함) 생성.

## 5. Phase 3: UI 완성도 및 사용자 경험 (Future)

Phase 3는 플랫폼의 시각적 완성도를 높이고, 사용자가 플랫폼에 머무는 동안 최적의 경험을 제공하는 데 초점을 맞춥니다.

### 5-1. 테마 시스템 (Dark/Light Mode)

- **목표**: 사용자의 시스템 설정 또는 선호에 따라 다크/라이트 모드를 완벽하게 지원.
- **기술**: `next-themes` 라이브러리 사용.
- **구현 전략**:
  - **FOUC 방지**: `suppressHydrationWarning`을 사용하여 새로고침 시 테마 깜빡임 현상 방지.
  - **Semantic Token 확장**: `bg-card`, `text-muted` 등 추상화된 변수명을 사용하여 테마별 색상 로직을 일원화.

### 5-2. 반응형 디자인 및 접근성

- **목표**: 모바일, 태블릿, 데스크탑 등 모든 기기에서 최적화된 레이아웃 제공.
- **구현 내용**:
  - **Mobile First Styling**: 모바일 레이아웃을 기본으로 하고 `md:`, `lg:` 브레이크포인트를 추가하는 방식.
  - **Table of Contents (TOC)**: 긴 글을 읽을 때 현재 위치를 파악할 수 있는 사이드바 네비게이션 (데스크탑 전용).
  - **접근성(a11y)**: 적절한 `aria-label`, 시맨틱 HTML 태그(`main`, `article`, `nav`) 사용 준수.

### 5-3. 성능 최적화 (Web Vitals)

- **목표**: LCP, CLS 등 핵심 웹 지표 개선.
- **전략**:
  - **이미지 최적화**: `next/image`를 사용하여 WebP 포맷 변환 및 Lazy Loading 적용.
  - **폰트 최적화**: `next/font`를 사용하여 구글 폰트(Inter)를 빌드 타임에 다운로드, 레이아웃 시프트 방지.

## 6. Phase 4: UX 고도화 및 소셜 기능 (Advanced)

Phase 4는 사용자의 체류 시간을 늘리고 커뮤니티성을 강화하기 위한 고급 기능들을 포함합니다.

### 6-1. 상호작용 인터랙션 (Interactions)

- **목표**: 단순 열람을 넘어 사용자가 반응할 수 있는 요소 제공.
- **구현 전략**:
  - **낙관적 UI (Optimistic UI)**: 좋아요/북마크 클릭 시 서버 응답을 기다리지 않고 UI를 먼저 업데이트하여 앱 같은 반응 속도 구현. `useOptimistic` 훅 또는 로컬 상태 관리 활용.
  - **실시간 카운트**: Supabase Realtime을 활용하여 인기 글의 좋아요 수가 실시간으로 오르는 시각적 효과 고려.

### 6-2. 기여도 시각화 (User Activity)

- **목표**: 사용자의 학습 및 기여 동기 부여.
- **구현 내용**:
  - **잔디 심기 (Contribution Graph)**: GitHub 프로필과 유사하게, 지난 1년간의 Writeup 작성 활동을 히트맵(Heatmap) 형태로 시각화. `react-activity-calendar` 등의 라이브러리 활용 예정.
  - **활동 로그**: 댓글 작성, 좋아요 등 활동 내역을 타임라인으로 제공.

### 6-3. 소셜 공유 최적화 (OG Images)

- **목표**: 외부 플랫폼(Twitter, Discord 등) 공유 시 클릭률(CTR) 증대.
- **기술**: `@vercel/og` (Edge Runtime 기반 이미지 생성).
- **구현 전략**:
  - **동적 템플릿**: 글 제목, 카테고리, 작성자, 썸네일 이미지를 합성하여 매번 고유한 OG 이미지를 즉석에서 생성.
  - **브랜딩 강화**: 플랫폼의 로고와 테마 색상을 반영하여 일관된 브랜드 아이덴티티 전달.

## 7. Phase 5: 기능 검증 및 디테일 보강 (2026-01-18)

사용자 피드백을 바탕으로 닉네임 기능, 게시글 삭제, 그리고 편의 기능을 추가하고 보안을 강화했습니다.

### 7-1. 한글 닉네임 및 정규식 검증

- **요구사항**: 영문뿐만 아니라 한국어 닉네임도 허용해야 함.
- **해결**: 정규식에 유니코드 범위를 추가하여 구현.
  - 기존: `/^[a-zA-Z0-9_]+$/`
  - 변경: `/^[a-zA-Z0-9_\uAC00-\uD7A3]+$/` (한글 음절 및 자모 포함)

### 7-2. 안전한 게시글 삭제 (RLS & Double Check)

- **위험 요소**: 프론트엔드에서 버튼만 숨기는 것으로는 API를 통한 강제 삭제 요청을 막을 수 없음.
- **보안 계층 구조**:
  1.  **UI**: 작성자 본인에게만 'Delete' 버튼 노출.
  2.  **UX**: `window.confirm`으로 실수 방지.
  3.  **DB (핵심)**: Supabase RLS 정책으로 **DB 차원에서 타인의 삭제 요청 차단**.
      ```sql
      CREATE POLICY "Authors can delete their own posts"
      ON posts FOR DELETE USING (auth.uid() = author_id);
      ```

### 7-3. Supabase Join과 외래키 모호성 해결

- **트러블슈팅**: `posts`와 `profiles`를 조인하여 작성자 이름을 가져올 때 `PGRST201` 에러 발생.
- **원인**: 두 테이블 간의 관계(Foreign Key)가 명확하지 않아 조인 경로를 찾지 못함.
- **해결**: 명시적 힌트(`!ConstraintName`) 사용.
  ```tsx
  // Before
  .select('*, author:profiles(username)')
  // After
  .select('*, author:profiles!posts_author_id_fkey(username)')
  ```

### 7-4. 마크다운 임포트 (Markdown Import)

- **기능**: 기존에 작성해둔 `.md` 파일을 불러와 에디터에 자동 입력.
- **구현**:
  - `FileReader`로 텍스트 읽기 -> `marked` 라이브러리로 HTML 변환.
  - `# Title` 패턴을 파싱하여 제목 필드 자동 채움.
  - **TipTap 에디터 동기화**: `useEffect`를 사용하여 외부에서 주입된 `content` prop이 변경될 때 에디터 내부 상태(`setContent`)를 업데이트하도록 수정.

## 8. Phase 6: 스터디룸 및 커뮤니티 구조 확장 (2026-01-25)

"문제 풀이 저장소"를 넘어 "학습 커뮤니티"로 나아가기 위해 스터디룸 기능을 도입했습니다.

### 8-1. 스터디룸 식별 전략 (Tag vs Schema)

- **고민**: 스터디 노트와 일반 CTF Writeup을 어떻게 구분할 것인가?
  1. **DB 스키마 변경**: `post_type` 컬럼 추가. (가장 확실하지만 마이그레이션 비용 발생)
  2. **기존 컬럼 활용**: `ctf_name`에 'Study'라고 적기. (간편하지만 '2026 1학기' 같은 세부 정보를 적을 수 없음)
- **해결(Hybrid)**: **Tag-based Logic**.
  - 사용자는 `ctf_name`에 자유롭게 학기 정보(예: '2025 101')를 적습니다.
  - 시스템은 저장 시 보이지 않는 `#Study` 태그를 자동으로 추가합니다.
  - 조회 시 `#Study` 태그가 있는 글만 스터디룸에 보여줍니다.
  - **장점**: DB 변경 없이 유연성과 데이터 정합성을 모두 챙김.

### 8-2. 레이아웃 구조 변경 (Sidebar)

- **문제**: 기존 `container` 중앙 정렬 레이아웃에서는 사이드바가 콘텐츠와 함께 중앙에 붕 떠있는 느낌을 줌.
- **해결**: `Layout` 레벨에서 구조 변경.
  ```tsx
  <div className="flex">
    <Sidebar /> {/* 화면 전체 높이, 좌측 고정 (width 고정) */}
    <div className="flex-1">
      <main className="container">...</main> {/* 콘텐츠만 중앙 정렬 */}
    </div>
  </div>
  ```
- 이를 통해 디스코드와 유사한 몰입감 있는 좌측 네비게이션 경험을 제공.

### 8-3. 태그 보호 (Tag Protection)

- **문제**: 사용자가 글 수정 시 실수로 `#Study` 태그를 지우면 스터디룸에서 글이 사라짐.
- **해결**:
  - `EditPage`에서 태그 입력창에는 'Study'를 보여주지 않음 (필터링).
  - 대신 "🔒 Study Tag Applied"라는 시각적 배지를 표시.
  - 저장(`Submit`) 시 백엔드로 전송하기 직전에 코드로 다시 `#Study`를 주입.

## 8. Phase 6: 스터디룸 및 커뮤니티 구조 확장 (2026-01-25)

"문제 풀이 저장소"를 넘어 "학습 커뮤니티"로 나아가기 위해 스터디룸 기능을 도입했습니다.

### 8-1. 스터디룸 식별 전략 (Tag vs Schema)

- **고민**: 스터디 노트와 일반 CTF Writeup을 어떻게 구분할 것인가?
  1. **DB 스키마 변경**: `post_type` 컬럼 추가. (가장 확실하지만 마이그레이션 비용 발생)
  2. **기존 컬럼 활용**: `ctf_name`에 'Study'라고 적기. (간편하지만 '2026 1학기' 같은 세부 정보를 적을 수 없음)
- **해결(Hybrid)**: **Tag-based Logic**.
  - 사용자는 `ctf_name`에 자유롭게 학기 정보(예: '2025 101')를 적습니다.
  - 시스템은 저장 시 보이지 않는 `#Study` 태그를 자동으로 추가합니다.
  - 조회 시 `#Study` 태그가 있는 글만 스터디룸에 보여줍니다.
  - **장점**: DB 변경 없이 유연성과 데이터 정합성을 모두 챙김.

### 8-2. 레이아웃 구조 변경 (Sidebar)

- **문제**: 기존 `container` 중앙 정렬 레이아웃에서는 사이드바가 콘텐츠와 함께 중앙에 붕 떠있는 느낌을 줌.
- **해결**: `Layout` 레벨에서 구조 변경.
  ```tsx
  <div className="flex">
    <Sidebar /> {/* 화면 전체 높이, 좌측 고정 (width 고정) */}
    <div className="flex-1">
      <main className="container">...</main> {/* 콘텐츠만 중앙 정렬 */}
    </div>
  </div>
  ```
- 이를 통해 디스코드와 유사한 몰입감 있는 좌측 네비게이션 경험을 제공.

### 8-3. 태그 보호 (Tag Protection)

- **문제**: 사용자가 글 수정 시 실수로 `#Study` 태그를 지우면 스터디룸에서 글이 사라짐.
- **해결**:
  - `EditPage`에서 태그 입력창에는 'Study'를 보여주지 않음 (필터링).
  - 대신 "🔒 Study Tag Applied"라는 시각적 배지를 표시.
  - 저장(`Submit`) 시 백엔드로 전송하기 직전에 코드로 다시 `#Study`를 주입.

### 8-4. 권한 관리 시스템 (RBAC)

- **요구사항**: 사용자(User), 스터디장(Manager), 관리자(Admin) 권한 분리.
- **구현**:
  - `profiles` 테이블에 `role` ENUM 컬럼 추가 (`user`, `manager`, `admin`).
  - **Admin**: `AdminUserList` 컴포넌트를 통해 다른 사용자의 등급을 변경 가능. (프로필 페이지 내장)
  - **Manager**: 스터디룸(카테고리) 추가 권한 보유.

### 8-5. 동적 카테고리 관리

- **기존 방식**: 코드 내 하드코딩된 배열 (`const categories = ['Web', ...]`). 확장이 불가능.
- **변경 방식**: `categories` 테이블 생성 및 연동.
  - **Sidebar**: `useEffect`로 DB에서 카테고리 목록을 Fetch.
  - **UI/UX**: Manager 이상의 권한을 가진 사용자에게만 사이드바에 `[+]` 버튼 노출.
  - **확장성**: 이제 코드를 배포하지 않고도 'Blockchain', 'Cloud' 등 새로운 스터디 분야를 즉시 개설 가능.

### 8-6. 검색 고도화 (작성자 검색)

- **요구사항**: 제목뿐만 아니라 작성자(Username)로도 검색하고 싶다.
- **문제**: `posts` 테이블에는 `author_id`만 있고 `username`은 `profiles` 테이블에 있음. 검색할 때마다 `join`을 하거나 클라이언트에서 필터링하는 것은 비효율적.
- **해결**: Database View 활용 (`posts_view`).
  ```sql
  CREATE VIEW posts_view AS
  SELECT p.*, pr.username
  FROM posts p
  LEFT JOIN profiles pr ON p.author_id = pr.id;
  ```
- **Query**: Supabase의 `.or()` 필터를 사용하여 한 번의 요청으로 제목과 작성자를 동시에 검색.
  ```ts
  .or(`title.ilike.%${query}%,username.ilike.%${query}%`)
  ```

---

_Date: 2025-12-23_
_Author: User & Antigravity_
