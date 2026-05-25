'use server'

import { supabase } from '@/lib/supabase'

export async function addParticipantsToEngagement(engagementId: string, emails: string[]) {
  if (!engagementId || emails.length === 0) return { success: true }

  // Prepara as linhas para inserção direta baseada em e-mail
  const participantsData = emails.map(email => ({
    engagement_id: engagementId,
    user_email: email.trim().toLowerCase()
  }))

  // O próprio RLS do banco vai checar: "Esse usuário logado é o criador desse engagementId?"
  // Se for, ele deixa salvar. Se for um hacker tentando injetar e-mail em evento alheio, o banco bloqueia!
  const { error } = await supabase
    .from('engagement_participants')
    .insert(participantsData)

  if (error) {
    console.error("Erro de segurança ou validação no Supabase:", error.message)
    throw new Error("Não foi possível adicionar os participantes. Verifique suas permissões.")
  }

  return { success: true }
}