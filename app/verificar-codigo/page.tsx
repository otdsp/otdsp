'use client'

import React, {
  useEffect,
  useRef,
  useState
} from 'react'

import { useRouter } from 'next/navigation'

import {
  motion,
  AnimatePresence
} from 'motion/react'

import {
  ShieldCheck,
  Mail,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'

import Link from 'next/link'

import { supabase } from '@/lib/supabase'

const OTP_LENGTH = 8

const RESEND_COOLDOWN_SECONDS = 60

const RECOVERY_EMAIL_KEY =
  'password_recovery_email'

const RECOVERY_VERIFIED_KEY =
  'password_recovery_verified'

const RECOVERY_USER_ID_KEY =
  'password_recovery_user_id'

const RECOVERY_SENT_AT_KEY =
  'password_recovery_sent_at'

export default function VerificarCodigoPage() {
  const router = useRouter()

  const inputRefs =
    useRef<Array<HTMLInputElement | null>>([])

  const [checkingRecovery, setCheckingRecovery] =
    useState(true)

  const [email, setEmail] =
    useState('')

  const [otp, setOtp] =
    useState<string[]>(
      Array(OTP_LENGTH).fill('')
    )

  const [loading, setLoading] =
    useState(false)

  const [resendLoading, setResendLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState(false)

  const [resendSuccess, setResendSuccess] =
    useState<string | null>(null)

  const [resendCooldown, setResendCooldown] =
    useState(0)

  /*
   * Limpa o estado temporário de recuperação.
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

    window.sessionStorage.removeItem(
      RECOVERY_SENT_AT_KEY
    )
  }

  /*
   * Mascara parcialmente o e-mail exibido.
   *
   * Exemplo:
   * robson@email.com
   * ro****@email.com
   */
  const maskEmail = (value: string) => {
    const [localPart, domain] =
      value.split('@')

    if (!localPart || !domain) {
      return value
    }

    if (localPart.length <= 2) {
      return `${localPart[0] || ''}***@${domain}`
    }

    const visiblePart =
      localPart.slice(0, 2)

    return `${visiblePart}${'*'.repeat(
      Math.max(3, localPart.length - 2)
    )}@${domain}`
  }

  /*
   * Calcula quanto falta para permitir
   * um novo envio.
   */
  const calculateRemainingCooldown = () => {
    if (typeof window === 'undefined') {
      return 0
    }

    const sentAtValue =
      window.sessionStorage.getItem(
        RECOVERY_SENT_AT_KEY
      )

    if (!sentAtValue) {
      return 0
    }

    const sentAt =
      Number(sentAtValue)

    if (Number.isNaN(sentAt)) {
      return 0
    }

    const elapsedSeconds =
      Math.floor(
        (Date.now() - sentAt) / 1000
      )

    return Math.max(
      0,
      RESEND_COOLDOWN_SECONDS -
        elapsedSeconds
    )
  }

  /*
   * Verifica se existe um fluxo de
   * recuperação iniciado.
   *
   * Sem o e-mail armazenado pelo Login,
   * esta página não deve ser acessada.
   */
  useEffect(() => {
    let active = true

    const initializeRecovery = async () => {
      if (typeof window === 'undefined') {
        return
      }

      const storedEmail =
        window.sessionStorage.getItem(
          RECOVERY_EMAIL_KEY
        )

      if (!storedEmail) {
        router.replace('/login')

        return
      }

      /*
       * Se a recuperação já tiver sido
       * validada anteriormente, verificamos
       * se a sessão ainda corresponde ao
       * usuário do recovery.
       *
       * Isso também trata reloads da página.
       */
      const alreadyVerified =
        window.sessionStorage.getItem(
          RECOVERY_VERIFIED_KEY
        ) === 'true'

      const recoveryUserId =
        window.sessionStorage.getItem(
          RECOVERY_USER_ID_KEY
        )

      if (
        alreadyVerified &&
        recoveryUserId
      ) {
        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (!active) {
          return
        }

        if (
          user &&
          user.id === recoveryUserId
        ) {
          router.replace(
            '/redefinir-senha'
          )

          return
        }

        /*
         * O estado local dizia que estava
         * verificado, mas não existe mais
         * uma sessão válida correspondente.
         */
        window.sessionStorage.removeItem(
          RECOVERY_VERIFIED_KEY
        )

        window.sessionStorage.removeItem(
          RECOVERY_USER_ID_KEY
        )
      }

      setEmail(storedEmail)

      /*
       * Caso a versão atual do Login ainda
       * não tenha gravado o horário do envio,
       * iniciamos a contagem neste momento.
       */
      const existingSentAt =
        window.sessionStorage.getItem(
          RECOVERY_SENT_AT_KEY
        )

      if (!existingSentAt) {
        window.sessionStorage.setItem(
          RECOVERY_SENT_AT_KEY,
          Date.now().toString()
        )
      }

      setResendCooldown(
        calculateRemainingCooldown()
      )

      setCheckingRecovery(false)

      /*
       * Foco automático no primeiro campo.
       */
      window.setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }

    initializeRecovery()

    return () => {
      active = false
    }
  }, [router])

  /*
   * Contagem regressiva para reenvio.
   */
  useEffect(() => {
    if (
      checkingRecovery ||
      resendCooldown <= 0
    ) {
      return
    }

    const interval =
      window.setInterval(() => {
        const remaining =
          calculateRemainingCooldown()

        setResendCooldown(remaining)

        if (remaining <= 0) {
          window.clearInterval(interval)
        }
      }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [
    checkingRecovery,
    resendCooldown
  ])

  /*
   * Preenche vários campos de uma vez.
   *
   * Isso permite:
   * - colar o código completo;
   * - autofill do navegador;
   * - autofill do sistema operacional.
   */
  const fillOtp = (
    digits: string,
    startIndex = 0
  ) => {
    const sanitized =
      digits.replace(/\D/g, '')

    if (!sanitized) {
      return
    }

    const newOtp = [...otp]

    let currentIndex = startIndex

    for (
      let i = 0;
      i < sanitized.length &&
      currentIndex < OTP_LENGTH;
      i += 1
    ) {
      newOtp[currentIndex] =
        sanitized[i]

      currentIndex += 1
    }

    setOtp(newOtp)
    setError(null)
    setResendSuccess(null)

    const nextEmptyIndex =
      newOtp.findIndex(
        value => value === ''
      )

    if (nextEmptyIndex >= 0) {
      inputRefs.current[
        nextEmptyIndex
      ]?.focus()
    } else {
      inputRefs.current[
        OTP_LENGTH - 1
      ]?.focus()
    }
  }

  const handleOtpChange = (
    index: number,
    value: string
  ) => {
    const digits =
      value.replace(/\D/g, '')

    /*
     * Alguns navegadores podem inserir
     * todo o código no primeiro input
     * através de autofill.
     */
    if (digits.length > 1) {
      fillOtp(digits, index)

      return
    }

    const newOtp = [...otp]

    newOtp[index] =
      digits.slice(-1)

    setOtp(newOtp)
    setError(null)
    setResendSuccess(null)

    if (
      digits &&
      index < OTP_LENGTH - 1
    ) {
      inputRefs.current[
        index + 1
      ]?.focus()
    }
  }

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    /*
     * Backspace em campo vazio:
     * volta ao campo anterior.
     */
    if (
      e.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      const newOtp = [...otp]

      newOtp[index - 1] = ''

      setOtp(newOtp)

      inputRefs.current[
        index - 1
      ]?.focus()

      return
    }

    /*
     * Seta para esquerda.
     */
    if (
      e.key === 'ArrowLeft' &&
      index > 0
    ) {
      e.preventDefault()

      inputRefs.current[
        index - 1
      ]?.focus()
    }

    /*
     * Seta para direita.
     */
    if (
      e.key === 'ArrowRight' &&
      index < OTP_LENGTH - 1
    ) {
      e.preventDefault()

      inputRefs.current[
        index + 1
      ]?.focus()
    }
  }

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault()

    const pastedValue =
      e.clipboardData.getData('text')

    fillOtp(pastedValue, 0)
  }

  /*
   * Validação do código junto ao Supabase.
   */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    setError(null)
    setResendSuccess(null)

    const token =
      otp.join('')

    if (
      token.length !== OTP_LENGTH
    ) {
      setError(
        `Digite os ${OTP_LENGTH} dígitos do código de verificação.`
      )

      const firstEmpty =
        otp.findIndex(
          digit => !digit
        )

      if (firstEmpty >= 0) {
        inputRefs.current[
          firstEmpty
        ]?.focus()
      }

      return
    }

    if (!email) {
      setError(
        'Não foi possível identificar o e-mail da recuperação. Solicite um novo código.'
      )

      return
    }

    setLoading(true)

    try {
      /*
       * Esta chamada efetivamente valida
       * o código no servidor do Supabase.
       *
       * type: 'recovery' indica que o código
       * pertence ao fluxo de recuperação
       * de senha.
       */
      const {
        data,
        error: verificationError
      } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery'
      })

      if (verificationError) {
        console.error(
          'Recovery OTP verification error:',
          verificationError
        )

        throw new Error(
          'Código inválido ou expirado. Verifique o código informado ou solicite um novo.'
        )
      }

      /*
       * Não basta receber error: null.
       *
       * Exigimos que o Supabase tenha
       * efetivamente criado:
       *
       * - uma sessão;
       * - um usuário autenticado.
       */
      if (
        !data.session ||
        !data.user
      ) {
        throw new Error(
          'Não foi possível criar uma sessão segura para redefinir sua senha. Solicite um novo código.'
        )
      }

      /*
       * Este estado serve para controlar
       * a navegação da interface.
       *
       * A segurança real continua sendo
       * fornecida pela sessão autenticada
       * criada pelo Supabase.
       */
      if (
        typeof window !== 'undefined'
      ) {
        window.sessionStorage.setItem(
          RECOVERY_VERIFIED_KEY,
          'true'
        )

        window.sessionStorage.setItem(
          RECOVERY_USER_ID_KEY,
          data.user.id
        )
      }

      setSuccess(true)

      /*
       * Pequena pausa somente para mostrar
       * o feedback visual de sucesso.
       */
      window.setTimeout(() => {
        router.replace(
          '/redefinir-senha'
        )
      }, 900)
    } catch (err: any) {
      console.error(
        'OTP verification error:',
        err
      )

      setError(
        err?.message ||
          'Não foi possível verificar o código. Tente novamente.'
      )

      /*
       * Seleciona novamente o primeiro campo
       * para facilitar uma nova tentativa.
       */
      setOtp(
        Array(OTP_LENGTH).fill('')
      )

      window.setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 50)
    } finally {
      setLoading(false)
    }
  }

  /*
   * Solicita um novo código de recuperação.
   */
  const handleResendCode =
    async () => {
      if (
        resendCooldown > 0 ||
        resendLoading ||
        !email
      ) {
        return
      }

      setError(null)
      setResendSuccess(null)

      setResendLoading(true)

      try {
        const {
          error: resendError
        } =
          await supabase.auth.resetPasswordForEmail(
            email
          )

        if (resendError) {
          console.error(
            'Recovery OTP resend error:',
            resendError
          )

          if (
            resendError.status === 429
          ) {
            throw new Error(
              'Aguarde alguns instantes antes de solicitar outro código.'
            )
          }

          throw new Error(
            'Não foi possível enviar um novo código. Tente novamente.'
          )
        }

        /*
         * O novo código invalida a tentativa
         * anterior do ponto de vista da interface.
         */
        if (
          typeof window !== 'undefined'
        ) {
          window.sessionStorage.removeItem(
            RECOVERY_VERIFIED_KEY
          )

          window.sessionStorage.removeItem(
            RECOVERY_USER_ID_KEY
          )

          window.sessionStorage.setItem(
            RECOVERY_SENT_AT_KEY,
            Date.now().toString()
          )
        }

        setOtp(
          Array(OTP_LENGTH).fill('')
        )

        setResendCooldown(
          RESEND_COOLDOWN_SECONDS
        )

        setResendSuccess(
          'Novo código enviado. Verifique sua caixa de entrada.'
        )

        window.setTimeout(() => {
          inputRefs.current[0]?.focus()
        }, 50)
      } catch (err: any) {
        console.error(
          'OTP resend error:',
          err
        )

        setError(
          err?.message ||
            'Não foi possível reenviar o código. Tente novamente.'
        )
      } finally {
        setResendLoading(false)
      }
    }

  /*
   * Permite cancelar o processo e
   * informar outro e-mail no Login.
   */
  const handleUseAnotherEmail =
    () => {
      clearRecoveryState()

      router.replace('/login')
    }

  /*
   * Formata o contador:
   *
   * 60 -> 01:00
   * 45 -> 00:45
   */
  const formatCooldown = (
    seconds: number
  ) => {
    const minutes =
      Math.floor(seconds / 60)

    const remainingSeconds =
      seconds % 60

    return `${String(minutes).padStart(
      2,
      '0'
    )}:${String(
      remainingSeconds
    ).padStart(2, '0')}`
  }

  /*
   * Enquanto verificamos se existe
   * um fluxo de recuperação iniciado,
   * mostramos apenas o loader.
   */
  if (checkingRecovery) {
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

          {/* Header */}

          <div className="text-center mb-10">

            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-100 mx-auto mb-6">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">
              Verificar Código
            </h1>

            <p className="text-slate-500 mt-2 font-medium leading-relaxed">
              Digite o código de 8 dígitos enviado para seu e-mail.
            </p>

          </div>

          {/* E-mail */}

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3 mb-8">

            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-cyan-600" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Código enviado para
              </p>

              <p className="text-sm font-bold text-slate-700 truncate mt-0.5">
                {maskEmail(email)}
              </p>
            </div>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* OTP */}

            <div className="space-y-3">

              <label className="block text-sm font-semibold text-slate-700 text-center">
                Código de verificação
              </label>

              <div className="grid grid-cols-8 gap-1.5 sm:gap-2 w-full">

                {otp.map(
                  (digit, index) => (
                    <input
                      key={index}
                      ref={element => {
                        inputRefs.current[
                          index
                        ] = element
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      autoComplete={
                        index === 0
                          ? 'one-time-code'
                          : 'off'
                      }
                      value={digit}
                      disabled={
                        loading ||
                        success
                      }
                      onChange={e =>
                        handleOtpChange(
                          index,
                          e.target.value
                        )
                      }
                      onKeyDown={e =>
                        handleOtpKeyDown(
                          index,
                          e
                        )
                      }
                      onPaste={
                        handlePaste
                      }
                      aria-label={`Dígito ${
                        index + 1
                      } do código`}
                      className="
                        w-full min-w-0 h-14
                        sm:h-16
                        text-center
                        text-lg sm:text-xl
                        font-bold
                        text-[#0F172A]
                        bg-slate-50
                        border border-slate-200
                        rounded-xl
                        outline-none
                        transition-all
                        focus:bg-white
                        focus:border-cyan-400
                        focus:ring-2
                        focus:ring-cyan-500/20
                        disabled:opacity-60
                        "
                    />
                  )
                )}

              </div>

              <p className="text-center text-xs text-slate-400 font-medium">
                Você também pode colar o código completo.
              </p>

            </div>

            {/* Error */}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{
                    opacity: 0,
                    x: -10,
                    height: 0
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    height: 'auto'
                  }}
                  exit={{
                    opacity: 0,
                    height: 0
                  }}
                  className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 text-red-600 text-sm font-medium overflow-hidden"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

                  <span>
                    {error}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resend Success */}

            <AnimatePresence>
              {resendSuccess && (
                <motion.div
                  initial={{
                    opacity: 0,
                    x: -10,
                    height: 0
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    height: 'auto'
                  }}
                  exit={{
                    opacity: 0,
                    height: 0
                  }}
                  className="bg-[#ECFEFF] border border-[#CFFAFE] p-4 rounded-xl flex items-start gap-3 text-[#0E7490] text-sm font-medium overflow-hidden"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-[#0891B2] mt-0.5" />

                  <span>
                    {resendSuccess}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verification Success */}

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

                  Código confirmado! Redirecionando...
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Button */}

            <button
              type="submit"
              disabled={
                loading ||
                success ||
                resendLoading
              }
              className="w-full h-14 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-cyan-100 hover:shadow-cyan-200 hover:opacity-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />

                  Verificando...
                </>
              ) : success ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <>
                  Verificar Código

                  <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

          </form>

          {/* Resend */}

          <div className="mt-8 pt-7 border-t border-slate-100 text-center">

            <p className="text-sm text-slate-500 font-medium">
              Não recebeu o código?
            </p>

            <button
              type="button"
              onClick={
                handleResendCode
              }
              disabled={
                resendCooldown > 0 ||
                resendLoading ||
                loading ||
                success
              }
              className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-bold text-cyan-600 hover:text-cyan-700 transition-colors disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {resendLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />

                  Reenviando...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4" />

                  Reenviar código em{' '}
                  {formatCooldown(
                    resendCooldown
                  )}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />

                  Reenviar código
                </>
              )}
            </button>

            <div className="mt-5">

              <button
                type="button"
                onClick={
                  handleUseAnotherEmail
                }
                disabled={
                  loading ||
                  resendLoading ||
                  success
                }
                className="text-xs font-semibold text-slate-400 hover:text-cyan-600 transition-colors disabled:opacity-50"
              >
                Usar outro e-mail
              </button>

            </div>

          </div>

        </motion.div>

        {/* Footer */}

        <p className="text-center text-slate-400 text-xs mt-8 px-4 leading-relaxed font-medium">
          Acesso restrito para parceiros institucionais do Observatório de Transformação Digital do Estado de São Paulo.
        </p>

      </div>

    </div>
  )
}