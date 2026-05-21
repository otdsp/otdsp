'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Briefcase, 
  Building2, 
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Home,
  Building
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

/**
 * Registration Page component for the OTDSP app.
 */
export default function CadastroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/perfil')
      }
    }
    checkSession()
  }, [router])

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    municipality: '',
    institution_organization: '',
    organization_type: '',
    job_title: '',
    relationship_with_otdsp: '',
    referral_source: ''
  })

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (formData.organization_type === '') {
      setError('Por favor, selecione o tipo de organização.')
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
            municipality: formData.municipality,
            institution_organization: formData.institution_organization,
            organization_type: formData.organization_type,
            job_title: formData.job_title,
            relationship_with_otdsp: formData.relationship_with_otdsp,
            referral_source: formData.referral_source
          }
        }
      })
      
      if (error) throw error

      const user = data.user
      if (user) {
        // Try to insert/upsert into user_auth (using upsert to avoid primary key conflict if trigger executed)
        const { error: authTableError } = await supabase
          .from('user_auth')
          .upsert({
            id: user.id,
            email: user.email,
            is_staff: false,
            is_active: true,
          })
        
        if (authTableError) console.error('Error in user_auth upsert:', authTableError)

        // Try to insert/upsert into user_profile (using upsert to avoid primary key conflict if trigger executed)
        const { error: profileTableError } = await supabase
          .from('user_profile')
          .upsert({
            user_id: user.id,
            full_name: formData.full_name,
            phone: formData.phone,
            municipality: formData.municipality,
            institution_organization: formData.institution_organization,
            organization_type: formData.organization_type,
            job_title: formData.job_title,
            relationship_with_otdsp: formData.relationship_with_otdsp,
            referral_source: formData.referral_source
          })
        
        if (profileTableError) console.error('Error in user_profile upsert:', profileTableError)
      }

      setSuccess(true)
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Ocorreu um erro durante o cadastro. Verifique os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-12 text-center border border-slate-100"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Seja Bem-vindo(a)!</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Seu cadastro no Observatório de Transformação Digital foi realizado com sucesso. Explore as ferramentas e dados disponíveis no seu espaço exclusivo.
          </p>
          <div className="space-y-4">
            <Link 
              href="/perfil"
              className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-200 transition-all shadow-md"
            >
              <User className="w-5 h-5" />
              Acessar Meu Perfil
            </Link>
            <Link 
              href="/"
              className="inline-block text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
            >
              Voltar para o início
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pt-32 pb-12 px-4 font-sans relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100/30 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl -ml-48 -mb-48 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight mb-3">Faça Parte do Observatório</h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
            Transformação Digital de São Paulo: Inovação, Dados e Estratégia em um só lugar.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-md rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white p-8 md:p-12"
        >
          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* Section: Dados de Acesso */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Dados de Acesso</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">E-mail Institucional</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@instituicao.sp.gov.br"
                      className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      required
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Dados Pessoais */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                  <User className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Dados Pessoais</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      required
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Digite seu nome completo"
                      className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Telefone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(11) 99999-9999"
                      className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Localização e Indicação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Localização</h2>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Município de Sede</label>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      required
                      type="text"
                      name="municipality"
                      value={formData.municipality}
                      onChange={handleChange}
                      placeholder="Ex: São Paulo, Campinas, Santos"
                      className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                    <User className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Indicação</h2>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Como nos conheceu?</label>
                  <div className="relative">
                    <select 
                      name="referral_source"
                      value={formData.referral_source}
                      onChange={handleChange}
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
              </div>
            </div>

            {/* Section: Atuação Profissional */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Atuação Profissional</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Instituição / Organização</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      required
                      type="text"
                      name="institution_organization"
                      value={formData.institution_organization}
                      onChange={handleChange}
                      placeholder="Ex: Secretaria da Fazenda, USP, Empresa X"
                      className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Tipo de Organização</label>
                  <div className="relative">
                    <select 
                      required
                      name="organization_type"
                      value={formData.organization_type}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Selecione o tipo...</option>
                      <option value="Governamental">Governamental</option>
                      <option value="Privada">Privada</option>
                      <option value="Privada sem fins lucrativos">Privada sem fins lucrativos</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Cargo / Função</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text"
                      name="job_title"
                      value={formData.job_title}
                      onChange={handleChange}
                      placeholder="Ex: Gestor de Projetos, Pesquisador"
                      className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Relação com o OTDSP</label>
                  <div className="relative">
                    <select 
                      required
                      name="relationship_with_otdsp"
                      value={formData.relationship_with_otdsp}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Selecione uma opção</option>
                      <option value="Visitante">Visitante</option>
                      <option value="Pesquisador">Pesquisador</option>
                      <option value="Voluntário">Voluntário</option>
                      <option value="Aluno">Aluno</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-cyan-500 to-orange-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-cyan-200 hover:shadow-cyan-100 hover:opacity-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Realizando Cadastro...
                  </>
                ) : (
                  <>
                    Confirmar Cadastro
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
