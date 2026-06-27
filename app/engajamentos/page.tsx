'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Target,
  X,
  Mail,
  Users,
  Briefcase,
  Monitor,
  Heart,
  Pencil,
  Trash2,
  Lock
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Interface limpa e sincronizada com o banco de dados atual
interface Engagement {
  id: string
  title: string
  description: string
  event_date: string
  location: string
  status: string
  interests: string[]
  technologies: string[]
  public_policies: string[]
  planned_activities: string[]
  estimated_duration: number
  created_by: string
  engagement_participants?: { user_email: string }[]
  engagement_staff_notes?: { notes: string } | null
}

const INTEREST_OPTIONS = ["Educação", "Saúde", "Segurança", "Meio Ambiente", "Infraestutura de TI"]
const TECH_OPTIONS = ["5G", "IA", "Open hardware", "Open Semi Condoctors", "Computação Quântica", "Internet das coisas (IoT)"]
const POLICY_OPTIONS = ["Igualdade de gênero", "Igualdade racial", "Acessibilidade"]
const ACTIVITY_OPTIONS = ["Pitch Inicial", "Visita ao Showroom", "Apresentação Institucional", "Reunião de Plano de Trabalho", "Reunião de Adesão ao Convênio"]
const LOCATION_OPTIONS = ["Remoto", "Inova USP"]

export default function EngajamentosPage() {
  const [user, setUser] = useState<any>(null)
  const [isStaff, setIsStaff] = useState(false)
  const [loading, setLoading] = useState(true)
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    status: 'Planejado',
    feedback: '',
    estimated_duration: '',
    interests: [] as string[],
    technologies: [] as string[],
    public_policies: [] as string[],
    planned_activities: [] as string[],
    participants: [] as string[]
  })

  // Busca Avançada Relacional
  const fetchEngajamentos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('engagements')
      .select(`
        *,
        engagement_participants(user_email),
        engagement_staff_notes(notes)
      `)
      .order('event_date', { ascending: false })

    if (error) {
      console.error('Error fetching engagements:', error)
    } else {
      const formattedData = (data || []).map((eng: any) => ({
        ...eng,
        interests: Array.isArray(eng.horizontal) ? eng.horizontal : (Array.isArray(eng.interests) ? eng.interests : []),
        technologies: Array.isArray(eng.vertical) ? eng.vertical : (Array.isArray(eng.technologies) ? eng.technologies : []),
        public_policies: Array.isArray(eng.transversal) ? eng.transversal : (Array.isArray(eng.public_policies) ? eng.public_policies : []),
        engagement_staff_notes: Array.isArray(eng.engagement_staff_notes) 
          ? eng.engagement_staff_notes[0] 
          : eng.engagement_staff_notes
      }))
      setEngagements(formattedData)
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
        .select('is_staff')
        .eq('id', session.user.id)
        .single()
        
      setIsStaff(authData?.is_staff || false)
      fetchEngajamentos()
    }
    getSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isStaff || emailInput.trim().length < 2) {
      const timer = setTimeout(() => {
        setEmailSuggestions([])
        setShowSuggestions(false)
      }, 0);
      return () => clearTimeout(timer);
    }

    const fetchSuggestions = async () => {
      const { data, error } = await supabase
        .from('user_auth')
        .select('email')
        .ilike('email', `%${emailInput}%`)
        .limit(5)

      if (!error && data) {
        const newSuggestions = data
          .map(d => d.email)
          .filter(email => !formData.participants.includes(email))
        
        setEmailSuggestions(newSuggestions)
        setShowSuggestions(newSuggestions.length > 0)
      }
    }

    const timeoutId = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timeoutId)
  }, [emailInput, isStaff, formData.participants])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleArrayItem = (field: 'interests' | 'technologies' | 'public_policies' | 'planned_activities', item: string) => {
    setFormData(prev => {
      const currentArray = prev[field]
      if (currentArray.includes(item)) {
        return { ...prev, [field]: currentArray.filter(i => i !== item) }
      } else {
        return { ...prev, [field]: [...currentArray, item] }
      }
    })
  }

  const addParticipant = () => {
    if (emailInput && emailInput.includes('@') && !formData.participants.includes(emailInput)) {
      setFormData(prev => ({ ...prev, participants: [...prev.participants, emailInput] }))
      setEmailInput('')
    }
  }

  const removeParticipant = (email: string) => {
    setFormData(prev => ({ ...prev, participants: prev.participants.filter(e => e !== email) }))
  }

  const handleEdit = (eng: Engagement) => {
    setEditingId(eng.id)
    setFormData({
      title: eng.title,
      description: eng.description,
      event_date: eng.event_date ? new Date(eng.event_date).toISOString().slice(0, 16) : '',
      location: eng.location,
      status: eng.status || 'Planejado',
      feedback: eng.engagement_staff_notes?.notes || '',
      estimated_duration: eng.estimated_duration ? eng.estimated_duration.toString() : '',
      interests: eng.interests || [],
      technologies: eng.technologies || [],
      public_policies: eng.public_policies || [],
      planned_activities: eng.planned_activities || [],
      participants: []
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este engajamento?')) return
    const { error } = await supabase.from('engagements').delete().eq('id', id)
    if (error) alert('Erro ao excluir: ' + error.message)
    else fetchEngajamentos()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setMessage(null)

    const payload: any = {
      title: formData.title,
      description: formData.description,
      event_date: formData.event_date || null,
      location: formData.location,
      estimated_duration: formData.estimated_duration ? parseFloat(formData.estimated_duration) : null,
      horizontal: formData.interests,
      vertical: formData.technologies,
      transversal: formData.public_policies,
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
      if (result.data) currentEngagementId = result.data[0].id
    }

    if (result.error) {
      setMessage({ type: 'error', text: 'Erro ao salvar: ' + result.error.message })
    } else {
      if (isStaff && currentEngagementId) {
        await supabase
          .from('engagement_staff_notes')
          .upsert({ engagement_id: currentEngagementId, notes: formData.feedback })
      }

      if (formData.participants.length > 0 && currentEngagementId) {
        const participantsData = formData.participants.map(email => ({
          engagement_id: currentEngagementId,
          user_email: email.trim().toLowerCase()
        }))

        const { error: partError } = await supabase
          .from('engagement_participants')
          .insert(participantsData)

        if (partError) {
          console.error("Erro ao vincular e-mails dos participantes:", partError.message)
        }
      }

      setMessage({ type: 'success', text: editingId ? 'Engajamento atualizado!' : 'Engajamento criado!' })
      setFormData({
        title: '', description: '', event_date: '', location: '', status: 'Planejado',
        feedback: '', estimated_duration: '', interests: [], technologies: [],
        public_policies: [], planned_activities: [], participants: []
      })
      setEditingId(null)
      setTimeout(() => setShowForm(false), 2000)
      fetchEngajamentos()
    }
    setIsSubmitting(false)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não definida'
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const checkIsPast = useMemo(() => {
    return (eventDate: string, duration: number) => {
      if (!eventDate) return false;
      const endTimeMs = new Date(eventDate).getTime() + (duration * 60 * 60 * 1000);
      return endTimeMs < Date.now();
    };
  }, []);

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
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); }}
            className="bg-white text-[#0F172A] font-bold py-4 px-8 rounded-2xl shadow-xl flex items-center gap-3 transition-all hover:bg-cyan-50"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? 'Cancelar' : 'Novo Engajamento'}
          </button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 relative z-20">
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-12">
              <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-100 mt-8">
                <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Título da Atividade</label>
                        <input required type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Descrição</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none resize-none" />
                      </div>

                      {editingId && isStaff && (
                        <div className="space-y-6 pt-4 border-t border-slate-100">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Status do Engajamento (Apenas Staff)</label>
                            <select 
                              name="status" value={formData.status} onChange={handleInputChange}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none font-medium cursor-pointer"
                            >
                              <option value="Planejado">Planejado</option>
                              <option value="Pendente">Pendente</option>
                              <option value="Cancelado">Cancelado</option>
                              <option value="Concluído">Concluído</option>
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-cyan-700 ml-1 font-bold">Anotações Internas / Feedback (Apenas Staff)</label>
                            <textarea 
                              name="feedback" value={formData.feedback} onChange={handleInputChange}
                              placeholder="Notas exclusivas da equipa de gestão..." rows={3} 
                              className="w-full bg-cyan-50/30 border border-cyan-100 rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none resize-none font-medium"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Data e Hora</label>
                          <input required type="datetime-local" name="event_date" value={formData.event_date} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-cyan-500 outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Localização</label>
                          <select name="location" value={formData.location} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none">
                            <option value="">Selecione...</option>
                            {LOCATION_OPTIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Duração (Horas)</label>
                          <input type="number" name="estimated_duration" value={formData.estimated_duration} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Convidar Participantes</label>
                          <div className="flex gap-2">
                            <div className="relative flex-grow">
                              <input 
                                type="email" 
                                value={emailInput} 
                                onChange={(e) => setEmailInput(e.target.value)} 
                                onFocus={() => emailSuggestions.length > 0 && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())} 
                                placeholder="Digite o e-mail..." 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none" 
                              />
                              
                              {isStaff && showSuggestions && (
                                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                                  {emailSuggestions.map(suggestion => (
                                    <button
                                      key={suggestion}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault()
                                        setFormData(prev => ({ ...prev, participants: [...prev.participants, suggestion] }))
                                        setEmailInput('')
                                        setShowSuggestions(false)
                                      }}
                                      className="w-full text-left px-4 py-3 text-sm text-slate-600 font-medium hover:bg-cyan-50 hover:text-cyan-700 transition-colors border-b border-slate-50 last:border-0"
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button type="button" onClick={addParticipant} className="bg-slate-100 p-4 rounded-xl hover:bg-slate-200 transition-colors">
                              <Plus className="w-5 h-5 text-slate-600" />
                            </button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.participants.map(email => (
                              <span key={email} className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold border border-cyan-100">
                                {email} 
                                <button type="button" onClick={() => removeParticipant(email)} className="hover:text-red-500 transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multi-selection Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-8 border-y border-slate-100">
                    <BadgeToggleList label="Áreas de Interesse" icon={Heart} options={INTEREST_OPTIONS} selected={formData.interests} onToggle={(item: string) => toggleArrayItem('interests', item)} />
                    <BadgeToggleList label="Tecnologias" icon={Monitor} options={TECH_OPTIONS} selected={formData.technologies} onToggle={(item: string) => toggleArrayItem('technologies', item)} />
                    <BadgeToggleList label="Políticas Públicas" icon={Briefcase} options={POLICY_OPTIONS} selected={formData.public_policies} onToggle={(item: string) => toggleArrayItem('public_policies', item)} />
                    <BadgeToggleList label="Atividades" icon={Users} options={ACTIVITY_OPTIONS} selected={formData.planned_activities} onToggle={(item: string) => toggleArrayItem('planned_activities', item)} />
                  </div>

                  <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => setShowForm(false)} className="px-6 py-4 rounded-xl text-slate-500 font-bold hover:bg-slate-50">Descartar</button>
                    <button type="submit" disabled={isSubmitting} className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-4 px-12 rounded-xl shadow-xl flex items-center gap-2">
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      {editingId ? 'Salvar Alterações' : 'Confirmar Planejamento'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing List */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white p-2 mt-8">
          <div className="bg-white rounded-[2rem] shadow-sm p-8 md:p-12 min-h-[500px]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-800"><Calendar className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Seu Histórico</h2>
                  <p className="text-slate-500">Acompanhe suas ações no ecossistema.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <input type="text" placeholder="Buscar engajamentos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-cyan-500 outline-none" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-semibold outline-none cursor-pointer">
                  <option value="Todos">Todos Status</option>
                  <option value="Planejado">Planejado</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Cancelado">Cancelado</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-cyan-500" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {engagements
                  .filter(eng => {
                    const matchesStatus = statusFilter === 'Todos' || eng.status === statusFilter
                    const searchLower = searchTerm.toLowerCase()
                    return matchesStatus && (!searchTerm || eng.title.toLowerCase().includes(searchLower) || eng.description.toLowerCase().includes(searchLower))
                  })
                  .map((eng) => {
                    const isPast = checkIsPast(eng.event_date, eng.estimated_duration || 0);
                    const canEdit = isStaff || !isPast;

                    return (
                      <motion.div key={eng.id} className="bg-white border border-slate-100 hover:border-cyan-200 hover:shadow-xl rounded-3xl p-8 transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                          <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-cyan-50 text-cyan-600">{eng.status}</span>
                          <div className="flex items-center gap-3">
                            
                            {canEdit && (
                              <button onClick={() => handleEdit(eng)} className="text-xs font-bold text-slate-500 hover:text-cyan-600 transition-colors flex items-center gap-1">
                                <Pencil className="w-3.5 h-3.5" /> Editar
                              </button>
                            )}

                            {!canEdit && (
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                                <Lock className="w-3 h-3" /> Encerrado
                              </span>
                            )}

                            {isStaff && (
                              <button onClick={() => handleDelete(eng.id)} className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1">
                                <Trash2 className="w-3.5 h-3.5" /> Excluir
                              </button>
                            )}
                          </div>
                        </div>
                      
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{eng.title}</h3>
                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{eng.description}</p>
                        
                        {eng.engagement_staff_notes?.notes && (
                          <div className="mb-4 p-4 bg-cyan-50/20 rounded-xl border border-cyan-100/50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 mb-1">Notas Administrativas (Staff)</p>
                            <p className="text-xs text-slate-700 italic font-medium">&quot;{eng.engagement_staff_notes.notes}&quot;</p>
                          </div>
                        )}

                        {eng.engagement_participants && eng.engagement_participants.length > 0 && (
                          <div className="mb-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                              <Users className="w-3 h-3" /> Participantes Vinculados
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {eng.engagement_participants.map(p => (
                                <span key={p.user_email} className="text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                                  {p.user_email}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-slate-50 flex justify-between text-xs font-medium text-slate-500">
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(eng.event_date)}</span>
                          <span className="flex items-center gap-1 text-cyan-600"><MapPin className="w-4 h-4" /> {eng.location}</span>
                        </div>
                      </motion.div>
                    );
                  })
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

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