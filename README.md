# 🚀 Momentum — TEDxAkure 2026 Event OS

> **The Ultimate Conference Companion OS** built for attendees, speakers, and organizers at TEDxAkure 2026. Designed with an editorial OLED dark canvas, tangerine accents, 50-connection milestone tracking, Gemini AI contextual synthesis, multimodal moment captures, follow-up matrix, and cloud persistence with Supabase.

---

## 🌟 Features

- 🎯 **50-Connection Milestone Engine**: Dynamic SVG progress ring, velocity tracking, and celebratory particle milestones.
- 📇 **Smart Connections Directory**: Instant contact management with relation tagging (`speaker`, `mentor`, `lead`, `peer`), priority tiering, and direct 1-tap WhatsApp/Email/LinkedIn integrations.
- 🤖 **Gemini AI Synthesis**: Contextual AI generation for follow-up outreach messages, connection memory point extraction, and daily conference recaps with multi-model resilience.
- 📸 **Multimodal Moments Hub**: Live camera & file upload capture, tagged attendee associations, and chronological timeline.
- 💡 **Keynotes & Ideas Vault**: Session takeaway capture mapped to speakers, stages, and categories.
- ⚡ **Follow-Up Matrix**: Interactive status pipeline tracking overdue, due today, and scheduled follow-ups.
- ☁️ **Supabase Cloud Sync & Offline-First**: Instant local state with seamless cloud persistence to Supabase.
- 📄 **Export Suite**: 1-click PDF executive briefing, full data JSON/CSV exports, and customizable 9:16 / 1:1 conference photo collage generator.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (`motion/react`), Recharts, Lucide Icons
- **Backend / API**: Express 4, Google Gen AI SDK (`@google/genai`), Supabase JS Client (`@supabase/supabase-js`)
- **Build Tool**: Vite 6, esbuild, TSX
- **Deployment Targets**: Netlify, GitHub, Cloud Run, Supabase

---

## 📋 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/momentum-tedxakure-2026.git
cd momentum-tedxakure-2026
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your API keys in `.env`:
```env
GEMINI_API_KEY="your-google-gemini-api-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐙 Step 1: Pushing to GitHub

1. **Initialize Git repository**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of Momentum TEDxAkure 2026 Event OS"
   ```

2. **Create a new repository on [GitHub](https://github.com/new)** (e.g. `momentum-tedxakure-2026`).

3. **Set main branch and push**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/your-username/momentum-tedxakure-2026.git
   git push -u origin main
   ```

---

## ⚡ Step 2: Connecting to Supabase (Production Setup)

Follow these exact steps to connect your cloud PostgreSQL database on Supabase:

### 1. Create a Supabase Project
1. Log in to [Supabase](https://app.supabase.com) and click **"New Project"**.
2. Set your **Project Name** (e.g. `momentum-tedxakure-2026`) and database password.
3. Choose your closest region (e.g., `West Europe` or `US East`).

### 2. Execute the Database Schema & RLS Policies
Navigate to the **SQL Editor** in the Supabase Dashboard, create a new query, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**.

```sql
-- 1. CONNECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.connections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    profession TEXT,
    company TEXT,
    avatar_url TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    linkedin TEXT,
    instagram TEXT,
    twitter TEXT,
    notes TEXT DEFAULT '',
    relationship TEXT NOT NULL DEFAULT 'peer' CHECK (relationship IN ('peer', 'mentor', 'lead', 'speaker')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    follow_up_date TEXT NOT NULL,
    follow_up_status TEXT NOT NULL DEFAULT 'upcoming' CHECK (follow_up_status IN ('today', 'upcoming', 'overdue', 'completed')),
    met_timestamp TEXT NOT NULL,
    event_context TEXT DEFAULT 'TEDxAkure 2026 Main Stage',
    conversation_memory JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    related_moment_ids JSONB DEFAULT '[]'::jsonb,
    last_follow_up_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. MOMENTS TABLE
CREATE TABLE IF NOT EXISTS public.moments (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'photo' CHECK (type IN ('photo', 'video', 'note')),
    title TEXT NOT NULL,
    caption TEXT DEFAULT '',
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    timestamp TEXT NOT NULL,
    date TEXT NOT NULL,
    tagged_people_ids JSONB DEFAULT '[]'::jsonb,
    tagged_people_names JSONB DEFAULT '[]'::jsonb,
    location TEXT DEFAULT 'Main Hall',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. IDEAS TABLE
CREATE TABLE IF NOT EXISTS public.ideas (
    id TEXT PRIMARY KEY,
    quote TEXT NOT NULL,
    takeaway TEXT,
    speaker_name TEXT NOT NULL,
    speaker_role TEXT,
    speaker_avatar TEXT,
    session_title TEXT NOT NULL,
    stage_name TEXT DEFAULT 'Main Auditorium',
    time_str TEXT NOT NULL,
    category TEXT NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on connections" ON public.connections FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on connections" ON public.connections FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on moments" ON public.moments FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on moments" ON public.moments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on ideas" ON public.ideas FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on ideas" ON public.ideas FOR ALL USING (true) WITH CHECK (true);
```

### 3. Configure API Credentials
In Supabase, navigate to **Project Settings ➔ API**:
1. Copy **Project URL** (e.g. `https://xyzproject.supabase.co`).
2. Copy **Project API Keys ➔ `anon` `public`**.
3. Add these to your `.env` (local) and Netlify/Cloud Run environment variables:
   ```env
   VITE_SUPABASE_URL=https://xyzproject.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

---

## 📱 Progressive Web App (PWA) & Offline Capabilities

Momentum is configured with `vite-plugin-pwa` for high-performance offline conference usage:
- **Service Worker Auto-Update**: Caches app bundle, fonts, and assets automatically.
- **Offline First Architecture**: When offline, data operations persist locally to `localStorage` and automatically sync to Supabase when reconnected.
- **Home Screen Install**: Can be installed as a native app on iOS Safari ("Add to Home Screen") and Android Chrome ("Install App").
- **Offline Assets**: All Google Fonts, Material Symbols, and icons are cached via Workbox `CacheFirst` strategies.

---

## 🔒 Security Audit & Production Hardening

- **API Secret Isolation**: `GEMINI_API_KEY` is strictly managed server-side (`server.ts`) and never exposed to client-side bundles.
- **Safe Supabase Client**: `src/services/supabaseClient.ts` validates credentials before instantiation, preventing runtime crashes.
- **Sanitized Exports**: PDF, CSV, and JSON data exports encode data without executing scripts or injecting raw HTML.
- **Strict Headers**: `netlify.toml` enforces `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 🌐 Step 3: Deploying to Netlify

This repository includes pre-configured [`netlify.toml`](./netlify.toml) and [`public/_redirects`](./public/_redirects).

### Method A: Deploy via Netlify Dashboard (Recommended)
1. Log in to **[Netlify](https://app.netlify.com)**.
2. Click **Add new site** ➔ **Import an existing project**.
3. Select **GitHub** and authorize access to your `momentum-tedxakure-2026` repository.
4. Netlify will automatically detect the build settings from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Environment variables** and add:
   - `GEMINI_API_KEY`: `your-google-gemini-api-key`
   - `VITE_SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your-supabase-anon-key`
6. Click **Deploy Site**!

### Method B: Deploy via Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

---

## 📁 Project Structure

```
├── netlify.toml                # Netlify deployment & SPA redirect configuration
├── package.json                # Dependencies & build scripts
├── public/
│   └── _redirects              # Netlify client-side routing fallback
├── src/
│   ├── components/             # UI Views & Modals (Dashboard, People, Moments, Ideas, etc.)
│   ├── data/                   # Initial conference data (mockData.ts)
│   ├── services/               # API, Supabase, and Storage Services
│   │   ├── aiService.ts        # Gemini AI generation & resilient fallbacks
│   │   ├── exportService.ts    # PDF, CSV, JSON, and ZIP exporters
│   │   ├── storage.ts          # Local storage persistence
│   │   ├── supabaseClient.ts   # Safe Supabase client initialization
│   │   └── supabaseSync.ts     # Cloud data synchronization
│   ├── types.ts                # TypeScript domain models
│   ├── App.tsx                 # Root application container
│   ├── index.css               # Tailwind CSS theme styling
│   └── main.tsx                # React entrypoint
├── supabase/
│   └── schema.sql              # Supabase PostgreSQL schema with RLS policies
├── server.ts                   # Express server & Gemini API proxy
└── vite.config.ts              # Vite configuration
```

---

## 📄 License

MIT License © 2026 Momentum — TEDxAkure 2026 Event OS
