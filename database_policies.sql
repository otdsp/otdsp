-- =====================================================================
-- OTDSP DATABASE SCHEMA & SECURITY POLICIES (COMPLETELY CLEAN INITIAL SETUP)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DEFINIÇÕES DAS TABELAS (ORDEM CRONOLÓGICA DE DEPENDÊNCIAS)
-- ---------------------------------------------------------------------

-- Tabela: user_auth (Controle interno de acessos)
CREATE TABLE IF NOT EXISTS public.user_auth (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    date_joined TIMESTAMPTZ DEFAULT NOW(),
    cpf TEXT,
    phone TEXT
);

-- Tabela: user_profile (Informações de perfil cadastral)
CREATE TABLE IF NOT EXISTS public.user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    municipality TEXT,
    institution_organization TEXT,
    organization_type TEXT,
    job_title TEXT,
    relationship_with_otdsp TEXT,
    referral_source TEXT
);

-- Tabela: engagements (Iniciativas e Eventos Principais)
CREATE TABLE IF NOT EXISTS public.engagements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ,
    location TEXT,
    estimated_duration NUMERIC,
    status TEXT DEFAULT 'Planejado',
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: engagement_participants (Lista de Presença Segura e Privada)
CREATE TABLE IF NOT EXISTS public.engagement_participants (
    engagement_id UUID REFERENCES public.engagements(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (engagement_id, user_email)
);

-- Tabela: engagement_staff_notes (Anotações Confidenciais de Gestão)
CREATE TABLE IF NOT EXISTS public.engagement_staff_notes (
    engagement_id UUID PRIMARY KEY REFERENCES public.engagements(id) ON DELETE CASCADE,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2. CONFIGURAÇÃO DE SEGURANÇA (ATIVAÇÃO DO RLS)
-- ---------------------------------------------------------------------
ALTER TABLE public.user_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_staff_notes ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 3. FUNÇÕES UTILITÁRIAS E DE VALIDAÇÃO
-- ---------------------------------------------------------------------

-- Função para verificar se o usuário é Staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_auth 
    WHERE id = auth.uid() AND role = 'staff'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para travar alteração de Status (Apenas Staff)
CREATE OR REPLACE FUNCTION public.check_status_change()
RETURNS trigger AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.is_staff() THEN
        RAISE EXCEPTION 'Apenas membros da Staff podem alterar o status de um engajamento.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função LGPD: Permite que o usuário exclua permanentemente sua própria conta
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
BEGIN
  -- Exclui o usuário autenticado atual da tabela mestre auth.users
  -- O "ON DELETE CASCADE" cuidará de apagar o user_profile e user_auth
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 4. REGRAS DE CONTROLE DE ACESSO (POLÍTICAS RLS)
-- ---------------------------------------------------------------------

-- Limpeza de políticas antigas para evitar conflitos ao rodar novamente
DROP POLICY IF EXISTS "auth_select_policy" ON public.user_auth;
DROP POLICY IF EXISTS "profile_access_policy" ON public.user_profile;
DROP POLICY IF EXISTS "staff_notes_all_policy" ON public.engagement_staff_notes;
DROP POLICY IF EXISTS "eng_part_select_policy" ON public.engagement_participants;
DROP POLICY IF EXISTS "eng_part_insert_policy" ON public.engagement_participants;
DROP POLICY IF EXISTS "engagement_select_policy" ON public.engagements;
DROP POLICY IF EXISTS "engagement_insert_policy" ON public.engagements;
DROP POLICY IF EXISTS "engagement_update_policy" ON public.engagements;
DROP POLICY IF EXISTS "engagement_delete_policy" ON public.engagements;

-- Políticas para: user_auth
CREATE POLICY "auth_select_policy" ON public.user_auth
FOR SELECT TO authenticated 
USING (id = auth.uid() OR public.is_staff());

-- Políticas para: user_profile
CREATE POLICY "profile_access_policy" ON public.user_profile
FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_staff())
WITH CHECK (user_id = auth.uid() OR public.is_staff());

-- Políticas para: engagement_staff_notes (Confidencialidade Total)
CREATE POLICY "staff_notes_all_policy" ON public.engagement_staff_notes
FOR ALL TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- Políticas para: engagement_participants
CREATE POLICY "eng_part_select_policy" ON public.engagement_participants
FOR SELECT TO authenticated
USING ((auth.jwt() ->> 'email') = user_email OR public.is_staff());

CREATE POLICY "eng_part_insert_policy" ON public.engagement_participants
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.engagements 
        WHERE id = engagement_id 
        AND (created_by = auth.uid() OR public.is_staff())
    )
);

-- Políticas para: engagements (Controle Granular com Trava de Tempo)
CREATE POLICY "engagement_select_policy" ON public.engagements
FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.engagement_participants 
        WHERE engagement_id = id AND user_email = (auth.jwt() ->> 'email')
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
    public.is_staff()
    OR 
    (
        (
            created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.engagement_participants 
                WHERE engagement_id = id AND user_email = (auth.jwt() ->> 'email')
            )
        )
        AND 
        (
            event_date IS NULL 
            OR (event_date + (COALESCE(estimated_duration, 0) * interval '1 hour') >= NOW())
        )
    )
)
WITH CHECK (
    public.is_staff()
    OR 
    (
        (
            created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.engagement_participants 
                WHERE engagement_id = id AND user_email = (auth.jwt() ->> 'email')
            )
        )
        AND 
        (
            event_date IS NULL 
            OR (event_date + (COALESCE(estimated_duration, 0) * interval '1 hour') >= NOW())
        )
    )
);

CREATE POLICY "engagement_delete_policy" ON public.engagements
FOR DELETE TO authenticated
USING (public.is_staff());

-- ---------------------------------------------------------------------
-- 5. CONFIGURAÇÃO DOS GATILHOS (TRIGGERS)
-- ---------------------------------------------------------------------

-- Limpeza de Triggers para evitar duplicações
DROP TRIGGER IF EXISTS enforce_staff_status_update ON public.engagements;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger 1: Validação de Status em Engagements
CREATE TRIGGER enforce_staff_status_update
    BEFORE UPDATE ON public.engagements
    FOR EACH ROW EXECUTE FUNCTION public.check_status_change();

-- Função de automação para novos usuários do sistema (Cadastro público)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Criação controlada na user_auth (role sempre injetada como 'user' por segurança)
  INSERT INTO public.user_auth (id, email, role, is_active, cpf, phone)
  VALUES (
    new.id, 
    new.email, 
    'user', 
    TRUE,
    COALESCE(new.raw_user_meta_data->>'cpf', ''),
    COALESCE(new.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    cpf = EXCLUDED.cpf,
    phone = EXCLUDED.phone;

  -- Criação controlada do perfil com metadados do Next.js
  INSERT INTO public.user_profile (
    user_id,
    full_name,
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
    COALESCE(new.raw_user_meta_data->>'municipality', ''),
    COALESCE(new.raw_user_meta_data->>'institution_organization', ''),
    COALESCE(new.raw_user_meta_data->>'organization_type', ''),
    COALESCE(new.raw_user_meta_data->>'job_title', ''),
    COALESCE(new.raw_user_meta_data->>'relationship_with_otdsp', ''),
    COALESCE(new.raw_user_meta_data->>'referral_source', '')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    municipality = EXCLUDED.municipality,
    institution_organization = EXCLUDED.institution_organization,
    organization_type = EXCLUDED.organization_type,
    job_title = EXCLUDED.job_title,
    relationship_with_otdsp = EXCLUDED.relationship_with_otdsp,
    referral_source = EXCLUDED.referral_source;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger 2: Espelhamento automático de novos cadastros da auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();