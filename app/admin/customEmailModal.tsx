import React, { useState } from 'react'
import { motion } from 'motion/react'
import { Mail, X, Loader2 } from 'lucide-react'
import { sendSystemEmail } from '@/lib/emailService'

interface CustomEmailModalProps {
  selectedEmails: string[]
  onClose: () => void
  onSuccess: () => void
  onFeedback: (feedback: { type: 'success' | 'error'; message: string }) => void
}

export function CustomEmailModal({ selectedEmails, onClose, onSuccess, onFeedback }: CustomEmailModalProps) {
  const [emailSubject, setEmailSubject] = useState('')
  const [emailHtml, setEmailHtml] = useState('')
  const [emailSending, setEmailSending] = useState(false)

  const handleSendCustomEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedEmails.length === 0 || !emailSubject || !emailHtml) return

    setEmailSending(true)

    try {
      await sendSystemEmail({
        emails: selectedEmails,
        subject: emailSubject,
        htmlContent: emailHtml.replace(/\n/g, '<br />')
      })

      onFeedback({ type: 'success', message: `E-mail enviado com sucesso para ${selectedEmails.length} destinatários!` })
      onSuccess()
      onClose()
    } catch (err: any) {
      onFeedback({ type: 'error', message: err.message || 'Erro ao realizar disparo de e-mails.' })
    } finally {
      setEmailSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Mail className="h-5 w-5 text-cyan-600" />
            Enviar E-mail ({selectedEmails.length} dest.)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSendCustomEmail} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Assunto</label>
            <input 
              type="text" 
              required
              value={emailSubject}
              onChange={e => setEmailSubject(e.target.value)}
              placeholder="Ex: Atualização importante do sistema"
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Mensagem (HTML/Texto)</label>
            <textarea 
              required
              rows={6}
              value={emailHtml}
              onChange={e => setEmailHtml(e.target.value)}
              placeholder="Escreva o conteúdo do e-mail aqui..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 resize-none"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={emailSending}
              className="h-10 flex items-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
            >
              {emailSending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disparar E-mails'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}