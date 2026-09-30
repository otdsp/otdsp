'use client'

import type {
  ChangeEvent,
  ComponentType,
  Dispatch,
  FormEvent,
  RefObject,
  SetStateAction
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Briefcase,
  CheckCircle,
  Heart,
  Loader2,
  Monitor,
  Trash2,
  Users
} from 'lucide-react'
import { ParticipantManager } from '@/components/ParticipantManager'
import type { Participant } from '@/types/engagement'
import {
  EngagementEvidenceSection,
  type EngagementEvidence
} from './EngagementEvidenceSection'

const INTEREST_OPTIONS = [
  'Educação',
  'Saúde',
  'Segurança',
  'Meio Ambiente',
  'Infraestutura de TI'
]

const TECH_OPTIONS = [
  '5G',
  'IA',
  'Open hardware',
  'Open Semi Condoctors',
  'Computação Quântica',
  'Internet das coisas (IoT)',
  'Manufatura Aditiva'
]

const POLICY_OPTIONS = [
  'Igualdade de gênero',
  'Igualdade racial',
  'Acessibilidade'
]

const ACTIVITY_OPTIONS = [
  'Pitch Inicial',
  'Apresentação do Showroom',
  'Apresentação Institucional do OTDSP',
  'Reunião de Plano de Trabalho',
  'Reunião de Adesão ao Convênio'
]

const LOCATION_OPTIONS = ['Remoto', 'Inova USP']

type ArrayField =
  | 'horizontal'
  | 'vertical'
  | 'transversal'
  | 'planned_activities'

export type EngagementFormData = {
  title: string
  description: string
  event_date: string
  location: string
  status: string
  feedback: string
  estimated_duration: string
  horizontal: string[]
  vertical: string[]
  transversal: string[]
  planned_activities: string[]
  participants: Participant[]
}

type EngagementFormProps = {
  showForm: boolean
  editingId: string | null
  isStaff: boolean
  isSubmitting: boolean
  isFormLocked: boolean
  isEvidenceUploading: boolean
  canFilterParticipants: boolean
  formData: EngagementFormData
  setFormData: Dispatch<SetStateAction<EngagementFormData>>
  handleInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  toggleArrayItem: (field: ArrayField, item: string) => void
  handleSubmit: (event: FormEvent) => void | Promise<void>
  handleDelete: () => void | Promise<void>
  closeDetails: () => void
  evidences: EngagementEvidence[]
  pendingEvidenceFiles: File[]
  openingEvidenceId: string | null
  pendingEvidenceDeletionIds: string[]
  evidenceInputRef: RefObject<HTMLInputElement | null>
  getEvidencePreviewUrl: (evidence: EngagementEvidence) => Promise<string | null>
  handleOpenEvidence: (evidence: EngagementEvidence) => void | Promise<void>
  toggleEvidenceDeletion: (evidenceId: string) => void
  handleEvidenceFileSelection: (event: ChangeEvent<HTMLInputElement>) => void
  removePendingEvidenceFile: (index: number) => void
}

export function EngagementForm({
  showForm,
  editingId,
  isStaff,
  isSubmitting,
  isFormLocked,
  isEvidenceUploading,
  canFilterParticipants,
  formData,
  setFormData,
  handleInputChange,
  toggleArrayItem,
  handleSubmit,
  handleDelete,
  closeDetails,
  evidences,
  pendingEvidenceFiles,
  openingEvidenceId,
  pendingEvidenceDeletionIds,
  evidenceInputRef,
  getEvidencePreviewUrl,
  handleOpenEvidence,
  toggleEvidenceDeletion,
  handleEvidenceFileSelection,
  removePendingEvidenceFile
}: EngagementFormProps) {
  return (
    <AnimatePresence>
      {showForm && (
        <motion.div
          initial={{
            opacity: 0,
            y: -20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          exit={{
            opacity: 0,
            y: -20
          }}
          className="mb-12"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-100 mt-8">
            {/* Cabeçalho do Formulário */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-10 pb-8 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                    {editingId
                      ? 'Detalhes do Engajamento'
                      : 'Novo Engajamento'}
                  </h2>
                </div>

                <p className="text-sm text-slate-500">
                  {editingId
                    ? isStaff
                      ? 'Edite os dados diretamente e salve as alterações ao finalizar.'
                      : 'Você pode consultar todas as informações.'
                    : 'Preencha os dados para cadastrar um novo engajamento.'}
                </p>
              </div>

              {editingId && isStaff && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={
                    !isStaff ||
                    isSubmitting
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-10"
            >
              <fieldset
                disabled={isFormLocked}
                className={`space-y-10 ${
                  isFormLocked
                    ? 'opacity-75'
                    : ''
                }`}
              >
                {/* Seção 1: Dados Principais e Logística */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">
                      Título da Atividade
                    </label>

                    <input
                      required
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="col-span-1 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">
                      Data e Hora
                    </label>

                    <input
                      required
                      type="datetime-local"
                      name="event_date"
                      value={
                        formData.event_date
                      }
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 focus:ring-2 focus:ring-cyan-500 outline-none disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="col-span-1 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">
                      Localização
                    </label>

                    <select
                      name="location"
                      value={
                        formData.location
                      }
                      onChange={
                        handleInputChange
                      }
                      className="w-full h-[58px] bg-slate-50 border border-slate-200 rounded-xl px-5 focus:ring-2 focus:ring-cyan-500 outline-none disabled:cursor-not-allowed"
                    >
                      <option value="">
                        Selecione...
                      </option>

                      {LOCATION_OPTIONS.map(
                        (loc) => (
                          <option
                            key={loc}
                            value={loc}
                          >
                            {loc}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="col-span-1 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">
                      Duração (Horas)
                    </label>

                    <input
                      type="number"
                      name="estimated_duration"
                      value={
                        formData.estimated_duration
                      }
                      onChange={
                        handleInputChange
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 disabled:cursor-not-allowed"
                    />
                  </div>

                  {editingId && (
                    <div className="col-span-1 space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">
                        Status do Engajamento
                      </label>

                      <select
                        name="status"
                        value={
                          formData.status
                        }
                        onChange={
                          handleInputChange
                        }
                        className="w-full h-[58px] bg-slate-50 border border-slate-200 rounded-xl px-5 focus:ring-2 focus:ring-cyan-500 outline-none font-medium cursor-pointer disabled:cursor-not-allowed"
                      >
                        <option value="Planejado">
                          Planejado
                        </option>

                        <option value="Pendente">
                          Pendente
                        </option>

                        <option value="Cancelado">
                          Cancelado
                        </option>

                        <option value="Concluído">
                          Concluído
                        </option>
                      </select>
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2">
                    <label className="text-sm font-semibold text-slate-700 ml-1">
                      Descrição
                    </label>

                    <textarea
                      name="description"
                      value={
                        formData.description
                      }
                      onChange={
                        handleInputChange
                      }
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none resize-none disabled:cursor-not-allowed"
                    />
                  </div>

                  {editingId &&
                    isStaff && (
                      <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2">
                        <label className="text-sm font-bold text-cyan-700 ml-1">
                          Anotações Internas /
                          Feedback (Apenas
                          Staff)
                        </label>

                        <textarea
                          name="feedback"
                          value={
                            formData.feedback
                          }
                          onChange={
                            handleInputChange
                          }
                          placeholder="Notas exclusivas da equipe de gestão..."
                          rows={2}
                          className="w-full bg-cyan-50/30 border border-cyan-100 rounded-xl py-4 px-5 focus:ring-2 focus:ring-cyan-500 outline-none resize-none font-medium disabled:cursor-not-allowed"
                        />
                      </div>
                    )}
                </div>

                {/* Seção 2: Tags e Categorias */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-8 mt-10 border-y border-slate-100">
                  <BadgeToggleList
                    label="Verticais"
                    icon={Heart}
                    options={
                      INTEREST_OPTIONS
                    }
                    selected={
                      formData.vertical
                    }
                    onToggle={(
                      item: string
                    ) =>
                      toggleArrayItem(
                        'vertical',
                        item
                      )
                    }
                  />

                  <BadgeToggleList
                    label="Horizontais"
                    icon={Monitor}
                    options={TECH_OPTIONS}
                    selected={
                      formData.horizontal
                    }
                    onToggle={(
                      item: string
                    ) =>
                      toggleArrayItem(
                        'horizontal',
                        item
                      )
                    }
                  />

                  <BadgeToggleList
                    label="Transversais"
                    icon={Briefcase}
                    options={
                      POLICY_OPTIONS
                    }
                    selected={
                      formData.transversal
                    }
                    onToggle={(
                      item: string
                    ) =>
                      toggleArrayItem(
                        'transversal',
                        item
                      )
                    }
                  />

                  <BadgeToggleList
                    label="Atividades"
                    icon={Users}
                    options={
                      ACTIVITY_OPTIONS
                    }
                    selected={
                      formData.planned_activities
                    }
                    onToggle={(
                      item: string
                    ) =>
                      toggleArrayItem(
                        'planned_activities',
                        item
                      )
                    }
                  />
                </div>
              </fieldset>

              {/* Seção 3: Participantes */}
              <div className="space-y-3 pt-8 mt-8 border-t border-slate-100">
                <div className="flex flex-col mb-4">
                  <label className="text-lg font-bold text-slate-800 ml-1">
                    Convidar e Gerenciar
                    Participantes
                  </label>
                </div>

                <div className="bg-slate-50/50 rounded-2xl p-4 sm:p-6 border border-slate-100">
                  <ParticipantManager
                    participants={
                      formData.participants
                    }
                    isStaff={isStaff}
                    canFilter={
                      canFilterParticipants
                    }
                    onChange={(
                      newParticipants
                    ) => {
                      if (!isFormLocked) {
                        setFormData(
                          (prev) => ({
                            ...prev,
                            participants:
                              newParticipants
                          })
                        )
                      }
                    }}
                  />
                </div>
              </div>

              <EngagementEvidenceSection
                editingId={editingId}
                isStaff={isStaff}
                isSubmitting={isSubmitting}
                isEvidenceUploading={isEvidenceUploading}
                evidences={evidences}
                pendingEvidenceFiles={pendingEvidenceFiles}
                openingEvidenceId={openingEvidenceId}
                pendingEvidenceDeletionIds={pendingEvidenceDeletionIds}
                evidenceInputRef={evidenceInputRef}
                getEvidencePreviewUrl={getEvidencePreviewUrl}
                handleOpenEvidence={handleOpenEvidence}
                toggleEvidenceDeletion={toggleEvidenceDeletion}
                handleEvidenceFileSelection={handleEvidenceFileSelection}
                removePendingEvidenceFile={removePendingEvidenceFile}
              />

              {/* Botões de Ação */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4">
                <button
                  type="button"
                  onClick={closeDetails}
                  className="px-6 py-4 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-colors"
                >
                  {editingId
                    ? 'Fechar'
                    : 'Descartar'}
                </button>

                {!isFormLocked && (
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      isEvidenceUploading ||
                      isFormLocked
                    }
                    className="bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-4 px-12 rounded-xl shadow-xl flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
                  >
                    {isSubmitting ||
                    isEvidenceUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}

                    {isEvidenceUploading
                      ? 'Enviando arquivos...'
                      : editingId
                        ? 'Salvar Alterações'
                        : 'Confirmar Planejamento'}
                  </button>
                )}  
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

type BadgeToggleListProps = {
  options: string[]
  selected: string[]
  onToggle: (option: string) => void
  label: string
  icon: ComponentType<{ className?: string }>
}

function BadgeToggleList({
  options,
  selected,
  onToggle,
  label,
  icon: Icon
}: BadgeToggleListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1">
        <Icon className="w-4 h-4 text-slate-400" />
        {label}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isActive = selected.includes(opt)

          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isActive
                  ? 'bg-[#0F172A] border-[#0F172A] text-white'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}