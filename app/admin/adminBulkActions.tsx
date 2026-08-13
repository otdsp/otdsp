import React from 'react'
import { motion } from 'motion/react'
import { Users, Mail, Loader2, Power, Trash2 } from 'lucide-react'

interface AdminBulkActionsProps {
  selectedCount: number
  missingDataCount: number
  loading: boolean
  onSendMissingDataEmails: () => void
  onOpenCustomEmailModal: () => void
  onToggleStatus: () => void
  onDelete: () => void
}

export function AdminBulkActions({
  selectedCount,
  missingDataCount,
  loading,
  onSendMissingDataEmails,
  onOpenCustomEmailModal,
  onToggleStatus,
  onDelete
}: AdminBulkActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-3 rounded-2xl bg-cyan-900 p-4 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="flex items-center gap-2 font-semibold">
        <Users className="h-5 w-5 text-cyan-300" />
        {selectedCount} usuário(s) selecionado(s)
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSendMissingDataEmails}
          disabled={loading || missingDataCount === 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          E-mails para dados ausentes ({missingDataCount})
        </button>
        <button
          onClick={onOpenCustomEmailModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-bold transition-colors hover:bg-cyan-600"
        >
          <Mail className="h-4 w-4" /> E-mail Customizado
        </button>
        <button
          type="button"
          onClick={onToggleStatus}
          disabled={loading || selectedCount === 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
          Desativar/Ativar
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={loading || selectedCount === 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Deletar
        </button>
      </div>
    </motion.div>
  )
}