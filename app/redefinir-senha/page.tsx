'use client'

import React, { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { motion, AnimatePresence } from 'motion/react'

import {
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

export default function RedefinirSenhaPage() {
  const router = useRouter()

  const [checkingSession, setCheckingSession] =
    useState(true)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState(false)

  const [formData, setFormData] =
    useState({
      password: '',
      confirmPassword: ''
    })

  /*
   * Limpa todas as informações temporárias
   * utilizadas no processo de recuperação.
   */
  const clearRecoveryState = () => {
    if (typeof window === 'undefined') {
      return
    }

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

  /*
   * Esta página NÃO aceita mais:
   *
   * #access_token
   * type=recovery
   * error_description
   *
   * O acesso deve ocorrer somente depois
   * da validação do OTP.
   */
  useEffect(() => {
    let active = true

    const verificarSessaoDeRecuperacao =
      async () => {
        try {
          if (typeof window === 'undefined') {
            return
          }

          const recoveryVerified =
            window.sessionStorage.getItem(
              RECOVERY_VERIFIED_KEY
            ) === 'true'

          const recoveryUserId =
            window.sessionStorage.getItem(
              RECOVERY_USER_ID_KEY
            )

          /*
           * getUser() valida o usuário atual
           * diretamente com o Supabase.
           */
          const {
            data: { user },
            error: userError
          } = await supabase.auth.getUser()

          if (!active) {
            return
          }

          /*
           * Não existe nenhuma sessão autenticada.
           */
          if (userError || !user) {
            clearRecoveryState()

            router.replace('/login')

            return
          }

          /*
           * Existe uma sessão normal,
           * mas ela não pertence a um fluxo
           * de recuperação previamente validado.
           */
          if (
            !recoveryVerified ||
            !recoveryUserId ||
            user.id !== recoveryUserId
          ) {
            clearRecoveryState()

            router.replace('/perfil')

            return
          }

          /*
           * Tudo correto:
           *
           * - há usuário autenticado;
           * - o OTP foi previamente validado;
           * - o usuário autenticado corresponde
           *   ao usuário que validou o OTP.
           */
          setCheckingSession(false)
        } catch (err) {
          console.error(
            'Recovery session verification error:',
            err
          )

          clearRecoveryState()

          router.replace('/login')
        }
      }

    verificarSessaoDeRecuperacao()

    return () => {
      active = false
    }
  }, [router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    /*
     * Remove erros de validação assim que
     * o usuário começa a corrigir os campos.
     */
    setError(null)
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    setError(null)

    /*
     * Validação local antes de chamar
     * o Supabase.
     */
    if (formData.password.length < 6) {
      setError(
        'A senha deve conter pelo menos 6 caracteres.'
      )

      return
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError(
        'As senhas digitadas não coincidem.'
      )

      return
    }

    setLoading(true)

    try {
      if (typeof window === 'undefined') {
        throw new Error(
          'Não foi possível validar a sessão de recuperação.'
        )
      }

      const recoveryVerified =
        window.sessionStorage.getItem(
          RECOVERY_VERIFIED_KEY
        ) === 'true'

      const recoveryUserId =
        window.sessionStorage.getItem(
          RECOVERY_USER_ID_KEY
        )

      /*
       * Validamos novamente imediatamente
       * antes da alteração da senha.
       */
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser()

      if (
        userError ||
        !user ||
        !recoveryVerified ||
        !recoveryUserId ||
        user.id !== recoveryUserId
      ) {
        throw new Error(
          'Sua sessão de recuperação expirou ou não é válida. Solicite um novo código.'
        )
      }

      /*
       * Como o verifyOtp da etapa anterior
       * criou uma sessão autenticada,
       * updateUser pode alterar a senha.
       */
      const {
        error: updateError
      } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (updateError) {
        throw updateError
      }

      /*
       * A senha foi alterada com sucesso.
       * O estado temporário de recovery
       * não é mais necessário.
       */
      clearRecoveryState()

      /*
       * O verifyOtp autentica o usuário.
       *
       * Como queremos levá-lo novamente
       * à tela de Login, encerramos somente
       * esta sessão atual.
       *
       * IMPORTANTE:
       * usamos scope: 'local' para NÃO
       * derrubar sessões do usuário em
       * todos os outros dispositivos.
       */
      const {
        error: signOutError
      } = await supabase.auth.signOut({
        scope: 'local'
      })

      if (signOutError) {
        console.error(
          'Local sign out after password recovery failed:',
          signOutError
        )
      }

      setSuccess(true)

      window.setTimeout(() => {
        /*
         * Se o logout local funcionou,
         * voltamos para o Login.
         *
         * Se por algum motivo ele falhou,
         * o usuário continua autenticado
         * e é enviado ao perfil.
         */
        if (signOutError) {
          router.replace('/perfil')
        } else {
          router.replace(
            '/login?recovery=success'
          )
        }

        router.refresh()
      }, 1500)
    } catch (err: any) {
      console.error(
        'Password update error:',
        err
      )

      setError(
        err?.message ||
          'Ocorreu um erro ao atualizar sua senha. Tente novamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  /*
   * Tela exibida enquanto a sessão
   * de recuperação é validada.
   */
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Decorative Background */}

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-100/30 rounded-full blur-3xl -mr-64 -mt-64 pointer-events-none" />

      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-100/30 rounded-full blur-3xl -ml-64 -mb-64 pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Back Link */}

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-600 transition-colors mb-8 group font-medium"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />

          Voltar para o Login
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
              <Lock className="w-8 h-8" />
            </div>

            <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">
              Redefinir Senha
            </h1>

            <p className="text-slate-500 mt-2 font-medium">
              Informe e confirme sua nova senha de
              acesso.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Nova Senha
              </label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                <input
                  required
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo de 6 caracteres"
                  autoComplete="new-password"
                  className="w-full bg-slate-50 border-slate-200 border rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Confirmar Nova Senha
              </label>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

                <input
                  required
                  type="password"
                  name="confirmPassword"
                  value={
                    formData.confirmPassword
                  }
                  onChange={handleChange}
                  placeholder="Confirme a nova senha"
                  autoComplete="new-password"
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

                  Senha atualizada com sucesso!
                  Redirecionando...
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full h-14 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-cyan-100 hover:shadow-cyan-200 hover:opacity-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />

                  Atualizando...
                </>
              ) : success ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <>
                  Atualizar Senha

                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
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