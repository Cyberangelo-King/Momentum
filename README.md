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

-- 4. ROW LEVEL SECURITY (RLS) POLICIES (HARDENED SINGLE-OWNER ACCESS)
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Deny public/anon access: only authenticated sessions have full access
CREATE POLICY "Owner authenticated access on connections" ON public.connections FOR ALL TO authenticated USING ((auth.role() = 'authenticated')) WITH CHECK ((auth.role() = 'authenticated'));
CREATE POLICY "Owner authenticated access on moments" ON public.moments FOR ALL TO authenticated USING ((auth.role() = 'authenticated')) WITH CHECK ((auth.role() = 'authenticated'));
CREATE POLICY "Owner authenticated access on ideas" ON public.ideas FOR ALL TO authenticated USING ((auth.role() = 'authenticated')) WITH CHECK ((auth.role() = 'authenticated'));
CREATE POLICY "Owner authenticated access on event_sessions" ON public.event_sessions FOR ALL TO authenticated USING ((auth.role() = 'authenticated')) WITH CHECK ((auth.role() = 'authenticated'));
CREATE POLICY "Owner authenticated access on profiles" ON public.profiles FOR ALL TO authenticated USING ((auth.role() = 'authenticated')) WITH CHECK ((auth.role() = 'authenticated'));
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

## 📱 Progressive Web App (PWA) & Native Installation

Momentum is configured with `vite-plugin-pwa` for high-performance offline conference usage and native-like installation on Android & iOS:

### 1. Static Icon Assets Location
The static icons are placed in the `/public` directory and automatically bundled into the root of `dist/` on build:
- `/public/pwa-192x192.svg`: Standard 192x192 app icon for Android home screen and app drawers.
- `/public/pwa-512x512.svg`: High-resolution 512x512 maskable & splash icon for Android and splash screens.
- `/public/apple-touch-icon.svg`: High-contrast icon for iOS Safari home screen bookmarks.
- `/public/favicon.svg`: Browser tab icon with TEDx theme.

### 2. PWA Configuration in `vite.config.ts`
The manifest and asset caching rules are configured in `vite.config.ts`:
```ts
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.svg', 'apple-touch-icon.svg', 'pwa-192x192.svg', 'pwa-512x512.svg', 'robots.txt'],
  manifest: {
    name: 'Momentum — TEDxAkure 2026 Event OS',
    short_name: 'Momentum',
    description: 'A mobile-first personal event OS for TEDxAkure 2026 to meet 50 connections, capture moments & ideas, track follow-ups, and synthesize your journey.',
    theme_color: '#0A0A0A',
    background_color: '#0A0A0A',
    display: 'standalone',
    orientation: 'portrait-primary',
    icons: [
      { src: '/pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
      { src: '/pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
      { src: '/pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' }
    ]
  }
})
```

### 3. How to Install Natively
- **iOS Safari**: Tap the **Share** button at the bottom of Safari ➔ Scroll down and tap **"Add to Home Screen"** ➔ Tap **Add**.
- **Android Chrome**: Tap the three-dot menu ➔ Tap **"Install app"** (or **"Add to Home screen"**).
- **Desktop Chrome / Edge**: Click the **Install** icon in the URL address bar.

---

## 🔄 Offline-to-Online Sync Manager (`syncManager.ts`)

Momentum features an automated **Sync Manager** (`src/services/syncManager.ts`) that guarantees zero data loss in low-connectivity conference venues:

### 1. Network Status Monitoring
The service listens to standard browser events:
- `window.addEventListener('online', handleOnline)`
- `window.addEventListener('offline', handleOffline)`

### 2. Offline Action Queue & Zero Duplicate Cloud Push
- When offline, any created connection, captured photo moment, or recorded talk insight is saved to `localStorage` and added to an offline queue (`momentum_offline_queue_v1`).
- When a transition from **offline to online** is detected (or when the user clicks **"Sync Now"**), the `syncManager` automatically iterates through the queued items and performs an asynchronous batch upsert to Supabase PostgreSQL.
- **Duplicate Prevention**: All records use deterministic IDs and PostgreSQL `ON CONFLICT (id) DO UPDATE`, guaranteeing that syncing offline-created records never produces duplicate entries.

### 3. Live Sync Status Badge
Located in the navigation bar:
- 🟢 **Cloud Synced**: All local records are in sync with Supabase.
- 🟡 **Syncing (X queued)**: Pushing offline changes to the cloud.
- 🔴 **Offline (Local)**: No network connection; all changes saved with zero latency locally.

---

## 🔒 Owner Authentication & Privacy Lock (Angelo)

To keep private networking notes, follow-up messages, and contact details confidential:

- **Verified Owner**: **Angelo** (`faithakinboyejo@gmail.com`).
- **Passcode Protection**: Configured with a 4-digit PIN (Default: `2026`).
- **Owner Override**: You can always unlock the workspace by entering your email `faithakinboyejo@gmail.com` or your custom PIN.
- **1-Tap Quick Lock**: Click the lock icon in the navigation bar (or press `Ctrl/Cmd + L`) to lock the workspace with an OLED privacy overlay.

---

## 🗑️ Clean Slate & Demo Data Management

To start completely fresh for the live TEDxAkure 2026 conference:
1. Open **More ➔ Demo Data & Clean Slate** (or click the trash icon in the desktop drawer).
2. **Move to Trash**: Hides sample mock data so only people and moments you personally capture are displayed.
3. **Permanently Delete Demo Data**: Wipes all demo records completely from both local and cloud databases.
4. **Restore Demo Data**: Available if you ever want to re-populate the sample data for testing.

---

## 📱 Angelo's TEDxAkure 2026 Portfolio QR Code Showcase

During networking sessions at TEDxAkure 2026, you can instantly share your portfolio with attendees and speakers:
- **Portfolio Link**: [`https://angelo-tedxakure-portfolio.netlify.app`](https://angelo-tedxakure-portfolio.netlify.app)
- **Interactive QR Modal**: Click the **"Angelo's QR"** button in the navigation header or press `Ctrl/Cmd + P`.
- **Attendee Scanning**: Displays a crisp, high-contrast QR code formatted specifically for camera scanning from your mobile screen.
- **Quick Actions**: Includes **Copy Link**, **Open in New Tab**, and **Download QR Card** buttons.

---

## 🔒 Security Audit & Production Hardening

- **API Secret Isolation**: `GEMINI_API_KEY` is strictly managed server-side (`server.ts`) and never exposed to client-side bundles.
- **Safe Supabase Client**: `src/services/supabaseClient.ts` validates credentials before instantiation, preventing runtime crashes.
- **Sanitized Exports**: PDF, CSV, and JSON data exports encode data without executing scripts or injecting raw HTML.
- **Strict Headers**: `netlify.toml` enforces `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.


---

## 🌐 Step 3: Deploying to Netlify & Environment Configuration

This repository includes a production-ready [`netlify.toml`](./netlify.toml) and [`public/_redirects`](./public/_redirects) configured for Single-Page Application (SPA) routing, asset caching, and security headers.

### 1. SPA Routing & 404 Prevention
Netlify serves single-page React apps by rewriting all incoming routes (e.g. `/moments`, `/people`, `/ideas`) to `/index.html` with an HTTP `200` status code. This is configured in `netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = false
```

### 2. Required Netlify Environment Variables

To ensure all cloud syncing and Gemini AI features work properly on Netlify, configure these environment variables in your Netlify dashboard:

| Variable Name | Description | Example / Source |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini AI Key for connection notes and outreach synthesis | Obtain from [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `VITE_SUPABASE_URL` | Your Supabase PostgreSQL Project URL | `https://gdcpioggwhfuhrufxuck.supabase.co` (Supabase Project Settings ➔ API) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase `anon` `public` API Key | `eyJhbGciOi...` (Supabase Project Settings ➔ API) |
| `APP_URL` | The public production URL of your deployed site | `https://your-site-name.netlify.app` |

### 3. How to Set Environment Variables in Netlify
1. Log in to **[Netlify](https://app.netlify.com)**.
2. Select your site ➔ Go to **Site configuration** (or **Site settings**) in the left sidebar.
3. Click on **Environment variables**.
4. Click **"Add a variable"** (or **"Import from .env"**), and add the 4 variables listed above.
5. Trigger a new deploy under **Deploys ➔ Trigger deploy ➔ Clear cache and deploy site** so the variables are injected at build time.

### 4. Deploy Methods

#### Method A: Deploy via Netlify Dashboard (Recommended)
1. Click **Add new site** ➔ **Import an existing project**.
2. Select **GitHub** and authorize access to your `momentum-tedxakure-2026` repository.
3. Netlify will automatically detect the build settings from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add the environment variables from the table above.
5. Click **Deploy Site**!

#### Method B: Deploy via Netlify CLI
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login to your Netlify account
netlify login

# 3. Link or initialize your project
netlify init

# 4. Set environment variables via CLI (optional)
netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key"
netlify env:set GEMINI_API_KEY "your-gemini-key"

# 5. Build and deploy to production
netlify deploy --prod --build
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
