-- ==============================================================================
-- Momentum OS (TEDxAkure 2026) - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor (https://app.supabase.com)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- 4. EVENT SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.event_sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    speaker TEXT NOT NULL,
    speaker_role TEXT,
    time_str TEXT NOT NULL,
    stage TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('live', 'upcoming', 'completed')),
    description TEXT DEFAULT '',
    hero_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. USER PROFILE TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY DEFAULT 'current_user',
    name TEXT NOT NULL,
    title TEXT,
    avatar_url TEXT,
    target_connections INTEGER DEFAULT 50,
    conference_name TEXT DEFAULT 'TEDxAkure 2026',
    conference_year TEXT DEFAULT '2026',
    location TEXT DEFAULT 'Akure, Nigeria',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- Indexes for High Performance Queries
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_connections_priority ON public.connections(priority);
CREATE INDEX IF NOT EXISTS idx_connections_followup ON public.connections(follow_up_status);
CREATE INDEX IF NOT EXISTS idx_moments_date ON public.moments(date);
CREATE INDEX IF NOT EXISTS idx_ideas_category ON public.ideas(category);

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- Hardened Single-Owner Access Control:
-- ONLY authenticated Supabase sessions (auth.role() = 'authenticated') 
-- are granted SELECT, INSERT, UPDATE, and DELETE operations.
-- Anonymous / unauthenticated requests (anon key without active login) 
-- are strictly denied by RLS.
-- ------------------------------------------------------------------------------

-- 1. Enable RLS on all private tables
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop any legacy public policies
DROP POLICY IF EXISTS "Allow public read access on connections" ON public.connections;
DROP POLICY IF EXISTS "Allow public insert/update on connections" ON public.connections;
DROP POLICY IF EXISTS "Allow public read access on moments" ON public.moments;
DROP POLICY IF EXISTS "Allow public insert/update on moments" ON public.moments;
DROP POLICY IF EXISTS "Allow public read access on ideas" ON public.ideas;
DROP POLICY IF EXISTS "Allow public insert/update on ideas" ON public.ideas;
DROP POLICY IF EXISTS "Allow public read access on event_sessions" ON public.event_sessions;
DROP POLICY IF EXISTS "Allow public insert/update on event_sessions" ON public.event_sessions;
DROP POLICY IF EXISTS "Allow public read access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert/update on profiles" ON public.profiles;

-- 3. Hardened Owner-Authenticated Policies for CONNECTIONS
CREATE POLICY "Owner authenticated access on connections" 
ON public.connections 
FOR ALL 
TO authenticated 
USING ((auth.role() = 'authenticated'))
WITH CHECK ((auth.role() = 'authenticated'));

-- 4. Hardened Owner-Authenticated Policies for MOMENTS
CREATE POLICY "Owner authenticated access on moments" 
ON public.moments 
FOR ALL 
TO authenticated 
USING ((auth.role() = 'authenticated'))
WITH CHECK ((auth.role() = 'authenticated'));

-- 5. Hardened Owner-Authenticated Policies for IDEAS
CREATE POLICY "Owner authenticated access on ideas" 
ON public.ideas 
FOR ALL 
TO authenticated 
USING ((auth.role() = 'authenticated'))
WITH CHECK ((auth.role() = 'authenticated'));

-- 6. Hardened Owner-Authenticated Policies for EVENT_SESSIONS
CREATE POLICY "Owner authenticated access on event_sessions" 
ON public.event_sessions 
FOR ALL 
TO authenticated 
USING ((auth.role() = 'authenticated'))
WITH CHECK ((auth.role() = 'authenticated'));

-- 7. Hardened Owner-Authenticated Policies for PROFILES
CREATE POLICY "Owner authenticated access on profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING ((auth.role() = 'authenticated'))
WITH CHECK ((auth.role() = 'authenticated'));

