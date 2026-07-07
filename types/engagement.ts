export type ParticipantStatus = 'green' | 'yellow' | 'red'

export interface Participant {
  user_id?: string | null // null caso seja um participante "Vermelho" (não cadastrado)
  full_name: string
  email: string
  cpf: string
  status: ParticipantStatus
}

// Adaptação da sua interface original
export interface Engagement {
  id: string
  title: string
  description: string
  event_date: string
  location: string
  status: string
  horizontal: string[]
  vertical: string[]
  transversal: string[]
  planned_activities: string[]
  estimated_duration: number
  created_by: string
  engagement_participants?: { user_id: string, user_profile?: any }[]
  engagement_staff_notes?: { notes: string } | null
}