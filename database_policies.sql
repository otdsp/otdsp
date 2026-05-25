-- =====================================================================
-- OTDSP DATABASE SCHEMA & SECURITY POLICIES (PRISTINE INITIAL SETUP)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DEFINIÇÕES DAS TABELAS
-- ---------------------------------------------------------------------

-- Tabela: user_auth (Dados internos de controle de acesso)
CREATE TABLE public.user_auth (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    is_staff BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    date_joined TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: user_profile (Informações cadastrais e de perfil)
CREATE TABLE public.user_profile (
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

-- Tabela: engagements (Eventos e Engajamentos principais)
CREATE TABLE public.engagements (
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
    status TEXT DEFAULT 'planned',
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: engagement_participants (Tabela Intermediária / Relacionamento n:n)
CREATE TABLE public.engagement_participants (
    engagement_id UUID REFERENCES public.engagements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (engagement_id, user_id)
);

-- ---------------------------------------------------------------------
-- 2. CONFIGURAÇÃO DE SEGURANÇA (ATIVAÇÃO DO RLS)
-- ---------------------------------------------------------------------
ALTER TABLE public.user_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_participants ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 3. FUNÇÕES UTILITÁRIAS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_auth 
    WHERE id = auth.uid() AND is_staff = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 4. REGRAS DE CONTROLE DE ACESSO (POLÍTICAS RLS)
-- ---------------------------------------------------------------------

-- Políticas para: user_auth
CREATE POLICY "auth_select_policy" ON public.user_auth
FOR SELECT TO authenticated 
USING (id = auth.uid() OR public.is_staff());

-- Políticas para: user_profile
CREATE POLICY "profile_access_policy" ON public.user_profile
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_staff())
WITH CHECK (user_id = auth.uid() OR public.is_staff());

-- Políticas para: engagement_participants
CREATE POLICY "eng_part_select_policy" ON public.engagement_participants
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_staff());

-- Políticas para: engagements (Separação Granular de Privilégios)
CREATE POLICY "engagement_select_policy" ON public.engagements
FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.engagement_participants 
        WHERE engagement_id = id AND user_id = auth.uid()
    )
    OR created_by = auth.uid()
    OR public.is_staff()
);

CREATE POLICY "engagement_insert_policy" ON public.engagements
FOR INSERT TO authenticated
WITH CHECK (
    created_by = auth.uid() OR public.is_staff()
);

CREATE POLICY "engagement_update_policy" ON public.engagements
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.engagement_participants 
        WHERE engagement_id = id AND user_id = auth.uid()
    )
    OR created_by = auth.uid()
    OR public.is_staff()
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.engagement_participants 
        WHERE engagement_id = id AND user_id = auth.uid()
    )
    OR created_by = auth.uid()
    OR public.is_staff()
);

CREATE POLICY "engagement_delete_policy" ON public.engagements
FOR DELETE TO authenticated
USING (public.is_staff());

-- ---------------------------------------------------------------------
-- 5. AUTOMAÇÃO DE CRIAÇÃO DE PERFIL (TRIGGER SERVER-SIDE)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Criação automática do registro de autenticação (is_staff sempre falso no cadastro público)
  INSERT INTO public.user_auth (id, email, is_staff, is_active)
  VALUES (
    new.id, 
    new.email, 
    FALSE, 
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;

  -- Criação automática do perfil puxando os metadados enviados no cadastro do Next.js
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

-- Vinculando o Trigger à tabela nativa auth.users do Supabase
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();