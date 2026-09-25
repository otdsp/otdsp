'use client'

import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { motion, AnimatePresence } from 'motion/react'

import {
  User,
  Mail,
  Lock,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react'

import Link from 'next/link'

import { supabase } from '@/lib/supabase'

const RECOVERY_EMAIL_KEY = 'password_recovery_email'
const RECOVERY_VERIFIED_KEY = 'password_recovery_verified'
const RECOVERY_USER_ID_KEY = 'password_recovery_user_id'
const RECOVERY_SENT_AT_KEY = 'password_recovery_sent_at'

export default function LoginPage() {
  const router = useRouter()

  const [loginLoading, setLoginLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [resetSuccess, setResetSuccess] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  /*
   * Se já houver uma sessão normal ativa,
   * não há necessidade de permanecer na tela de login.
   */
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (session) {
        router.push('/perfil')
      }
    }

    checkSession()
  }, [router])

  /*
   * Mensagem mostrada depois de uma redefinição
   * concluída com sucesso.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

    const searchParams = new URLSearchParams(window.location.search)

    if (searchParams.get('recovery') === 'success') {
      const timer = window.setTimeout(() => {
        setInfoMessage(
          'Sua senha foi redefinida com sucesso! Você já pode fazer login com sua nova senha.'
        )
      }, 0)

      return () => window.clearTimeout(timer)
    }
  }, [])

  const handleResetPassword = async () => {
    setError(null)
    setResetSuccess(null)
    setInfoMessage(null)

    const email = formData.email.trim().toLowerCase()

    if (!email) {
      setError(
        'Por favor, informe seu e-mail para receber o código de recuperação de senha.'
      )

      return
    }

    setResetLoading(true)

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email)

      if (resetError) {
        throw resetError
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          RECOVERY_EMAIL_KEY,
          email
        )

        window.sessionStorage.setItem(
          RECOVERY_SENT_AT_KEY,
          Date.now().toString()
        )

        window.sessionStorage.removeItem(
          RECOVERY_VERIFIED_KEY
        )

        window.sessionStorage.removeItem(
          RECOVERY_USER_ID_KEY
        )
      }

      router.push('/verificar-codigo')

    } catch (err: any) {
      console.error('Password reset error:', err)

      setError(
        err?.message ||
          'Não foi possível solicitar a recuperação de senha. Tente novamente.'
      )
    } finally {
      setResetLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    setError(null)

    if (name === 'email') {
      setResetSuccess(null)
    }
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    setLoginLoading(true)

    setError(null)
    setResetSuccess(null)
    setInfoMessage(null)

    try {
      const email = formData.email
        .trim()
        .toLowerCase()

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password: formData.password
        })

      if (loginError) {
        throw loginError
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(
          RECOVERY_EMAIL_KEY
        )

        window.sessionStorage.removeItem(
          RECOVERY_VERIFIED_KEY
        )

        window.sessionStorage.removeItem(
          RECOVERY_USER_ID_KEY
        )
      }

      setSuccess(true)

      window.setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      console.error('Login error:', err)

      setError(
        err?.message ||
          'Credenciais inválidas. Tente novamente.'
      )
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Decorative Background */}

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-100/30 rounded-full blur-3xl -mr-64 -mt-64 pointer-events-none" />

      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-100/30 rounded-full blur-3xl -ml-64 -mb-64 pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Back Link */}

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-600 transition-colors mb-8 group font-medium"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />

          Voltar para o Início
        </Link>

        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white p-10 md:p-12"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-100 mx-auto mb-6">
              <User className="w-8 h-8" />
            </div>

            <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">
              Acesso ao Painel
            </h1>

            <p className="text-slate-500 mt-2 font-medium">
              Bem-vindo de volta ao Observatório.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                E-mail Institucional
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className="w-full bg-slate-50 border-slate-200 border rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-700">
                  Senha
                </label>

                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={
                    resetLoading ||
                    loginLoading ||
                    success
                  }
                  className="text-xs font-bold text-cyan-600 hover:text-cyan-700 cursor-pointer focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {resetLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}

                  {resetLoading
                    ? 'Enviando código...'
                    : 'Esqueci minha senha'}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                <input
                  required
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border-slate-200 border rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  x: -10
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />

                {error}
              </motion.div>
            )}

            {resetSuccess && (
              <motion.div
                initial={{
                  opacity: 0,
                  x: -10
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                className="bg-[#ECFEFF] border border-[#CFFAFE] p-4 rounded-xl flex items-center gap-3 text-[#0E7490] text-sm font-medium"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#0891B2]" />

                {resetSuccess}
              </motion.div>
            )}

            {infoMessage && (
              <motion.div
                initial={{
                  opacity: 0,
                  x: -10
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3 text-green-700 text-sm font-medium"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />

                {infoMessage}
              </motion.div>
            )}

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{
                    opacity: 0,
                    height: 0
                  }}
                  animate={{
                    opacity: 1,
                    height: 'auto'
                  }}
                  className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3 text-green-600 text-sm font-medium overflow-hidden"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0" />

                  Acesso autorizado! Redirecionando...
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={
                loginLoading ||
                resetLoading ||
                success
              }
              className="w-full h-14 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-cyan-100 hover:shadow-cyan-200 hover:opacity-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />

                  Verificando...
                </>
              ) : success ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <>
                  Entrar no Sistema

                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm font-medium">
              Ainda não é membro?{' '}

              <Link
                href="/cadastro"
                className="text-cyan-600 hover:text-cyan-700 font-bold"
              >
                Crie sua conta aqui
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer Info */}

        <p className="text-center text-slate-400 text-xs mt-8 px-4 leading-relaxed font-medium">
          Acesso restrito para parceiros institucionais
          do Observatório de Transformação Digital do
          Estado de São Paulo.
        </p>
      </div>
    </div>
  )
}