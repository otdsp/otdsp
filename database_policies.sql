-- SQL Script for OTDSP Database Tables and RLS Policies

-- 1. Create Tables (if they don't exist)
-- Note: Assuming auth.users is already managed by Supabase Auth.

CREATE TABLE IF NOT EXISTS public.user_auth (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    is_staff BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    date_joined TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    home_address TEXT,
    work_address TEXT,
    institution_organization TEXT,
    organization_type TEXT,
    job_title TEXT,
    relationship_with_otdsp TEXT
);

CREATE TABLE IF NOT EXISTS public.engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date TIMESTAMPTZ,
    location TEXT,
    type TEXT,
    description TEXT,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    interests TEXT[] DEFAULT '{}',
    technologies TEXT[] DEFAULT '{}',
    public_policies TEXT[] DEFAULT '{}',
    planned_activities TEXT[] DEFAULT '{}',
    estimated_duration NUMERIC,
    participants TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'planned'
);

-- 2. Enable Row Level Security
ALTER TABLE public.user_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;

-- 3. Utility Function to check if user is staff
-- This avoids recursion in policies
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_staff 
    FROM public.user_auth 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS Policies for user_auth
CREATE POLICY "Select User Auth: Own or Staff"
ON public.user_auth FOR SELECT
TO authenticated
USING (
    auth.uid() = id 
    OR public.is_staff() = true
);

-- 5. RLS Policies for user_profile
CREATE POLICY "Select User Profile: Own or Staff"
ON public.user_profile FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id 
    OR public.is_staff() = true
);

CREATE POLICY "Update User Profile: Own or Staff"
ON public.user_profile FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id 
    OR public.is_staff() = true
)
WITH CHECK (
    auth.uid() = user_id 
    OR public.is_staff() = true
);

-- 6. RLS Policies for engagements
CREATE POLICY "Select Engagements: Authenticated"
ON public.engagements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Manage Engagements: Staff Only"
ON public.engagements FOR ALL
TO authenticated
USING (public.is_staff() = true)
WITH CHECK (public.is_staff() = true);
