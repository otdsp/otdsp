'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { 
  User, 
  Lock, 
  Save, 
  ShieldCheck, 
  Building2, 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  LogOut,
  Settings,
  Trash2,
  TriangleAlert
} from 'lucide-react'

// Profile fields type
interface UserProfile {
  id: string
  user_id: string
  full_name: string
  phone: string
  municipality: string
  institution_organization: string
  organization_type: string
  job_title: string
  relationship_with_otdsp: string
  referral_source: string
}

export default function ProfilePage() {
  const router = useRouter()

  // Auth & Data State
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dados' | 'seguranca'>('dados')

  // Form States
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Password state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  // Delete Account States (LGPD)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const initProfile = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (!currentSession) {
        router.push('/login')
        return
      }

      setSession(currentSession)

      // Fetch Profile Data
      try {
        const { data, error } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', currentSession.user.id)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }

    initProfile()
  }, [router])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!profile) return
    const { name, value } = e.target
    setProfile({ ...profile, [name]: value })
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !session) return

    setProfileLoading(true)
    setFeedback(null)

    try {
      const { error } = await supabase
        .from('user_profile')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          municipality: profile.municipality,
          institution_organization: profile.institution_organization,
          organization_type: profile.organization_type,
          job_title: profile.job_title,
          relationship_with_otdsp: profile.relationship_with_otdsp,
          referral_source: profile.referral_source
        })
        .eq('user_id', session.user.id)

      if (error) throw error

      setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' })
      setTimeout(() => setFeedback(null), 3000)
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao atualizar perfil.' })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    if (passwords.new !== passwords.confirm) {
      setFeedback({ type: 'error', message: 'A nova senha e a confirmação não coincidem.' })
      return
    }

    if (passwords.new.length < 6) {
      setFeedback({ type: 'error', message: 'A nova senha deve ter pelo menos 6 caracteres.' })
      return
    }

    setPasswordLoading(true)
    setFeedback(null)

    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: passwords.current
      })

      if (verifyError) {
        throw new Error('A senha atual está incorreta.')
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new
      })

      if (updateError) throw updateError

      setFeedback({ type: 'success', message: 'Senha atualizada com sucesso!' })
      setPasswords({ current: '', new: '', confirm: '' })
      setTimeout(() => setFeedback(null), 3000)
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao atualizar senha.' })
    } finally {
      setPasswordLoading(false)
    }
  }

  // Função disparada no botão do Modal de Exclusão
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'EXCLUIR') return

    setIsDeleting(true)
    
    try {
      // Chama a função (RPC) segura para excluir a conta de dentro do banco de dados
      const { error } = await supabase.rpc('delete_user_account')

      if (error) throw error

      // Limpa a sessão local e redireciona
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (err: any) {
      console.error('Erro ao excluir:', err)
      setFeedback({ type: 'error', message: 'Erro ao excluir conta. Contate o suporte ou tente novamente mais tarde.' })
      setIsDeleting(false)
      setShowDeleteModal(false)
      setDeleteConfirmation('')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-600 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Carregando seu perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-4 font-sans relative">
      
      {/* ⚠️ MODAL DE TRAVA PARA EXCLUSÃO (ZONA DE PERIGO) */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200"
            >
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <TriangleAlert className="w-8 h-8 text-red-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Você tem certeza?</h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Sua conta será apagada permanentemente. Todos os seus dados pessoais e vínculos com a plataforma serão eliminados da base de dados sem possibilidade de recuperação.
              </p>

              <div className="space-y-2 mb-8">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Digite <span className="text-red-600 select-none">EXCLUIR</span> para confirmar
                </label>
                <input 
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-slate-300 font-medium text-slate-900"
                  placeholder="EXCLUIR"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirmation('')
                  }}
                  className="flex-1 py-3.5 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-xl font-bold transition-colors order-2 sm:order-1"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'EXCLUIR' || isDeleting}
                  className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 order-1 sm:order-2"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configurações da Conta</h1>
            <p className="text-slate-500 mt-1">Gerencie suas informações e segurança institucional.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-600 transition-colors px-4 py-2 rounded-lg hover:bg-red-50 font-medium border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Sidebar / Left Column */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100/50 backdrop-blur-sm"
            >
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-50">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-100">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg leading-tight">{profile?.full_name || 'Usuário'}</h2>
                  <p className="text-sm text-slate-400 font-medium mt-0.5">{profile?.job_title || 'Membro do Observatório'}</p>
                </div>
              </div>

              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveTab('dados')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'dados' ? 'bg-cyan-50 text-cyan-700 shadow-sm border-cyan-100/50 border' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <User className="w-5 h-5" />
                  Dados Institucionais
                </button>
                <button 
                  onClick={() => setActiveTab('seguranca')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'seguranca' ? 'bg-cyan-50 text-cyan-700 shadow-sm border-cyan-100/50 border' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  Segurança e Privacidade
                </button>
              </nav>

              <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail de Acesso</span>
                </div>
                <p className="text-sm text-slate-600 font-medium truncate">{session?.user.email}</p>
              </div>
            </motion.div>

            {/* Quick Stats or Tips Card */}
            <div className="bg-[#0F172A] rounded-2xl p-6 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cyan-500/20 transition-all duration-700" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold">Privacidade</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Seus dados são protegidos por criptografia de ponta e usados apenas para fins de cooperação técnica institucional.
                </p>
              </div>
            </div>
          </div>

          {/* Main Content / Right Column */}
          <div className="lg:col-span-2 space-y-8">
            
            <AnimatePresence mode="wait">
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-xl flex items-center gap-3 font-medium ${feedback.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}
                >
                  {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                  {feedback.message}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {activeTab === 'dados' ? (
                <motion.div
                  key="dados"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100/50"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center text-cyan-600">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Percurso Institucional</h2>
                      <p className="text-slate-400 text-sm">Informações de contato e atuação organizacional.</p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* ... (Formulário de dados intocado) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Nome Completo</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input 
                            required
                            type="text"
                            name="full_name"
                            value={profile?.full_name || ''}
                            onChange={handleProfileChange}
                            className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Telefone</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input 
                            type="tel"
                            name="phone"
                            value={profile?.phone || ''}
                            onChange={handleProfileChange}
                            className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Município de Sede</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input 
                            required
                            type="text"
                            name="municipality"
                            value={profile?.municipality || ''}
                            onChange={handleProfileChange}
                            className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Como nos conheceu?</label>
                        <select 
                          name="referral_source"
                          value={profile?.referral_source || ''}
                          onChange={handleProfileChange}
                          className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Selecione uma opção...</option>
                          <option value="Redes Sociais">Redes Sociais</option>
                          <option value="Site Institucional">Site Institucional</option>
                          <option value="Indicação de Colega">Indicação de Colega</option>
                          <option value="Evento / Workshop">Evento / Workshop</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Instituição</label>
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input 
                            required
                            type="text"
                            name="institution_organization"
                            value={profile?.institution_organization || ''}
                            onChange={handleProfileChange}
                            className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Tipo de Organização</label>
                        <select 
                          required
                          name="organization_type"
                          value={profile?.organization_type || ''}
                          onChange={handleProfileChange}
                          className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="Governamental">Governamental</option>
                          <option value="Privada">Privada</option>
                          <option value="Privada sem fins lucrativos">Privada sem fins lucrativos</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Cargo</label>
                        <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input 
                            type="text"
                            name="job_title"
                            value={profile?.job_title || ''}
                            onChange={handleProfileChange}
                            className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Relação OTDSP</label>
                        <select 
                          required
                          name="relationship_with_otdsp"
                          value={profile?.relationship_with_otdsp || ''}
                          onChange={handleProfileChange}
                          className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="Visitante">Visitante</option>
                          <option value="Pesquisador">Pesquisador</option>
                          <option value="Voluntário">Voluntário</option>
                          <option value="Aluno">Aluno</option>
                          <option value="Staff">Staff</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        type="submit"
                        disabled={profileLoading}
                        className="w-full md:w-auto px-10 py-3.5 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-cyan-100 hover:shadow-cyan-200 transition-all disabled:opacity-70 group"
                      >
                        {profileLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                        Salvar Alterações
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="seguranca"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100/50"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Segurança e Privacidade</h2>
                      <p className="text-slate-400 text-sm">Gerencie suas credenciais e os direitos sobre seus dados.</p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Senha Atual</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          required
                          type="password"
                          value={passwords.current}
                          onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Nova Senha</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          required
                          type="password"
                          value={passwords.new}
                          onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Confirmar Nova Senha</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                          required
                          type="password"
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="pt-4 pb-4">
                      <button 
                        type="submit"
                        disabled={passwordLoading}
                        className="w-full px-10 py-3.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-orange-100 hover:shadow-orange-200 transition-all disabled:opacity-70 group"
                      >
                        {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                        Atualizar Senha
                      </button>
                    </div>
                  </form>

                  {/* ZONA DE PERIGO (LGPD) */}
                  <div className="mt-12 pt-8 border-t border-slate-100">
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div>
                        <h3 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-2">
                          <Trash2 className="w-5 h-5" />
                          Zona de Perigo
                        </h3>
                        <p className="text-sm text-red-600/80 max-w-xl text-justify leading-relaxed font-medium">
                          Ao prosseguir, todos os seus dados pessoais, credenciais e vínculos profissionais serão permanentemente apagados da base do OTDSP. Esta ação é irreversível.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        type="button"
                        className="shrink-0 px-6 py-3 bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-xl font-bold transition-all shadow-sm"
                      >
                        Excluir minha conta
                      </button>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  )
}