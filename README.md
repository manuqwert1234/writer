
# Writer

Writer is a minimal, ambient writing space with **AI autocomplete**, **real‑time sync**, and **lo‑fi background music**. It’s designed to feel like a focused studio for long-form writing.

## ✨ Features

- **AI Ghost Autocomplete**
  - Tab-completion ghost text (like GitHub Copilot, but for prose)
  - 1,000‑character context window for paragraph‑aware suggestions
  - 2‑layer speed system:
    - Layer 1: IndexedDB cache (~10ms)
    - Layer 2: Groq Llama 3.1 8B Instant (~300–500ms)
  - Smart debouncing (500ms), request aborts, and 2.5s timeout
  - Auto spacing so accepted text doesn’t stick to previous words

- **Rich Text Editor**
  - Built with Tiptap (ProseMirror)
  - Headings (H1–H3), bold, italic, strike
  - Bullet and numbered lists
  - Blockquotes and code blocks
  - Sticky formatting toolbar, scrollable on small screens

- **Export Tools**
  - **Export to PDF** – nicely styled, print‑ready document
  - **Export to Markdown** – for GitHub, Notion, etc.

- **Realtime Documents (Firebase + Firestore)**
  - Per‑user documents with auth‑protected access
  - Debounced autosave (1s) with “Saving… / Saved” indicator
  - Permission‑aware error state:
    - If a doc belongs to another account, you get a friendly message
    - One‑click “Create a new doc and continue” that spins up a new doc

- **Ambient Lo‑Fi Music**
  - Jamendo API for free, licensed music
  - Genre picker (Lo‑Fi Ambient, Chill, Jazz, Classical, Focus, etc.)
  - Playlist dropdown with now‑playing indicator
  - Smooth, legal background music while you write

- **Dynamic Vibe Background**
  - Extracts colors from the current track’s album art
  - Animated gradient with floating blobs + grain texture
  - Palette blending to avoid harsh flashes when tracks change

- **Focus‑Friendly UI**
  - Global fade of UI chrome when typing
  - Minimal header: hamburger + “Writer” + music selector
  - Responsive layout tuned for mobile and desktop

## 🧱 Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind 4
- **Editor:** Tiptap (ProseMirror)
- **AI:** Groq SDK (Llama 3.1 8B Instant)
- **Auth + DB:** Firebase Authentication & Firestore
- **State:** Zustand
- **Caching:** IndexedDB via `idb-keyval`
- **PWA:** `@ducanh2912/next-pwa`
- **Deployment:** Vercel

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/writer.git
cd writer
npm install
```

### 2. Environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

GROQ_API_KEY=your-groq-api-key
```

- Firebase values come from **Project Settings → General**.
- `GROQ_API_KEY` comes from the [Groq console](https://console.groq.com).

### 3. Run the dev server

```bash
npm run dev
```

Open `http://127.0.0.1:3000` in your browser.

## 🧠 How AI Autocomplete Works

1. Every keystroke resets a 500ms debounce timer.
2. When the user pauses:
   - We grab the last 1,000 characters before the cursor.
   - If context is short or unchanged, we skip the call.
3. We first check a **local IndexedDB cache**.
4. On a miss, we call the **Groq** `/api/autocomplete` route (Edge runtime).
5. Responses are cached, displayed as ghost text, and can be accepted with **Tab**.

This keeps suggestions feeling instant while staying efficient on API usage.

## 📦 Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # start production server
npm run lint     # run ESLint
```

## 📝 License

This project is for personal / portfolio use. If you want to use parts of it in production, make sure to:

- Respect Jamendo’s and Groq’s terms of service.
- Configure your own Firebase project and security rules appropriately.
```

You can tweak the wording (e.g. add your name, credit, or screenshots) before committing it to your repo.
