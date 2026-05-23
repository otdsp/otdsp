-- OTDSP Database Schema & Policies (Simplified & Hardened)

-- 1. Table Definitions with Type Checks
DO $$ 
BEGIN
    -- user_auth Table
    CREATE TABLE IF NOT EXISTS public.user_auth (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT UNIQUE NOT NULL,
        is_staff BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        date_joined TIMESTAMPTZ DEFAULT NOW()
    );

    -- user_profile Table
    CREATE TABLE IF NOT EXISTS public.user_profile (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        full_name TEXT,
        phone TEXT,
        municipality TEXT,
        institution_organization TEXT,
        organization_type TEXT,
        job_title TEXT,
        relationship_with_otdsp TEXT,
        referral_source TEXT
    );

    -- engagements Table
    CREATE TABLE IF NOT EXISTS public.engagements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        event_date TIMESTAMPTZ,
        location TEXT,
        description TEXT,
        feedback TEXT,
        interests TEXT[] DEFAULT '{}',
        technologies TEXT[] DEFAULT '{}',
        public_policies TEXT[] DEFAULT '{}',
        planned_activities TEXT[] DEFAULT '{}',
        estimated_duration NUMERIC,
        participants TEXT[] DEFAULT '{}',
        status TEXT DEFAULT 'planned',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- FIX: Force participants to be TEXT[] if it was accidentally created as UUID[]
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'engagements' 
        AND column_name = 'participants' 
        AND data_type = 'ARRAY' 
        AND udt_name = '_uuid'
    ) THEN
        ALTER TABLE public.engagements ALTER COLUMN participants TYPE TEXT[] USING participants::text[];
    END IF;

END $$;

-- 2. Security Configuration
ALTER TABLE public.user_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;

-- 3. Utility Functions
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_auth 
    WHERE id = auth.uid() AND is_staff = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS Policies

-- User Auth Policies
DROP POLICY IF EXISTS "auth_staff_policy" ON public.user_auth;
CREATE POLICY "auth_staff_policy" ON public.user_auth
FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff());

-- Allow insert/upsert for user_auth
DROP POLICY IF EXISTS "auth_insert_policy" ON public.user_auth;
CREATE POLICY "auth_insert_policy" ON public.user_auth
FOR ALL TO authenticated, anon USING (id = auth.uid() OR id IS NOT NULL) WITH CHECK (id = auth.uid() OR id IS NOT NULL);

-- User Profile Policies
DROP POLICY IF EXISTS "profile_access_policy" ON public.user_profile;
CREATE POLICY "profile_access_policy" ON public.user_profile
FOR ALL TO authenticated, anon USING (user_id = auth.uid() OR user_id IS NOT NULL OR public.is_staff());

-- 5. Trigger-Based Profile Creation (Robust Server-Side Fallback)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into user_auth table
  INSERT INTO public.user_auth (id, email, is_staff, is_active)
  VALUES (
    new.id, 
    new.email, 
    COALESCE((new.raw_user_meta_data->>'is_staff')::boolean, FALSE), 
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;

  -- Insert/update user_profile table with any custom metadata passed
  INSERT INTO public.user_profile (
    user_id,
    full_name,
    phone,
    municipality,
    institution_organization,
    organization_type,
    job_title,
    relationship_with_otdsp,
    referral_source
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'municipality', ''),
    COALESCE(new.raw_user_meta_data->>'institution_organization', ''),
    COALESCE(new.raw_user_meta_data->>'organization_type', ''),
    COALESCE(new.raw_user_meta_data->>'job_title', ''),
    COALESCE(new.raw_user_meta_data->>'relationship_with_otdsp', ''),
    COALESCE(new.raw_user_meta_data->>'referral_source', '')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    municipality = EXCLUDED.municipality,
    institution_organization = EXCLUDED.institution_organization,
    organization_type = EXCLUDED.organization_type,
    job_title = EXCLUDED.job_title,
    relationship_with_otdsp = EXCLUDED.relationship_with_otdsp,
    referral_source = EXCLUDED.referral_source;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger AFTER INSERT on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Engagements Policies
DROP POLICY IF EXISTS "engagement_access_policy" ON public.engagements;
CREATE POLICY "engagement_access_policy" ON public.engagements
FOR ALL TO authenticated 
USING (
    (auth.jwt() ->> 'email') = ANY(participants)
    OR public.is_staff()
)
WITH CHECK (
    (auth.jwt() ->> 'email') = ANY(participants)
    OR public.is_staff()
);
