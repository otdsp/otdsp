'use client'

import { useEffect, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, RefObject } from 'react'
import {
  FileText,
  Loader2,
  Paperclip,
  RotateCcw,
  Trash2,
  UploadCloud,
  X
} from 'lucide-react'

export type EngagementEvidence = {
  id: string
  engagement_id: string
  storage_path: string
  original_name: string
  mime_type: string | null
  file_size: number | null
  uploaded_by: string | null
  created_at: string | null
}

type EngagementEvidenceSectionProps = {
  editingId: string | null
  isStaff: boolean
  isSubmitting: boolean
  isEvidenceUploading: boolean
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

const formatFileSize = (size: number | null | undefined) => {
  if (!size || size <= 0) return 'Tamanho não informado'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

const getFileExtension = (fileName: string) => {
  const extension = fileName.split('.').pop()?.trim().toUpperCase()

  return extension && extension !== fileName.toUpperCase()
    ? extension.slice(0, 5)
    : 'FILE'
}

const isImageFile = (mimeType: string | null | undefined, fileName: string) => {
  if (mimeType?.startsWith('image/')) return true

  return /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(fileName)
}

const isPdfFile = (mimeType: string | null | undefined, fileName: string) =>
  mimeType === 'application/pdf' || /\.pdf$/i.test(fileName)

function FileFallbackThumbnail({
  fileName,
  className = ''
}: {
  fileName: string
  className?: string
}) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 text-slate-500 ${className}`}
      aria-label={`Arquivo ${fileName}`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <span className="text-sm font-black tracking-wide text-slate-600">
          {getFileExtension(fileName)}
        </span>
      </div>

      <span className="max-w-full truncate text-xs font-semibold text-slate-400">
        {fileName}
      </span>
    </div>
  )
}

function EvidenceThumbnail({
  evidence,
  previewUrl,
  isLoading,
  isOpening
}: {
  evidence: EngagementEvidence
  previewUrl?: string
  isLoading: boolean
  isOpening: boolean
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const isImage = isImageFile(evidence.mime_type, evidence.original_name)
  const isPdf = isPdfFile(evidence.mime_type, evidence.original_name)

  useEffect(() => {
    setImageFailed(false)
  }, [previewUrl])

  return (
    <div className="relative h-40 w-full overflow-hidden bg-slate-100 sm:h-44">
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center bg-slate-50">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
        </div>
      ) : previewUrl && isImage && !imageFailed ? (
        <img
          src={previewUrl}
          alt={`Miniatura de ${evidence.original_name}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={() => setImageFailed(true)}
        />
      ) : previewUrl && isPdf ? (
        <div className="relative h-full w-full overflow-hidden bg-white">
          <iframe
            src={`${previewUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            title={`Miniatura de ${evidence.original_name}`}
            className="pointer-events-none h-[170%] w-[170%] origin-top-left scale-[0.59] border-0"
            tabIndex={-1}
          />
          <span className="absolute bottom-3 left-3 rounded-lg bg-red-600 px-2 py-1 text-[10px] font-black text-white shadow-sm">
            PDF
          </span>
        </div>
      ) : (
        <FileFallbackThumbnail fileName={evidence.original_name} />
      )}

      <div className="pointer-events-none absolute inset-0 bg-slate-900/0 transition-colors duration-200 group-hover:bg-slate-900/5" />

      {isOpening && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
        </div>
      )}
    </div>
  )
}

function PendingEvidenceThumbnail({ file }: { file: File }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [imageFailed, setImageFailed] = useState(false)
  const isImage = isImageFile(file.type, file.name)
  const isPdf = isPdfFile(file.type, file.name)

  useEffect(() => {
    if (!isImage && !isPdf) {
      setObjectUrl(null)
      return
    }

    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    setImageFailed(false)

    return () => URL.revokeObjectURL(url)
  }, [file, isImage, isPdf])

  return (
    <div className="relative h-32 w-full overflow-hidden bg-slate-50 sm:h-36">
      {objectUrl && isImage && !imageFailed ? (
        <img
          src={objectUrl}
          alt={`Miniatura de ${file.name}`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : objectUrl && isPdf ? (
        <div className="relative h-full w-full overflow-hidden bg-white">
          <iframe
            src={`${objectUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            title={`Miniatura de ${file.name}`}
            className="pointer-events-none h-[170%] w-[170%] origin-top-left scale-[0.59] border-0"
            tabIndex={-1}
          />
          <span className="absolute bottom-2 left-2 rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm">
            PDF
          </span>
        </div>
      ) : (
        <FileFallbackThumbnail fileName={file.name} />
      )}
    </div>
  )
}

export function EngagementEvidenceSection({
  editingId,
  isStaff,
  isSubmitting,
  isEvidenceUploading,
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
}: EngagementEvidenceSectionProps) {
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [previewLoadingIds, setPreviewLoadingIds] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false

    const previewableEvidences = evidences.filter(
      (evidence) =>
        isImageFile(evidence.mime_type, evidence.original_name) ||
        isPdfFile(evidence.mime_type, evidence.original_name)
    )

    const previewableIds = new Set(
      previewableEvidences.map((evidence) => evidence.id)
    )

    setPreviewUrls((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([id]) => previewableIds.has(id))
      )
    )

    if (previewableEvidences.length === 0) {
      setPreviewLoadingIds([])

      return () => {
        cancelled = true
      }
    }

    setPreviewLoadingIds(previewableEvidences.map((evidence) => evidence.id))

    void Promise.all(
      previewableEvidences.map(async (evidence) => {
        const url = await getEvidencePreviewUrl(evidence)
        return [evidence.id, url] as const
      })
    ).then((entries) => {
      if (cancelled) return

      const nextUrls: Record<string, string> = {}

      entries.forEach(([id, url]) => {
        if (url) nextUrls[id] = url
      })

      setPreviewUrls(nextUrls)
      setPreviewLoadingIds([])
    })

    return () => {
      cancelled = true
    }
  }, [evidences, getEvidencePreviewUrl])

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    evidence: EngagementEvidence
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    void handleOpenEvidence(evidence)
  }

  return (
    <div className="space-y-5 pt-8 mt-8 border-t border-slate-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-cyan-600" />

            <h3 className="text-lg font-bold text-slate-800">Evidências</h3>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Arquivos vinculados a este engajamento.
          </p>
        </div>

        {evidences.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {evidences.length} {evidences.length === 1 ? 'arquivo' : 'arquivos'}
            </span>

            {pendingEvidenceDeletionIds.length > 0 && (
              <span className="inline-flex w-fit items-center rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                {pendingEvidenceDeletionIds.length}{' '}
                {pendingEvidenceDeletionIds.length === 1
                  ? 'exclusão pendente'
                  : 'exclusões pendentes'}
              </span>
            )}
          </div>
        )}
      </div>

      {editingId && (
        <div className="rounded-2xl bg-slate-50/70 p-3 sm:p-4">
          {evidences.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-slate-300" />

              <p className="text-sm font-semibold text-slate-600">
                Nenhuma evidência cadastrada.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Os arquivos anexados ao engajamento aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {evidences.map((evidence) => {
                const isPendingDeletion = pendingEvidenceDeletionIds.includes(
                  evidence.id
                )
                const isOpening = openingEvidenceId === evidence.id

                return (
                  <article
                    key={evidence.id}
                    role="button"
                    tabIndex={isOpening ? -1 : 0}
                    onClick={() => {
                      if (!isOpening) void handleOpenEvidence(evidence)
                    }}
                    onKeyDown={(event) => {
                      if (!isOpening) handleCardKeyDown(event, evidence)
                    }}
                    className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white text-left shadow-sm outline-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:ring-2 focus:ring-cyan-500/30 ${
                      isPendingDeletion
                        ? 'border-red-200 bg-red-50/40'
                        : 'border-slate-200 hover:border-cyan-300'
                    } ${isOpening ? 'cursor-wait' : ''}`}
                    aria-label={`Abrir ${evidence.original_name}`}
                    title={`Abrir ${evidence.original_name}`}
                  >
                    {isStaff && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleEvidenceDeletion(evidence.id)
                        }}
                        disabled={isSubmitting}
                        className={`absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white/95 shadow-sm backdrop-blur-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          isPendingDeletion
                            ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            : 'border-red-100 text-red-600 hover:bg-red-50'
                        }`}
                        aria-label={
                          isPendingDeletion
                            ? `Desfazer exclusão de ${evidence.original_name}`
                            : `Marcar ${evidence.original_name} para exclusão`
                        }
                        title={
                          isPendingDeletion
                            ? 'Desfazer exclusão'
                            : 'Excluir ao salvar'
                        }
                      >
                        {isPendingDeletion ? (
                          <RotateCcw className="h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    <EvidenceThumbnail
                      evidence={evidence}
                      previewUrl={previewUrls[evidence.id]}
                      isLoading={previewLoadingIds.includes(evidence.id)}
                      isOpening={isOpening}
                    />

                    <div className="p-4">
                      <div className="flex min-w-0 items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p
                            className="line-clamp-2 text-sm font-bold leading-5 text-slate-800"
                            title={evidence.original_name}
                          >
                            {evidence.original_name}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[9px] font-black tracking-wide text-slate-500">
                          {getFileExtension(evidence.original_name)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400">
                        <span>{formatFileSize(evidence.file_size)}</span>

                        {evidence.created_at && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>
                              {new Date(evidence.created_at).toLocaleDateString(
                                'pt-BR'
                              )}
                            </span>
                          </>
                        )}
                      </div>

                      {isPendingDeletion && (
                        <div className="mt-3 rounded-lg bg-red-50 px-2.5 py-2 text-[10px] font-bold text-red-600">
                          Exclusão pendente — salve para confirmar.
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {isStaff && (
        <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/30 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Adicionar evidências
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Selecione um ou mais arquivos. Limite de{' '}
                <strong>3 MB por arquivo</strong>. Os arquivos serão enviados ao
                salvar o engajamento.
              </p>
            </div>

            <div className="shrink-0">
              <input
                ref={evidenceInputRef}
                id="engagement-evidences-input"
                type="file"
                multiple
                onChange={handleEvidenceFileSelection}
                className="sr-only"
              />

              <label
                htmlFor="engagement-evidences-input"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-cyan-700"
              >
                <UploadCloud className="h-4 w-4" />
                Selecionar arquivos
              </label>
            </div>
          </div>

          {pendingEvidenceFiles.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-cyan-700">
                Aguardando envio
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pendingEvidenceFiles.map((file, index) => (
                  <article
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="relative overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => removePendingEvidenceFile(index)}
                      disabled={isSubmitting || isEvidenceUploading}
                      className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-500 shadow-sm backdrop-blur-sm transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Remover ${file.name} da fila`}
                      title="Remover arquivo"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <PendingEvidenceThumbnail file={file} />

                    <div className="p-4">
                      <div className="flex min-w-0 items-start gap-2">
                        <p
                          className="line-clamp-2 min-w-0 flex-1 text-sm font-bold leading-5 text-slate-700"
                          title={file.name}
                        >
                          {file.name}
                        </p>

                        <span className="shrink-0 rounded-md bg-cyan-50 px-2 py-1 text-[9px] font-black tracking-wide text-cyan-700">
                          {getFileExtension(file.name)}
                        </span>
                      </div>

                      <p className="mt-2 text-[11px] font-medium text-slate-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}