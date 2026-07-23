'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Calendar, 
  Plus, 
  Search, 
  MapPin, 
  CheckCircle, 
  Activity, 
  Loader2, 
  Target,
  X,
  Users,
  Briefcase,
  Monitor,
  Heart,
  Trash2,
  Lock,
  Filter,
  Layers3,
  Rows3,
  Waypoints,
  LayoutGrid,
  Table2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { MultiSelectFilter } from '@/components/MultiSelectFilter'
import { ParticipantManager } from '@/components/ParticipantManager'
import { Engagement, Participant } from '@/types/engagement'

const INTEREST_OPTIONS = ["Educação", "Saúde", "Segurança", "Meio Ambiente", "Infraestutura de TI"]
const TECH_OPTIONS = ["5G", "IA", "Open hardware", "Open Semi Condoctors", "Computação Quântica", "Internet das coisas (IoT)"]
const POLICY_OPTIONS = ["Igualdade de gênero", "Igualdade racial", "Acessibilidade"]
const ACTIVITY_OPTIONS = ["Pitch Inicial", "Visita ao Showroom", "Apresentação Institucional", "Reunião de Plano de Trabalho", "Reunião de Adesão ao Convênio"]
const LOCATION_OPTIONS = ["Remoto", "Inova USP"]

type ParticipantVisualStatus = 'green' | 'yellow' | 'red'

type ParticipantProfileData = {
  id: string
  full_name: string | null
  institution_organization: string | null
  organization_type: string | null
  job_title: string | null
  relationship_with_otdsp: string | null
  municipality: string | null
  referral_source: string | null
}

type ParticipantAuthData = {
  id: string
  email: string | null
  cpf: string | null
  phone: string | null
  role: string | null
}

const isEmptyValue = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '')

const REQUIRED_AUTH_FIELDS: Array<[keyof ParticipantAuthData, string]> = [
  ['email', 'E-mail'],
  ['cpf', 'CPF'],
  ['phone', 'Telefone'],
  ['role', 'Perfil de acesso']
]

const REQUIRED_PROFILE_FIELDS: Array<[keyof ParticipantProfileData, string]> = [
  ['full_name', 'Nome completo'],
  ['institution_organization', 'Instituição/organização'],
  ['organization_type', 'Tipo de organização'],
  ['job_title', 'Cargo'],
  ['relationship_with_otdsp', 'Relação com o OTDSP'],
  ['municipality', 'Município'],
  ['referral_source', 'Como conheceu o projeto']
]

const getParticipantProfile = (participant: any): ParticipantProfileData | null =>
  participant?.user_profile ?? null

const getParticipantAuth = (participant: any): ParticipantAuthData | null =>
  participant?.user_auth ?? null

const getParticipantMissingFields = (participant: any): string[] => {
  if (!participant?.user_id) return []

  const auth = getParticipantAuth(participant)
  const profile = getParticipantProfile(participant)

  if (!auth) return []

  const missingAuthFields = REQUIRED_AUTH_FIELDS
    .filter(([field]) => isEmptyValue(auth[field]))
    .map(([, label]) => label)

  const missingProfileFields = profile
    ? REQUIRED_PROFILE_FIELDS
        .filter(([field]) => isEmptyValue(profile[field]))
        .map(([, label]) => label)
    : REQUIRED_PROFILE_FIELDS.map(([, label]) => label)

  return [...missingAuthFields, ...missingProfileFields]
}

const getParticipantDisplayName = (participant: any) => {
  const profile = getParticipantProfile(participant)
  const auth = getParticipantAuth(participant)

  return (
    profile?.full_name?.trim() ||
    auth?.email?.trim() ||
    participant?.email?.trim() ||
    'Usuário sem identificação'
  )
}

const getParticipantVisualStatus = (participant: any): ParticipantVisualStatus => {
  if (!participant?.user_id) return 'red'

  const auth = getParticipantAuth(participant)
  if (!auth) return 'red'

  return getParticipantMissingFields(participant).length > 0 ? 'yellow' : 'green'
}

export default function EngajamentosPage() {
  const [user, setUser] = useState<any>(null)
  const [isStaff, setIsStaff] = useState(false)
  const [loading, setLoading] = useState(true)
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTime] = useState(() => Date.now())
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  
  // Filtros de Período e Dimensões
  const [filterOptions, setFilterOptions] = useState({
    verticals: [] as string[],
    horizontals: [] as string[],
    transversals: [] as string[]
  })
  
  const [periodFilters, setPeriodFilters] = useState({
    startDate: '2026-04-01',
    endDate: '',
    vertical: { enabled: false, values: [] as string[] },
    horizontal: { enabled: false, values: [] as string[] },
    transversal: { enabled: false, values: [] as string[] }
  })
  
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    status: 'Planejado',
    feedback: '',
    estimated_duration: '',
    horizontal: [] as string[],
    vertical: [] as string[],
    transversal: [] as string[],
    planned_activities: [] as string[],
    participants: [] as Participant[]
  })

  const fetchEngajamentos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('engagements')
      .select(`
        *,
        engagement_participants(
          id,
          user_id,
          email
        ),
        engagement_staff_notes(notes)
      `)
      .order('event_date', { ascending: false })

    if (error) {
      console.error('Error fetching engagements:', JSON.stringify(error, null, 2))
    } else {
      const userIds = Array.from(new Set(
        (data || [])
          .flatMap((eng: any) => eng.engagement_participants || [])
          .map((participant: any) => participant.user_id)
          .filter((userId: string | null): userId is string => Boolean(userId))
      ))

      let profilesById = new Map<string, ParticipantProfileData>()
      let authById = new Map<string, ParticipantAuthData>()

      if (userIds.length > 0) {
        const [profilesResult, authResult] = await Promise.all([
          supabase
            .from('user_profile')
            .select(`
              id,
              full_name,
              institution_organization,
              organization_type,
              job_title,
              relationship_with_otdsp,
              municipality,
              referral_source
            `)
            .in('id', userIds),
          supabase
            .from('user_auth')
            .select('id, email, cpf, phone, role')
            .in('id', userIds)
        ])

        if (profilesResult.error) {
          console.error('Erro ao buscar perfis dos participantes:', profilesResult.error.message)
        } else {
          profilesById = new Map(
            (profilesResult.data || []).map((profile: ParticipantProfileData) => [profile.id, profile])
          )
        }

        if (authResult.error) {
          console.error('Erro ao buscar dados de autenticação dos participantes:', authResult.error.message)
        } else {
          authById = new Map(
            (authResult.data || []).map((auth: ParticipantAuthData) => [auth.id, auth])
          )
        }
      }

      const formattedData = (data || []).map((eng: any) => ({
        ...eng,
        horizontal: Array.isArray(eng.horizontal) ? eng.horizontal : [],
        vertical: Array.isArray(eng.vertical) ? eng.vertical : [],
        transversal: Array.isArray(eng.transversal) ? eng.transversal : [],
        engagement_participants: (eng.engagement_participants || []).map((participant: any) => ({
          ...participant,
          user_profile: participant.user_id ? profilesById.get(participant.user_id) ?? null : null,
          user_auth: participant.user_id ? authById.get(participant.user_id) ?? null : null
        })),
        engagement_staff_notes: Array.isArray(eng.engagement_staff_notes) 
          ? eng.engagement_staff_notes[0] 
          : eng.engagement_staff_notes
      }))
      setEngagements(formattedData)
      
      const uniqueVerticals = new Set<string>()
      const uniqueHorizontals = new Set<string>()
      const uniqueTransversals = new Set<string>()
      
      formattedData.forEach((eng: Engagement) => {
        if (Array.isArray(eng.vertical)) eng.vertical.forEach(v => { if (v?.trim()) uniqueVerticals.add(v.trim()) })
        if (Array.isArray(eng.horizontal)) eng.horizontal.forEach(h => { if (h?.trim()) uniqueHorizontals.add(h.trim()) })
        if (Array.isArray(eng.transversal)) eng.transversal.forEach(t => { if (t?.trim()) uniqueTransversals.add(t.trim()) })
      })
      
      setFilterOptions({
        verticals: Array.from(uniqueVerticals).sort(),
        horizontals: Array.from(uniqueHorizontals).sort(),
        transversals: Array.from(uniqueTransversals).sort()
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      
      const { data: authData } = await supabase
        .from('user_auth')
        .select('role')
        .eq('id', session.user.id)
        .single()
        
      setIsStaff(authData?.role === 'staff')
      fetchEngajamentos()
    }
    getSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleArrayItem = (field: 'horizontal' | 'vertical' | 'transversal' | 'planned_activities', item: string) => {
    setFormData(prev => {
      const currentArray = prev[field]
      if (currentArray.includes(item)) {
        return { ...prev, [field]: currentArray.filter(i => i !== item) }
      } else {
        return { ...prev, [field]: [...currentArray, item] }
      }
    })
  }

  const handleFilterChange = (filterKey: string, newValue: any) => {
    setPeriodFilters((prev) => ({ ...prev, [filterKey]: newValue }))
  }

  const resetForm = () => {
    setFormData({
      title: '', description: '', event_date: '', location: '', status: 'Planejado',
      feedback: '', estimated_duration: '', horizontal: [], vertical: [],
      transversal: [], planned_activities: [], participants: []
    })
  }

  const closeDetails = () => {
    setShowForm(false)
    setEditingId(null)
    resetForm()
  }

  const openNewEngagement = () => {
    resetForm()
    setEditingId(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenDetails = (eng: Engagement) => {
    setEditingId(eng.id)

    const existingParticipants: Participant[] = eng.engagement_participants?.map((p: any) => ({
      user_id: p.user_id,
      email: p.email || '',
      full_name: getParticipantDisplayName(p),
      cpf: getParticipantAuth(p)?.cpf || '',
      status: getParticipantVisualStatus(p)
    })) || []

    setFormData({
      title: eng.title,
      description: eng.description,
      event_date: eng.event_date ? new Date(eng.event_date).toISOString().slice(0, 16) : '',
      location: eng.location,
      status: eng.status || 'Planejado',
      feedback: eng.engagement_staff_notes?.notes || '',
      estimated_duration: eng.estimated_duration ? eng.estimated_duration.toString() : '',
      horizontal: eng.horizontal || [],
      vertical: eng.vertical || [],
      transversal: eng.transversal || [],
      planned_activities: eng.planned_activities || [],
      participants: existingParticipants
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
    if (!isStaff || !editingId) return

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o engajamento “${formData.title}”? Esta ação não pode ser desfeita.`
    )
    if (!confirmed) return

    setIsSubmitting(true)
    const { error } = await supabase.from('engagements').delete().eq('id', editingId)

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao excluir: ' + error.message })
    } else {
      closeDetails()
      setMessage({ type: 'success', text: 'Engajamento excluído com sucesso.' })
      await fetchEngajamentos()
    }
    setIsSubmitting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isStaff) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date || null,
        location: formData.location,
        estimated_duration: formData.estimated_duration ? parseFloat(formData.estimated_duration) : null,
        horizontal: formData.horizontal,
        vertical: formData.vertical,
        transversal: formData.transversal,
        planned_activities: formData.planned_activities,
      }

      if (isStaff || !editingId) {
        payload.status = formData.status
      }

      let result;
      let currentEngagementId = editingId;

      if (editingId) {
        result = await supabase.from('engagements').update(payload).eq('id', editingId).select()
      } else {
        result = await supabase.from('engagements').insert([payload]).select()
        if (result.data && result.data.length > 0) {
          currentEngagementId = result.data[0].id
        }
      }

      if (result.error) {
        setMessage({ type: 'error', text: 'Erro ao salvar: ' + result.error.message })
      } else {
        if (isStaff && currentEngagementId) {
          await supabase
            .from('engagement_staff_notes')
            .upsert({ engagement_id: currentEngagementId, notes: formData.feedback })
        }

        // --- SINCRONIZAÇÃO DE PARTICIPANTES ---
        if (currentEngagementId) {
          // 1. Limpa os vínculos antigos para evitar duplicidade ou manter quem foi removido
          if (editingId) {
            const { error: deleteError } = await supabase
              .from('engagement_participants')
              .delete()
              .eq('engagement_id', currentEngagementId);

            if (deleteError) console.error('Erro ao limpar participantes antigos:', deleteError.message);
          }

          // 2. Insere a lista atualizada, incluindo automaticamente o criador como participante
          const participantsToSave: Array<{ engagement_id: string; user_id: string | null; email: string | null }> = []

          if (user?.id) {
            participantsToSave.push({
              engagement_id: currentEngagementId,
              user_id: user.id,
              email: null
            })
          }

          formData.participants.forEach((p) => {
            const normalizedEmail = p.email?.trim() || null
            const normalizedUserId = p.user_id || null

            if (!normalizedUserId && !normalizedEmail) return

            const alreadyAdded = participantsToSave.some((participant) => {
              if (normalizedUserId) return participant.user_id === normalizedUserId
              return participant.email === normalizedEmail
            })

            if (!alreadyAdded) {
              participantsToSave.push({
                engagement_id: currentEngagementId,
                user_id: normalizedUserId,
                email: normalizedUserId ? null : normalizedEmail
              })
            }
          })

          if (participantsToSave.length > 0) {
            const { error: partError } = await supabase
              .from('engagement_participants')
              .insert(participantsToSave)

            if (partError) console.error('Erro ao vincular participantes:', partError.message)
          }
        }

        setMessage({ type: 'success', text: editingId ? 'Engajamento atualizado!' : 'Engajamento criado!' })
        
        resetForm()
        setEditingId(null)
            setShowForm(false)
        fetchEngajamentos()
      }
    } catch (error: any) {
      console.error("Erro inesperado:", error)
      setMessage({ type: 'error', text: 'Erro inesperado ao processar a requisição.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não definida'
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const formatGridDate = (dateString: string) => {
    if (!dateString) return { date: 'Não definida', time: '' }

    const date = new Date(dateString)

    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const checkIsPast = useMemo(() => {
    return (eventDate: string, duration: number) => {
      if (!eventDate) return false;
      const endTimeMs = new Date(eventDate).getTime() + (duration * 60 * 60 * 1000);
      return endTimeMs < currentTime;
    };
  }, [currentTime]);

  const filteredEngagements = useMemo(() => {
    return engagements.filter(eng => {
      const matchesStatus = statusFilter === 'Todos' || eng.status === statusFilter
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || eng.title.toLowerCase().includes(searchLower) || eng.description.toLowerCase().includes(searchLower)
      
      let matchesDateRange = true
      if (periodFilters.startDate || periodFilters.endDate) {
        if (!eng.event_date) {
          matchesDateRange = false
        } else {
          const engDate = new Date(eng.event_date).getTime()
          const startTime = periodFilters.startDate ? new Date(periodFilters.startDate).getTime() : 0
          const endTime = periodFilters.endDate ? new Date(periodFilters.endDate + 'T23:59:59').getTime() : currentTime
          matchesDateRange = engDate >= startTime && engDate <= endTime
        }
      }
      
      let matchesHorizontal = true
      if (periodFilters.horizontal.enabled && periodFilters.horizontal.values.length > 0) {
        matchesHorizontal = periodFilters.horizontal.values.some(val => eng.horizontal?.includes(val))
      }
      
      let matchesVertical = true
      if (periodFilters.vertical.enabled && periodFilters.vertical.values.length > 0) {
        matchesVertical = periodFilters.vertical.values.some(val => eng.vertical?.includes(val))
      }
      
      let matchesTransversal = true
      if (periodFilters.transversal.enabled && periodFilters.transversal.values.length > 0) {
        matchesTransversal = periodFilters.transversal.values.some(val => eng.transversal?.includes(val))
      }
      
      return matchesStatus && matchesSearch && matchesDateRange && matchesHorizontal && matchesVertical && matchesTransversal
    })
  }, [engagements, statusFilter, searchTerm, periodFilters, currentTime])

  const isFormLocked = Boolean(editingId) && !isStaff

  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-20">
      {/* Header Section */}
      <section className="relative overflow-hidden bg-[#0F172A] py-16 md:py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-900 opacity-90" />
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold tracking-wider uppercase mb-6">
              <Target className="w-4 h-4" /> Gestão de Iniciativas
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Seus <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">Engajamentos</span>
            </h1>
          </div>
          {isStaff && (
            <button
              onClick={() => showForm ? closeDetails() : openNewEngagement()}
              className="bg-white text-[#0F172A] font-bold py-4 px-8 rounded-2xl shadow-xl flex items-center gap-3 transition-all hover:bg-cyan-50"
            >
              {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {showForm ? 'Cancelar' : 'Novo Engajamento'}
            </button>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 relative z-20">
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-12">
              <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-100 mt-8">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                        {editingId ? 'Detalhes do Engajamento' : 'Novo Engajamento'}
                      </h2>
                      {editingId && isFormLocked && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                          <Lock className="w-3.5 h-3.5" /> Somente visualização
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {editingId
                        ? isStaff
                          ? 'Edite os dados diretamente e salve as alterações ao finalizar.'
                          : 'Você pode consultar todas as informações, mas somente a staff pode alterá-las.'
                        : 'Preencha os dados para cadastrar um novo engajamento.'}
                    </p>
                  </div>

                  {editingId && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={!isStaff || isSubmitting}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" /> Excluir
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                  <fieldset disabled={isFormLocked} className={isFormLocked ? 'opacity-75' : ''}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Coluna 1: Informações Básicas e Staff */}
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Título da Atividade</label>
                          <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none disabled:cursor-not-allowed" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Descrição</label>
                          <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none resize-none disabled:cursor-not-allowed" />
                        </div>

                        {editingId && (
                          <div className="space-y-6 pt-4 border-t border-slate-100">
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-slate-700 ml-1">Status do Engajamento</label>
                              <select
                                name="status" value={formData.status} onChange={handleInputChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none font-medium cursor-pointer disabled:cursor-not-allowed"
                              >
                                <option value="Planejado">Planejado</option>
                                <option value="Pendente">Pendente</option>
                                <option value="Cancelado">Cancelado</option>
                                <option value="Concluído">Concluído</option>
                              </select>
                            </div>

                            {isStaff && (
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-cyan-700 ml-1">Anotações Internas / Feedback (Apenas Staff)</label>
                                <textarea
                                  name="feedback" value={formData.feedback} onChange={handleInputChange}
                                  placeholder="Notas exclusivas da equipe de gestão..." rows={3}
                                  className="w-full bg-cyan-50/30 border border-cyan-100 rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none resize-none font-medium disabled:cursor-not-allowed"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Coluna 2: Logística e Participantes */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Data e Hora</label>
                            <input required type="datetime-local" name="event_date" value={formData.event_date} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-cyan-500 outline-none disabled:cursor-not-allowed" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Localização</label>
                            <select name="location" value={formData.location} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none disabled:cursor-not-allowed">
                              <option value="">Selecione...</option>
                              {LOCATION_OPTIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Duração Estimada (Horas)</label>
                            <input type="number" name="estimated_duration" value={formData.estimated_duration} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 disabled:cursor-not-allowed" />
                          </div>

                          <div className={`space-y-2 pt-2 ${isFormLocked ? 'pointer-events-none' : ''}`}>
                            <label className="text-sm font-semibold text-slate-700 ml-1">Convidar e Gerenciar Participantes</label>
                            <ParticipantManager
                              participants={formData.participants}
                              onChange={(newParticipants) => {
                                if (!isFormLocked) setFormData(prev => ({ ...prev, participants: newParticipants }))
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Multi-selection Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-8 mt-10 border-y border-slate-100">
                      <BadgeToggleList label="Áreas de Interesse" icon={Heart} options={INTEREST_OPTIONS} selected={formData.horizontal} onToggle={(item: string) => toggleArrayItem('horizontal', item)} />
                      <BadgeToggleList label="Tecnologias" icon={Monitor} options={TECH_OPTIONS} selected={formData.vertical} onToggle={(item: string) => toggleArrayItem('vertical', item)} />
                      <BadgeToggleList label="Políticas Públicas" icon={Briefcase} options={POLICY_OPTIONS} selected={formData.transversal} onToggle={(item: string) => toggleArrayItem('transversal', item)} />
                      <BadgeToggleList label="Atividades" icon={Users} options={ACTIVITY_OPTIONS} selected={formData.planned_activities} onToggle={(item: string) => toggleArrayItem('planned_activities', item)} />
                    </div>
                  </fieldset>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4">
                    <button type="button" onClick={closeDetails} className="px-6 py-4 rounded-xl text-slate-500 font-bold hover:bg-slate-50">
                      {editingId ? 'Fechar' : 'Descartar'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isFormLocked}
                      className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-4 px-12 rounded-xl shadow-xl flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isFormLocked ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      {editingId
                        ? isStaff
                          ? 'Salvar Alterações'
                          : 'Somente visualização'
                        : 'Confirmar Planejamento'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {message && (
          <div
            role={message.type === 'error' ? 'alert' : 'status'}
            className={`mt-8 flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-sm font-semibold ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}
          >
            <span>{message.text}</span>
            <button type="button" onClick={() => setMessage(null)} className="rounded-lg p-1 hover:bg-white/60" aria-label="Fechar mensagem">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Existing List */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white p-2 mt-8">
          <div className="bg-white rounded-[2rem] shadow-sm p-8 md:p-12 min-h-[500px]">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-800"><Calendar className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Seu Histórico</h2>
                  <p className="text-slate-500">Acompanhe suas ações no ecossistema.</p>
                </div>
              </div>

              <div className="inline-flex w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Modo de visualização">
                <button
                  type="button"
                  aria-pressed={viewMode === 'cards'}
                  onClick={() => setViewMode('cards')}
                  className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${viewMode === 'cards' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <LayoutGrid className="w-4 h-4" /> Cards
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === 'grid'}
                  onClick={() => setViewMode('grid')}
                  className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Table2 className="w-4 h-4" /> Grade
                </button>
              </div>
            </div>

            {/* Bloco de Filtros */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-5 lg:items-center relative z-40 mb-8">
              <div className="flex items-center gap-2 lg:border-r border-slate-100 pr-4 shrink-0">
                <Filter className="w-5 h-5 text-slate-400" />
                <span className="font-semibold text-slate-700 text-sm tracking-wide uppercase">Filtros</span>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <DateRangeFilter
                      startDate={periodFilters.startDate}
                      endDate={periodFilters.endDate}
                      onStartDateChange={(date) => handleFilterChange('startDate', date)}
                      onEndDateChange={(date) => handleFilterChange('endDate', date)}
                    />
                  </div>
                  
                  <div className="w-full md:w-80 flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">Buscar</label>
                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                      <input 
                        type="text" 
                        placeholder="Título ou descrição..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MultiSelectFilter
                    label="Horizontal"
                    icon={Rows3}
                    enabled={periodFilters.horizontal.enabled}
                    values={periodFilters.horizontal.values}
                    options={filterOptions.horizontals}
                    onEnabledChange={(nextEnabled) => handleFilterChange('horizontal', { enabled: nextEnabled, values: nextEnabled ? [...filterOptions.horizontals] : [] })}
                    onValuesChange={(nextValues) => handleFilterChange('horizontal', { ...periodFilters.horizontal, values: nextValues })}
                  />
                  
                  <MultiSelectFilter
                    label="Vertical"
                    icon={Layers3}
                    enabled={periodFilters.vertical.enabled}
                    values={periodFilters.vertical.values}
                    options={filterOptions.verticals}
                    onEnabledChange={(nextEnabled) => handleFilterChange('vertical', { enabled: nextEnabled, values: nextEnabled ? [...filterOptions.verticals] : [] })}
                    onValuesChange={(nextValues) => handleFilterChange('vertical', { ...periodFilters.vertical, values: nextValues })}
                  />
                  
                  <MultiSelectFilter
                    label="Transversal"
                    icon={Waypoints}
                    enabled={periodFilters.transversal.enabled}
                    values={periodFilters.transversal.values}
                    options={filterOptions.transversals}
                    onEnabledChange={(nextEnabled) => handleFilterChange('transversal', { enabled: nextEnabled, values: nextEnabled ? [...filterOptions.transversals] : [] })}
                    onValuesChange={(nextValues) => handleFilterChange('transversal', { ...periodFilters.transversal, values: nextValues })}
                  />
        
                  <div className="relative flex items-center h-full min-h-[42px]"> 
                    <Activity className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value)} 
                      className="w-full h-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl pl-9 pr-8 text-xs font-semibold text-slate-600 appearance-none outline-none cursor-pointer focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all py-3" 
                    >
                      <option value="Todos">Todos os Status</option>
                      <option value="Planejado">Planejado</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Cancelado">Cancelado</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                    <div className="absolute right-3 pointer-events-none text-slate-400 text-[10px]">▼</div>
                  </div>              
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-cyan-500" /></div>
            ) : filteredEngagements.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Nenhum engajamento encontrado</h3>
                <p className="text-sm text-slate-500 mt-1">Ajuste os filtros ou a busca para visualizar outros resultados.</p>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEngagements.map((eng) => {
                  const isPast = checkIsPast(eng.event_date, eng.estimated_duration || 0)

                  return (
                    <motion.div
                      key={eng.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenDetails(eng)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          handleOpenDetails(eng)
                        }
                      }}
                      className="cursor-pointer bg-white border border-slate-100 hover:border-cyan-200 hover:shadow-xl rounded-3xl p-8 outline-none transition-all duration-300 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/30"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
                        <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-cyan-50 text-cyan-600">{eng.status}</span>
                        {isPast && (
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                            <Lock className="w-3 h-3" /> Encerrado
                          </span>
                        )}
                      </div>

                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{eng.title}</h3>
                      <p className="text-slate-500 text-sm mb-4 line-clamp-2">{eng.description}</p>

                      {isStaff && eng.engagement_staff_notes?.notes && (
                        <div className="mb-4 p-4 bg-cyan-50/20 rounded-xl border border-cyan-100/50">
                          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 mb-1">Notas Administrativas (Staff)</p>
                          <p className="text-xs text-slate-700 italic font-medium">&quot;{eng.engagement_staff_notes.notes}&quot;</p>
                        </div>
                      )}

                      {eng.engagement_participants && eng.engagement_participants.length > 0 && (
                        <div className="mb-6">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                            <Users className="w-3 h-3" /> Participantes
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {eng.engagement_participants.map((p: any, idx: number) => {
                              const displayName = getParticipantDisplayName(p)
                              const participantStatus = getParticipantVisualStatus(p)

                              const statusClasses = {
                                green: 'bg-slate-50 border-slate-200 text-slate-600',
                                yellow: 'bg-amber-50 border-amber-200 text-amber-700',
                                red: 'bg-red-50 border-red-200 text-red-700'
                              }[participantStatus]

                              const statusLabel = {
                                green: null,
                                yellow: 'Dados faltantes',
                                red: 'Sem cadastro'
                              }[participantStatus]

                              return (
                                <span
                                  key={p.user_id || p.email || idx}
                                  className={`text-[11px] font-semibold border px-2 py-0.5 rounded-md flex items-center gap-1 ${statusClasses}`}
                                >
                                  {displayName}
                                  {statusLabel && <span className="text-[9px] opacity-70">({statusLabel})</span>}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-50">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-xs font-medium text-slate-500">
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(eng.event_date)}</span>
                          <span className="flex items-center gap-1 text-cyan-600"><MapPin className="w-4 h-4" /> {eng.location || 'Local não definido'}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full table-fixed border-collapse text-left text-xs">
                  <colgroup>
                    <col className="w-[9%]" />
                    <col className="w-[19%]" />
                    <col className="w-[11%]" />
                    <col className="w-[11%]" />
                    <col className="w-[11%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                    <col className="w-[7%]" />
                    <col className="w-[7%]" />
                  </colgroup>
                  <thead className="bg-slate-100 text-[10px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="border-b border-r border-slate-200 px-2 py-2.5 font-black">Status</th>
                      <th className="border-b border-r border-slate-200 px-2 py-2.5 font-black">Engajamento</th>
                      <th className="border-b border-r border-slate-200 px-2 py-2.5 font-black">Horizontal</th>
                      <th className="border-b border-r border-slate-200 px-2 py-2.5 font-black">Vertical</th>
                      <th className="border-b border-r border-slate-200 px-2 py-2.5 font-black">Transversal</th>
                      <th className="border-b border-r border-slate-200 px-2 py-2.5 font-black">Data</th>
                      <th className="border-b border-r border-slate-200 px-2 py-2.5 font-black">Local</th>
                      <th className="border-b border-r border-slate-200 px-2 py-2.5 font-black">Duração</th>
                      <th className="border-b border-slate-200 px-2 py-2.5 text-center font-black">Membros</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredEngagements.map((eng) => (
                      <tr
                        key={eng.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenDetails(eng)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            handleOpenDetails(eng)
                          }
                        }}
                        className="cursor-pointer outline-none transition-colors hover:bg-cyan-50/60 focus:bg-cyan-50/60 focus:ring-2 focus:ring-inset focus:ring-cyan-500"
                      >
                        <td className="border-r border-slate-200 px-2 py-2.5 align-top">
                          <span className="inline-flex max-w-full truncate rounded-md bg-cyan-50 px-1.5 py-1 text-[9px] font-black uppercase tracking-wide text-cyan-700">{eng.status}</span>
                        </td>
                        <td className="border-r border-slate-200 px-2 py-2.5 align-top">
                          <p className="truncate font-bold text-slate-900" title={eng.title}>{eng.title}</p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500" title={eng.description || 'Sem descrição'}>{eng.description || 'Sem descrição'}</p>
                        </td>
                        <td className="border-r border-slate-200 px-2 py-2.5 align-top text-[11px] text-slate-600">
                          <p className="line-clamp-2" title={eng.horizontal?.length ? eng.horizontal.join(', ') : '—'}>{eng.horizontal?.length ? eng.horizontal.join(', ') : '—'}</p>
                        </td>
                        <td className="border-r border-slate-200 px-2 py-2.5 align-top text-[11px] text-slate-600">
                          <p className="line-clamp-2" title={eng.vertical?.length ? eng.vertical.join(', ') : '—'}>{eng.vertical?.length ? eng.vertical.join(', ') : '—'}</p>
                        </td>
                        <td className="border-r border-slate-200 px-2 py-2.5 align-top text-[11px] text-slate-600">
                          <p className="line-clamp-2" title={eng.transversal?.length ? eng.transversal.join(', ') : '—'}>{eng.transversal?.length ? eng.transversal.join(', ') : '—'}</p>
                        </td>
                        <td className="border-r border-slate-200 px-2 py-2.5 align-top text-[11px] text-slate-600">
                          <div className="min-w-0 leading-tight" title={formatDate(eng.event_date)}>
                            <p className="whitespace-nowrap tabular-nums text-slate-700">
                              {formatGridDate(eng.event_date).date}
                            </p>
                            {formatGridDate(eng.event_date).time && (
                              <p className="mt-0.5 whitespace-nowrap text-[10px] tabular-nums text-slate-500">
                                {formatGridDate(eng.event_date).time}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="border-r border-slate-200 px-2 py-2.5 align-top text-[11px] text-slate-600">
                          <p className="truncate" title={eng.location || '—'}>{eng.location || '—'}</p>
                        </td>
                        <td className="border-r border-slate-200 px-2 py-2.5 align-top whitespace-nowrap text-[11px] text-slate-600">{eng.estimated_duration ? `${eng.estimated_duration} h` : '—'}</td>
                        <td className="border-r border-slate-200 px-2 py-2.5 align-top whitespace-nowrap text-[11px] text-slate-600">{eng.engagement_participants?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// Componente para a grade de multi-seleção
const BadgeToggleList = ({ options, selected, onToggle, label, icon: Icon }: any) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1"><Icon className="w-4 h-4 text-slate-400" />{label}</div>
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt: string) => {
        const isActive = selected.includes(opt)
        return (
          <button key={opt} type="button" onClick={() => onToggle(opt)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${isActive ? 'bg-[#0F172A] border-[#0F172A] text-white' : 'bg-white border-slate-200 text-slate-500'}`}>{opt}</button>
        )
      })}
    </div>
  </div>
)