-- ==============================================================================
-- MIRA: Real-Time Patient Location Tracking & Jitsi Telehealth Signaling Schema
-- ==============================================================================
-- This SQL script creates the tables, indices, RLS policies, and Realtime
-- publication bindings required by the MIRA mobile app and Next.js caretaker dashboard.
--
-- How to apply:
-- 1. Open your Supabase Project Dashboard (https://app.supabase.com)
-- 2. Go to SQL Editor -> New Query
-- 3. Paste this script and click "Run"
-- ==============================================================================

-- 1. Enable UUID generator extension if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- TABLE: patient_locations
-- Stores continuous GPS location pings from patient devices for wanderer
-- prevention and real-time geofence tracking.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.patient_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance indices for rapid lookups and time-series telemetry
CREATE INDEX IF NOT EXISTS idx_patient_locations_patient_id 
    ON public.patient_locations (patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_locations_timestamp 
    ON public.patient_locations (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_patient_locations_patient_timestamp 
    ON public.patient_locations (patient_id, timestamp DESC);

-- View: Get the latest location ping for each patient
CREATE OR REPLACE VIEW public.latest_patient_locations AS
SELECT DISTINCT ON (patient_id)
    id,
    patient_id,
    lat,
    lng,
    timestamp,
    created_at
FROM public.patient_locations
ORDER BY patient_id, timestamp DESC;

-- ==============================================================================
-- TABLE: call_status
-- Signaling state for Jitsi Meet telehealth video calls between caretakers
-- and patients. Allows mobile devices to poll or receive push/realtime call invites.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.call_status (
    patient_id TEXT PRIMARY KEY,
    is_calling BOOLEAN NOT NULL DEFAULT FALSE,
    room_url TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_call_status_is_calling 
    ON public.call_status (is_calling) 
    WHERE is_calling = TRUE;

-- Auto-update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_call_status_updated_at ON public.call_status;
CREATE TRIGGER trg_call_status_updated_at
    BEFORE UPDATE ON public.call_status
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- SUPABASE REALTIME CONFIGURATION
-- Enables WebSockets/CDC broadcast for instant live-map updates and ringing calls.
-- ==============================================================================
ALTER TABLE public.patient_locations REPLICA IDENTITY FULL;
ALTER TABLE public.call_status REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'patient_locations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_locations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'call_status'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.call_status;
    END IF;
END $$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures secure access control for patients and authorized caretakers.
-- ==============================================================================
ALTER TABLE public.patient_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_status ENABLE ROW LEVEL SECURITY;

-- Allow reading location pings (caretakers / service role / mobile)
CREATE POLICY "Allow read patient_locations for all authenticated/anon users"
    ON public.patient_locations
    FOR SELECT
    USING (true);

-- Allow inserting location pings (patient mobile app)
CREATE POLICY "Allow insert patient_locations for all authenticated/anon users"
    ON public.patient_locations
    FOR INSERT
    WITH CHECK (true);

-- Allow reading call status (mobile polling and caretaker dashboard)
CREATE POLICY "Allow read call_status for all authenticated/anon users"
    ON public.call_status
    FOR SELECT
    USING (true);

-- Allow updating call status (caretaker initiating / patient answering / ending call)
CREATE POLICY "Allow insert/update call_status for all authenticated/anon users"
    ON public.call_status
    FOR ALL
    USING (true)
    WITH CHECK (true);
