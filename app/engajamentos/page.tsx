'use client'

import { useState, useEffect } from 'react'
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
  ChevronRight,
  Target,
  X,
  Mail,
  Users,
  Briefcase,
  Monitor,
  Heart
} from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  participants: string[]
  feedback?: string
}

const INTEREST_OPTIONS = ["Educação", "Saúde", "Segurança", "Meio Ambiente", "Infraestutura de TI"]
const TECH_OPTIONS = ["5G", "IA", "Open hardware", "Open Semi Condoctors", "Computação Quântica", "Internet das coisas (IoT)"]
const POLICY_OPTIONS = ["Igualdade de gênero", "Igualdade racial", "Acessibilidade"]
const ACTIVITY_OPTIONS = ["Pitch Inicial", "Visita ao Showroom", "Apresentação Institucional", "Reunião de Plano de Trabalho", "Reunião de Adesão ao Convênio"]
const LOCATION_OPTIONS = ["Remoto", "Inova USP"]

export default function EngajamentosPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [emailInput, setEmailInput] = useState('')
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

  const fetchEngajamentos = async (userEmail: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('engagements')
      .select('*')
      .contains('participants', [userEmail])
      .order('event_date', { ascending: false })

    if (error) {
      console.error('Error fetching engagements:', error)
    } else {
      setEngagements(data || [])
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
      if (session.user.email) {
        fetchEngajamentos(session.user.email)
      }
    }
    getSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      feedback: eng.feedback || '',
      estimated_duration: eng.estimated_duration ? eng.estimated_duration.toString() : '',
      interests: eng.interests || [],
      technologies: eng.technologies || [],
      public_policies: eng.public_policies || [],
      planned_activities: eng.planned_activities || [],
      participants: eng.participants || []
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setMessage(null)

    // Ensure the creator is also a participant
    const finalParticipants = [...new Set([...formData.participants, user.email])]

    const payload = {
      title: formData.title,
      description: formData.description,
      event_date: formData.event_date || null,
      location: formData.location,
      estimated_duration: formData.estimated_duration ? parseFloat(formData.estimated_duration) : null,
      interests: formData.interests,
      technologies: formData.technologies,
      public_policies: formData.public_policies,
      planned_activities: formData.planned_activities,
      participants: finalParticipants,
      status: editingId ? formData.status : 'Planejado',
      feedback: formData.status === 'Concluído' ? formData.feedback : null
    }

    let result;
    if (editingId) {
      result = await supabase
        .from('engagements')
        .update(payload)
        .eq('id', editingId)
    } else {
      result = await supabase
        .from('engagements')
        .insert([payload])
    }

    if (result.error) {
      setMessage({ type: 'error', text: 'Erro ao salvar: ' + result.error.message })
    } else {
      setMessage({ type: 'success', text: editingId ? 'Engajamento atualizado com sucesso!' : 'Engajamento planejado com sucesso!' })
      setFormData({
        title: '',
        description: '',
        event_date: '',
        location: '',
        status: 'Planejado',
        feedback: '',
        estimated_duration: '',
        interests: [],
        technologies: [],
        public_policies: [],
        planned_activities: [],
        participants: []
      })
      setEditingId(null)
      setTimeout(() => setShowForm(false), 2000)
      fetchEngajamentos(user.email)
    }
    setIsSubmitting(false)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não definida'
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-20">
      {/* Header Section */}
      <section className="relative overflow-hidden bg-[#0F172A] py-16 md:py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-900 opacity-90" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.1),transparent)] pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold tracking-wider uppercase mb-6">
              <Target className="w-4 h-4" />
              Gestão de Iniciativas
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Seus <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">Engajamentos</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed">
              Organize suas ações estratégicas no ecossistema do Observatório.
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (showForm) {
                setShowForm(false)
                setEditingId(null)
                setFormData({
                  title: '',
                  description: '',
                  event_date: '',
                  location: '',
                  status: 'Planejado',
                  feedback: '',
                  estimated_duration: '',
                  interests: [],
                  technologies: [],
                  public_policies: [],
                  planned_activities: [],
                  participants: []
                })
              } else {
                setShowForm(true)
              }
            }}
            className="bg-white text-[#0F172A] font-bold py-4 px-8 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all hover:bg-cyan-50"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showForm ? 'Cancelar' : 'Novo Engajamento'}
          </motion.button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 relative z-20">
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="overflow-hidden mb-12"
            >
              <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 p-8 md:p-12 border border-slate-100 mt-8">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600">
                    {editingId ? <ChevronRight className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900">
                      {editingId ? 'Editar Engajamento' : 'Planejar Engajamento'}
                    </h2>
                    <p className="text-slate-500">
                      {editingId ? 'Atualize os detalhes da sua iniciativa.' : 'Preencha os detalhes da sua nova iniciativa.'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                  {/* Basic Info Group */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Título da Atividade</label>
                        <input 
                          required
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Ex: Workshop Territorial de Inovação"
                          className="w-full bg-slate-50 border-slate-200 border rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Descrição do Engajamento</label>
                        <textarea 
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Descreva brevemente os objetivos desta ação..."
                          rows={4}
                          className="w-full bg-slate-50 border-slate-200 border rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                        />
                      </div>

                      {editingId && (
                        <div className="space-y-6 pt-4 border-t border-slate-100">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Status do Engajamento</label>
                            <select 
                              name="status"
                              value={formData.status}
                              onChange={handleInputChange}
                              className="w-full bg-slate-50 border-slate-200 border rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none transition-all appearance-none cursor-pointer font-medium"
                            >
                              <option value="Planejado">Planejado</option>
                              <option value="Pendente">Pendente</option>
                              <option value="Cancelado">Cancelado</option>
                              <option value="Concluído">Concluído</option>
                            </select>
                          </div>

                          {formData.status === 'Concluído' && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-2"
                            >
                              <label className="text-sm font-semibold text-slate-700 ml-1">Feedback / Resultados (Opcional)</label>
                              <textarea 
                                name="feedback"
                                value={formData.feedback}
                                onChange={handleInputChange}
                                placeholder="Relate os principais resultados e feedbacks..."
                                rows={3}
                                className="w-full bg-slate-50 border-slate-200 border rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                              />
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Data e Hora</label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                              required
                              type="datetime-local"
                              name="event_date"
                              value={formData.event_date}
                              onChange={handleInputChange}
                              className="w-full bg-slate-50 border-slate-200 border rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-medium"
                            />
                          </div>
                          <p className="text-[11px] text-orange-500 font-medium ml-1">Sugere-se agendamento com 48h de antecedência.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Localização</label>
                          <select 
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border-slate-200 border rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none transition-all appearance-none cursor-pointer font-medium"
                          >
                            <option value="">Selecione o Local...</option>
                            {LOCATION_OPTIONS.map(loc => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Duração Estimada (Horas)</label>
                          <input 
                            type="number"
                            name="estimated_duration"
                            value={formData.estimated_duration}
                            onChange={handleInputChange}
                            placeholder="Ex: 2"
                            className="w-full bg-slate-50 border-slate-200 border rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-medium"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700 ml-1">Participantes (E-mails)</label>
                          <div className="flex gap-2">
                            <div className="relative flex-grow">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                              <input 
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
                                placeholder="Pressione Enter"
                                className="w-full bg-slate-50 border-slate-200 border rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400"
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={addParticipant}
                              className="bg-slate-100 p-4 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                              <Plus className="w-6 h-6" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {formData.participants.map(email => (
                              <span key={email} className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold border border-cyan-100">
                                {email}
                                <button type="button" onClick={() => removeParticipant(email)}>
                                  <X className="w-3 h-3" />
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
                    <BadgeToggleList 
                      label="Áreas de Interesse"
                      icon={Heart}
                      options={INTEREST_OPTIONS}
                      selected={formData.interests}
                      onToggle={(item: string) => toggleArrayItem('interests', item)}
                    />
                    <BadgeToggleList 
                      label="Tecnologias"
                      icon={Monitor}
                      options={TECH_OPTIONS}
                      selected={formData.technologies}
                      onToggle={(item: string) => toggleArrayItem('technologies', item)}
                    />
                    <BadgeToggleList 
                      label="Políticas Públicas"
                      icon={Briefcase}
                      options={POLICY_OPTIONS}
                      selected={formData.public_policies}
                      onToggle={(item: string) => toggleArrayItem('public_policies', item)}
                    />
                    <BadgeToggleList 
                      label="Atividades Planejadas"
                      icon={Users}
                      options={ACTIVITY_OPTIONS}
                      selected={formData.planned_activities}
                      onToggle={(item: string) => toggleArrayItem('planned_activities', item)}
                    />
                  </div>

                  {/* Action Group */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
                    <AnimatePresence>
                      {message && (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-semibold flex-grow max-w-md ${
                            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                          }`}
                        >
                          {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                          {message.text}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-grow md:flex-none px-10 py-4 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-all"
                      >
                        Descartar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-grow md:flex-none bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-4 px-12 rounded-xl shadow-xl shadow-slate-900/10 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            {editingId ? 'Salvar Alterações' : 'Confirmar Planejamento'}
                          </>
                        )}
                      </button>
                    </div>
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
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-800">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Seu Histórico</h2>
                  <p className="text-slate-500">Acompanhe suas ações planejadas e realizadas.</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <div className="relative w-full sm:w-64">
                  <input 
                    type="text"
                    placeholder="Buscar engajamentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  />
                  <Target className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-semibold focus:ring-2 focus:ring-cyan-500 outline-none transition-all cursor-pointer"
                >
                  <option value="Todos">Todos Status</option>
                  <option value="Planejado">Planejado</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Cancelado">Cancelado</option>
                  <option value="Concluído">Concluído</option>
                </select>
                <div className="hidden sm:block h-6 w-px bg-slate-200 mx-2" />
                <span className="px-4 py-2 bg-white text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200">
                  {engagements.length} Registros
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-80 gap-6 text-slate-400">
                <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
                <p className="text-lg font-bold tracking-tight">Carregando seus dados...</p>
              </div>
            ) : engagements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center max-w-sm mx-auto">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8 border-2 border-dashed border-slate-100">
                  <Clock className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Nenhuma iniciativa ainda</h3>
                <p className="text-slate-500 leading-relaxed">Clique no botão <span className="font-bold text-slate-700">&quot;Novo Engajamento&quot;</span> acima para planejar seu primeiro encontro estratégico.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {engagements
                  .filter(eng => {
                    const matchesStatus = statusFilter === 'Todos' || eng.status === statusFilter
                    const searchLower = searchTerm.toLowerCase()
                    const matchesSearch = !searchTerm || 
                      eng.title.toLowerCase().includes(searchLower) || 
                      eng.description.toLowerCase().includes(searchLower) || 
                      eng.location.toLowerCase().includes(searchLower)
                    return matchesStatus && matchesSearch
                  })
                  .map((eng) => (
                    <motion.div 
                      key={eng.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative bg-white border border-slate-100 hover:border-cyan-200 hover:shadow-2xl hover:shadow-cyan-900/5 rounded-3xl p-8 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          eng.status === 'Planejado' ? 'bg-cyan-50 text-cyan-600' : 
                          eng.status === 'Concluído' ? 'bg-emerald-50 text-emerald-600' :
                          eng.status === 'Cancelado' ? 'bg-red-50 text-red-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {eng.status || 'Planejado'}
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleEdit(eng)}
                            className="text-xs font-bold text-cyan-600 hover:text-cyan-800 transition-colors flex items-center gap-1"
                          >
                            <ChevronRight className="w-3 h-3" />
                            Editar
                          </button>
                          <div className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {eng.estimated_duration ? `${eng.estimated_duration}h` : '--'}
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-cyan-700 transition-colors leading-tight">{eng.title}</h3>
                      <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed">{eng.description}</p>
                      
                      {eng.feedback && (
                        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Feedback</p>
                          <p className="text-xs text-slate-600 italic leading-relaxed line-clamp-2">&quot;{eng.feedback}&quot;</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mb-8">
                        {eng.planned_activities.slice(0, 2).map(act => (
                          <span key={act} className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                            {act}
                          </span>
                        ))}
                        {eng.planned_activities.length > 2 && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                            +{eng.planned_activities.length - 2}
                          </span>
                        )}
                      </div>

                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm font-semibold">{formatDate(eng.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-cyan-600 font-bold text-sm">
                          <MapPin className="w-4 h-4" />
                          {eng.location}
                        </div>
                      </div>
                    </motion.div>
                  ))
                }
                {engagements
                  .filter(eng => {
                    const matchesStatus = statusFilter === 'Todos' || eng.status === statusFilter
                    const searchLower = searchTerm.toLowerCase()
                    const matchesSearch = !searchTerm || 
                      eng.title.toLowerCase().includes(searchLower) || 
                      eng.description.toLowerCase().includes(searchLower) || 
                      eng.location.toLowerCase().includes(searchLower)
                    return matchesStatus && matchesSearch
                  }).length === 0 && (
                    <div className="col-span-full py-20 text-center">
                      <p className="text-slate-400 font-medium">Nenhum engajamento encontrado com os filtros atuais.</p>
                    </div>
                  )
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

const BadgeToggleList = ({ options, selected, onToggle, label, icon: Icon }: any) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1">
      <Icon className="w-4 h-4 text-slate-400" />
      {label}
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map((opt: string) => {
        const isActive = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              isActive 
                ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-md scale-105' 
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  </div>
)
