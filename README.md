# CTF Writeup Platform

A modern, secure, and feature-rich platform for sharing and organizing Capture The Flag (CTF) writeups. Built with Next.js 15, Supabase, and TailwindCSS.

## 🚀 Development Roadmap & Features

### Phase 1: Core Architecture & Authentication (Completed)

- **Project Setup**: Implemented Next.js 15 App Router structure with TypeScript.
- **Authentication**: Integrated Supabase Auth (Email Magic Link) with GitHub-style profile management.
- **Security**: Applied Row Level Security (RLS) policies for secure data access.
- **Core Pages**:
  - Home Dashboard (Writeup Feed)
  - Post Detail View
  - Profile Page
  - Login/Auth Pages

### Phase 2: Content & Discovery (Completed)

- **Rich Text Editor**:
  - Integrated **Tiptap** editor for writing writeups.
  - Custom image upload extension handling Supabase Storage.
  - **Smart Syntax Highlighting**:
    - Powered by `highlight.js` (lowlight) with support for 35+ common languages.
    - **Language Selector**: UI toolbar dropdown to explicitly set code block language.
    - **Auto-detection**: Markdown shortcuts (e.g., \`\`\`py\`) automatically trigger the correct highlighting.
- **Search System**:
  - Dedicated Search Page with filtering by **Tags** and **CTF Name**.
  - Real-time "Live Search" dropdown in the navigation bar.
- **Comments**:
  - Threaded comment system for community interaction.
- **Home Page**:
  - Dynamic preview cards showing headers (H1-H3) and metadata.
  - "Private" post visibility masking.

### Phase 3: UI Enhancements (Completed)

- **Dark/Light Mode**:
  - Seamless theme switching (System/Light/Dark) using `next-themes`.
  - **Robust Theming**: Re-architected CSS with explicit variable overrides in `globals.css` to guarantee correct color application (e.g., specific Light/Dark mode code block colors).
- **Advanced Filtering**:
  - Added **Category** filtering (Web, Pwn, Rev, etc.) to the search system.
  - Updated DB queries for combined filter logic.

### Phase 4: UX Polish & Social Features (Completed)

- **Interactions**:
  - **Likes & Bookmarks** with optimistic UI updates.
  - Track user engagement on writeups.
- **Navigation**:
  - **Table of Contents (TOC)**: Auto-generated sidebar navigation for long writeups (Desktop).
  - Responsive layout adjustments.
- **Social Sharing**:
  - **Dynamic Open Graph (OG) Images**: Auto-generated social preview images via `@vercel/og`.
  - Displays title, category, and site branding on link sharing.
- **User Activity**:
  - **Contribution Graph**: GitHub-style heatmap on Profile page showing writeup activity over the last year.
- **Challenge Files**:
  - Dedicated UI for external challenge file links in Write/Edit/View pages.

### Phase 5: Verification & Refinement (Completed)

- **User Profile**:
  - **Nickname System**: Customizable nicknames with validation (alphanumeric + Korean support).
  - **Onboarding Flow**: Redirect new users to nickname setup page upon first login.
- **Content Management**:
  - **Secure Deletion**: RLS-enforced post deletion with double-check confirmation (`window.confirm`).
  - **Markdown Import**: Capability to import `.md` files directly into the editor (Title parsing + HTML conversion).
- **Security**:
  - **Strict RLS**: Profile updates and Post deletions are strictly scoped to `auth.uid()`.
  - **Safe Redirects**: Automatic handling of `localhost` vs Production URL for authentication redirects.

### Phase 6: Study Rooms & Community Layout (Current)

- **Study Rooms**:
  - Dedicated "Study Room" spaces for fields like Web, Pwn, Crypto.
  - Sidebar navigation for quick access to rooms.
  - **Tag-based Identification**: Automated `#Study` tag system allows flexible semester notation (e.g., "2026 1st Semester") while maintaining correct categorization.
- **Layout Overhaul**:
  - **Sidebar Navigation**: Fixed left-side navigation bar for better accessibility.
  - **Role Management**: 3-tier system (User/Manager/Admin) for community management. Admins can manage user roles via the Profile dashboard.
  - **Category Management**: Dynamic addition of new study fields by Managers/Admins directly from the sidebar.
  - **Enhanced Search**: Unified search functionality that simultaneously queries post titles and author names, powered by a custom SQL View.

## 🛠 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: TailwindCSS, `clsx`, `tailwind-merge`
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Editor**: [Tiptap](https://tiptap.dev/)
- **Icons**: Lucide React
- **Theme**: `next-themes`
- **Visualization**: `react-activity-calendar`

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## � License

This project is open source and available under the [MIT License](LICENSE).
