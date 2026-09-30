'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Target, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Engagement, Participant } from '@/types/engagement'
import { EngagementForm } from './EngagementForm'
import { EngagementHistory } from './EngagementHistory'
import type { EngagementEvidence } from './EngagementEvidenceSection'

const EVIDENCE_BUCKET = 'engagement-evidences'
const MAX_EVIDENCE_FILE_SIZE = 3 * 1024 * 1024 // 3 MB
const SIGNED_URL_EXPIRATION_SECONDS = 60 * 10 // 10 minutos

type ParticipantProfileData = {
  id: string
  full_name: string | null
  institution_organization: string | null
  organization_type: string | null
  job_title: string | null
  municipality: string | null
  referral_source: string | null
}

type ParticipantAuthData = {
  id: string
  email: string | null
  cpf: string | null
  phone: string | null
  role: string | null
}

const getParticipantProfile = (
  participant: any
): ParticipantProfileData | null => participant?.user_profile ?? null

const getParticipantAuth = (
  participant: any
): ParticipantAuthData | null => participant?.user_auth ?? null

const getParticipantDisplayName = (participant: any) => {
  const profile = getParticipantProfile(participant)
  const auth = getParticipantAuth(participant)

  return (
    profile?.full_name?.trim() ||
    auth?.email?.trim() ||
    participant?.email?.trim() ||
    'Usuário sem identificação'
  )
}

const sanitizeFileName = (fileName: string) => {
  const lastDot = fileName.lastIndexOf('.')

  const rawBaseName =
    lastDot > 0 ? fileName.slice(0, lastDot) : fileName

  const extension =
    lastDot > 0 ? fileName.slice(lastDot).toLowerCase() : ''

  const safeBaseName = rawBaseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120)

  const safeExtension = extension.replace(/[^a-zA-Z0-9.]/g, '')

  return `${safeBaseName || 'arquivo'}${safeExtension}`
}

const normalizeText = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLocaleLowerCase('pt-BR')

const matchesDimension = (
  engagementValues: string[] | undefined,
  filter: {
    enabled: boolean
    values: string[]
  }
) => {
  if (!filter.enabled) return true

  if (filter.values.length === 0) return false

  const engagementSet = new Set(
    (engagementValues ?? []).map(normalizeText)
  )

  return filter.values.some((value) =>
    engagementSet.has(normalizeText(value))
  )
}

export default function EngajamentosPage() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isStaff, setIsStaff] = useState(false)
  const isResearch = userRole === 'pesquisa'
  const canFilterParticipants = isStaff || isResearch

  const [loading, setLoading] = useState(true)
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTime] = useState(() => Date.now())
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards')

  // Evidências
  const [evidences, setEvidences] = useState<EngagementEvidence[]>([])
  const [pendingEvidenceFiles, setPendingEvidenceFiles] = useState<File[]>([])
  const [isEvidenceUploading, setIsEvidenceUploading] = useState(false)
  const [openingEvidenceId, setOpeningEvidenceId] = useState<string | null>(null)
  const [pendingEvidenceDeletionIds, setPendingEvidenceDeletionIds] = useState<string[]>([])
  const evidenceInputRef = useRef<HTMLInputElement | null>(null)

  // Impede que a definição automática por role sobrescreva
  // uma escolha manual do usuário.
  const hasUserSelectedViewMode = useRef(false)

  const handleViewModeChange = (mode: 'cards' | 'grid') => {
    hasUserSelectedViewMode.current = true
    setViewMode(mode)
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')

  // Filtros de Período e Dimensões
  const [filterOptions, setFilterOptions] = useState({
    verticals: [] as string[],
    horizontals: [] as string[],
    transversals: [] as string[]
  })

  const [periodFilters, setPeriodFilters] = useState({
    startDate: '2026-04-01',
    endDate: '',
    vertical: { enabled: false, values: [] as string[] },
    horizontal: { enabled: false, values: [] as string[] },
    transversal: { enabled: false, values: [] as string[] }
  })

  const router = useRouter()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    status: 'Planejado',
    feedback: '',
    estimated_duration: '',
    horizontal: [] as string[],
    vertical: [] as string[],
    transversal: [] as string[],
    planned_activities: [] as string[],
    participants: [] as Participant[]
  })

  const fetchEngajamentos = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('engagements')
      .select(`
        *,
        engagement_participants(
          id,
          user_id,
          email
        ),
        engagement_staff_notes(notes),
        engagement_evidences(
          id,
          engagement_id,
          storage_path,
          original_name,
          mime_type,
          file_size,
          uploaded_by,
          created_at
        )
      `)
      .order('event_date', { ascending: false })

    if (error) {
      console.error(
        'Error fetching engagements:',
        JSON.stringify(error, null, 2)
      )
    } else {
      const userIds = Array.from(
        new Set(
          (data || [])
            .flatMap((eng: any) => eng.engagement_participants || [])
            .map((participant: any) => participant.user_id)
            .filter(
              (userId: string | null): userId is string =>
                Boolean(userId)
            )
        )
      )

      let profilesById = new Map<string, ParticipantProfileData>()
      let authById = new Map<string, ParticipantAuthData>()

      if (userIds.length > 0) {
        const [profilesResult, authResult] = await Promise.all([
          supabase
            .from('user_profile')
            .select(`
              id,
              full_name,
              institution_organization,
              organization_type,
              job_title,
              municipality,
              referral_source
            `)
            .in('id', userIds),

          supabase
            .from('user_auth')
            .select('id, email, cpf, phone, role')
            .in('id', userIds)
        ])

        if (profilesResult.error) {
          console.error(
            'Erro ao buscar perfis dos participantes:',
            profilesResult.error.message
          )
        } else {
          profilesById = new Map(
            (profilesResult.data || []).map(
              (profile: ParticipantProfileData) => [
                profile.id,
                profile
              ]
            )
          )
        }

        if (authResult.error) {
          console.error(
            'Erro ao buscar dados de autenticação dos participantes:',
            authResult.error.message
          )
        } else {
          authById = new Map(
            (authResult.data || []).map(
              (auth: ParticipantAuthData) => [auth.id, auth]
            )
          )
        }
      }

      const normalizeArray = (value: unknown): string[] => {
        if (!Array.isArray(value)) return []

        return value
          .map((item) => String(item).trim())
          .filter(Boolean)
      }

      const formattedData = (data || []).map((eng: any) => ({
        ...eng,
        horizontal: normalizeArray(eng.horizontal),
        vertical: normalizeArray(eng.vertical),
        transversal: normalizeArray(eng.transversal),

        engagement_participants: (
          eng.engagement_participants || []
        ).map((participant: any) => ({
          ...participant,
          user_profile: participant.user_id
            ? profilesById.get(participant.user_id) ?? null
            : null,
          user_auth: participant.user_id
            ? authById.get(participant.user_id) ?? null
            : null
        })),

        engagement_staff_notes: Array.isArray(
          eng.engagement_staff_notes
        )
          ? eng.engagement_staff_notes[0]
          : eng.engagement_staff_notes,

        engagement_evidences: Array.isArray(
          eng.engagement_evidences
        )
          ? eng.engagement_evidences
          : []
      }))

      setEngagements(formattedData)

      const uniqueVerticals = new Set<string>()
      const uniqueHorizontals = new Set<string>()
      const uniqueTransversals = new Set<string>()

      formattedData.forEach((eng: Engagement) => {
        if (Array.isArray(eng.vertical)) {
          eng.vertical.forEach((v) => {
            if (v?.trim()) uniqueVerticals.add(v.trim())
          })
        }

        if (Array.isArray(eng.horizontal)) {
          eng.horizontal.forEach((h) => {
            if (h?.trim()) uniqueHorizontals.add(h.trim())
          })
        }

        if (Array.isArray(eng.transversal)) {
          eng.transversal.forEach((t) => {
            if (t?.trim()) uniqueTransversals.add(t.trim())
          })
        }
      })

      setFilterOptions({
        verticals: Array.from(uniqueVerticals).sort(),
        horizontals: Array.from(uniqueHorizontals).sort(),
        transversals: Array.from(uniqueTransversals).sort()
      })
    }

    setLoading(false)
  }

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)

      const { data: authData } = await supabase
        .from('user_auth')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const role = authData?.role ?? null

      setUserRole(role)
      setIsStaff(role === 'staff')

      if (!hasUserSelectedViewMode.current) {
        setViewMode(role !== 'comum' ? 'grid' : 'cards')
      }

      fetchEngajamentos()
    }

    getSession()
  }, [router])

  const handleInputChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const toggleArrayItem = (
    field:
      | 'horizontal'
      | 'vertical'
      | 'transversal'
      | 'planned_activities',
    item: string
  ) => {
    setFormData((prev) => {
      const currentArray = prev[field]

      if (currentArray.includes(item)) {
        return {
          ...prev,
          [field]: currentArray.filter((i) => i !== item)
        }
      }

      return {
        ...prev,
        [field]: [...currentArray, item]
      }
    })
  }

  const handleFilterChange = (
    filterKey: string,
    newValue: any
  ) => {
    setPeriodFilters((prev) => ({
      ...prev,
      [filterKey]: newValue
    }))
  }

  const resetEvidenceState = () => {
    setEvidences([])
    setPendingEvidenceFiles([])
    setOpeningEvidenceId(null)
    setPendingEvidenceDeletionIds([])

    if (evidenceInputRef.current) {
      evidenceInputRef.current.value = ''
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      location: '',
      status: 'Planejado',
      feedback: '',
      estimated_duration: '',
      horizontal: [],
      vertical: [],
      transversal: [],
      planned_activities: [],
      participants: []
    })

    resetEvidenceState()
  }

  const closeDetails = () => {
    setShowForm(false)
    setEditingId(null)
    resetForm()
  }

  const openNewEngagement = () => {
    resetForm()
    setEditingId(null)
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleOpenDetails = (eng: Engagement) => {
    setEditingId(eng.id)

    const existingParticipants: Participant[] =
      eng.engagement_participants?.map((p: any) => ({
        user_id: p.user_id,
        email: p.email || '',
        full_name: getParticipantDisplayName(p),
        cpf: getParticipantAuth(p)?.cpf || ''
      })) || []

    setFormData({
      title: eng.title,
      description: eng.description,
      event_date: eng.event_date
        ? new Date(eng.event_date).toISOString().slice(0, 16)
        : '',
      location: eng.location,
      status: eng.status || 'Planejado',
      feedback: eng.engagement_staff_notes?.notes || '',
      estimated_duration: eng.estimated_duration
        ? eng.estimated_duration.toString()
        : '',
      horizontal: eng.horizontal || [],
      vertical: eng.vertical || [],
      transversal: eng.transversal || [],
      planned_activities: eng.planned_activities || [],
      participants: existingParticipants
    })

    const currentEvidences = (
      (eng as any).engagement_evidences || []
    ) as EngagementEvidence[]

    setEvidences(
      [...currentEvidences].sort((a, b) => {
        const aTime = a.created_at
          ? new Date(a.created_at).getTime()
          : 0
        const bTime = b.created_at
          ? new Date(b.created_at).getTime()
          : 0

        return bTime - aTime
      })
    )

    setPendingEvidenceFiles([])
    setPendingEvidenceDeletionIds([])

    if (evidenceInputRef.current) {
      evidenceInputRef.current.value = ''
    }

    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleEvidenceFileSelection = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    if (!isStaff) return

    const selectedFiles = Array.from(e.target.files || [])

    if (selectedFiles.length === 0) return

    const invalidFiles = selectedFiles.filter(
      (file) => file.size > MAX_EVIDENCE_FILE_SIZE
    )

    if (invalidFiles.length > 0) {
      setMessage({
        type: 'error',
        text:
          invalidFiles.length === 1
            ? `O arquivo "${invalidFiles[0].name}" excede o limite de 3 MB.`
            : `${invalidFiles.length} arquivos excedem o limite de 3 MB e não foram adicionados.`
      })
    }

    const validFiles = selectedFiles.filter(
      (file) => file.size <= MAX_EVIDENCE_FILE_SIZE
    )

    if (validFiles.length > 0) {
      setPendingEvidenceFiles((current) => {
        const combined = [...current]

        validFiles.forEach((file) => {
          const duplicate = combined.some(
            (existingFile) =>
              existingFile.name === file.name &&
              existingFile.size === file.size &&
              existingFile.lastModified === file.lastModified
          )

          if (!duplicate) {
            combined.push(file)
          }
        })

        return combined
      })
    }

    // Permite selecionar novamente o mesmo arquivo após removê-lo.
    e.target.value = ''
  }

  const removePendingEvidenceFile = (index: number) => {
    if (!isStaff) return

    setPendingEvidenceFiles((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    )
  }

  const uploadPendingEvidences = async (
    engagementId: string
  ) => {
    if (
      !isStaff ||
      !user ||
      pendingEvidenceFiles.length === 0
    ) {
      return
    }

    setIsEvidenceUploading(true)

    const uploadedStoragePaths: string[] = []
    const insertedEvidenceIds: string[] = []

    try {
      for (const file of pendingEvidenceFiles) {
        if (file.size > MAX_EVIDENCE_FILE_SIZE) {
          throw new Error(
            `O arquivo "${file.name}" excede o limite de 3 MB.`
          )
        }

        const safeName = sanitizeFileName(file.name)
        const storagePath =
          `${engagementId}/${crypto.randomUUID()}-${safeName}`

        const {
          data: uploadData,
          error: uploadError
        } = await supabase.storage
          .from(EVIDENCE_BUCKET)
          .upload(storagePath, file, {
            contentType:
              file.type || 'application/octet-stream',
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          throw new Error(
            `Erro ao enviar "${file.name}": ${uploadError.message}`
          )
        }

        const finalStoragePath =
          uploadData?.path || storagePath

        uploadedStoragePaths.push(finalStoragePath)

        const {
          data: evidenceData,
          error: evidenceError
        } = await supabase
          .from('engagement_evidences')
          .insert({
            engagement_id: engagementId,
            storage_path: finalStoragePath,
            original_name: file.name,
            mime_type:
              file.type || 'application/octet-stream',
            file_size: file.size,
            uploaded_by: user.id
          })
          .select(`
            id,
            engagement_id,
            storage_path,
            original_name,
            mime_type,
            file_size,
            uploaded_by,
            created_at
          `)
          .single()

        if (evidenceError) {
          // Se o registro no banco falhar, remove imediatamente
          // o arquivo recém-enviado para não gerar órfão.
          await supabase.storage
            .from(EVIDENCE_BUCKET)
            .remove([finalStoragePath])

          const pathIndex =
            uploadedStoragePaths.indexOf(finalStoragePath)

          if (pathIndex >= 0) {
            uploadedStoragePaths.splice(pathIndex, 1)
          }

          throw new Error(
            `Erro ao registrar "${file.name}": ${evidenceError.message}`
          )
        }

        insertedEvidenceIds.push(evidenceData.id)
      }

      setPendingEvidenceFiles([])

      if (evidenceInputRef.current) {
        evidenceInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Erro no upload das evidências:', error)

      /*
       * Rollback apenas dos arquivos/registros que foram criados
       * nesta tentativa. Isso evita deixar uploads parciais quando
       * um dos arquivos falhar.
       */
      if (insertedEvidenceIds.length > 0) {
        await supabase
          .from('engagement_evidences')
          .delete()
          .in('id', insertedEvidenceIds)
      }

      if (uploadedStoragePaths.length > 0) {
        await supabase.storage
          .from(EVIDENCE_BUCKET)
          .remove(uploadedStoragePaths)
      }

      throw error
    } finally {
      setIsEvidenceUploading(false)
    }
  }

  const getEvidencePreviewUrl = useCallback(async (
    evidence: EngagementEvidence
  ): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from(EVIDENCE_BUCKET)
      .createSignedUrl(
        evidence.storage_path,
        SIGNED_URL_EXPIRATION_SECONDS
      )

    if (error || !data?.signedUrl) {
      console.error(
        'Erro ao gerar miniatura da evidência:',
        error?.message || 'URL assinada não retornada'
      )
      return null
    }

    return data.signedUrl
  }, [])

  const handleOpenEvidence = async (
    evidence: EngagementEvidence
  ) => {
    setOpeningEvidenceId(evidence.id)
    setMessage(null)

    const previewWindow = window.open(
      'about:blank',
      '_blank'
    )

    try {
      const signedUrl = await getEvidencePreviewUrl(evidence)

      if (!signedUrl) {
        if (previewWindow) previewWindow.close()

        throw new Error(
          'Não foi possível gerar o link do arquivo.'
        )
      }

      if (previewWindow) {
        previewWindow.location.assign(signedUrl)
      } else {
        window.location.assign(signedUrl)
      }
    } catch (error: any) {
      console.error('Erro ao abrir evidência:', error)

      setMessage({
        type: 'error',
        text:
          'Não foi possível abrir o arquivo: ' +
          (error?.message || 'erro desconhecido')
      })
    } finally {
      setOpeningEvidenceId(null)
    }
  }

  const toggleEvidenceDeletion = (
    evidenceId: string
  ) => {
    if (!isStaff) return

    setPendingEvidenceDeletionIds((current) =>
      current.includes(evidenceId)
        ? current.filter((id) => id !== evidenceId)
        : [...current, evidenceId]
    )
  }

  const applyPendingEvidenceDeletions = async () => {
    if (
      !isStaff ||
      pendingEvidenceDeletionIds.length === 0
    ) {
      return
    }

    const evidencesToDelete = evidences.filter((evidence) =>
      pendingEvidenceDeletionIds.includes(evidence.id)
    )

    if (evidencesToDelete.length === 0) {
      setPendingEvidenceDeletionIds([])
      return
    }

    const evidenceIds = evidencesToDelete.map(
      (evidence) => evidence.id
    )

    const storagePaths = evidencesToDelete
      .map((evidence) => evidence.storage_path)
      .filter(Boolean)

    const { error: databaseError } = await supabase
      .from('engagement_evidences')
      .delete()
      .in('id', evidenceIds)

    if (databaseError) {
      throw new Error(
        'Erro ao excluir evidências: ' +
          databaseError.message
      )
    }

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .remove(storagePaths)

      if (storageError) {
        // O registro já foi removido do banco. Mantemos apenas
        // o log para identificar eventual arquivo órfão no Storage.
        console.error(
          'Evidências removidas da tabela, mas alguns arquivos permaneceram no Storage:',
          storageError
        )
      }
    }

    setEvidences((current) =>
      current.filter(
        (evidence) =>
          !pendingEvidenceDeletionIds.includes(evidence.id)
      )
    )

    setPendingEvidenceDeletionIds([])
  }

  const handleDelete = async () => {
    if (!isStaff || !editingId) return

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o engajamento “${formData.title}”? Esta ação não pode ser desfeita.`
    )

    if (!confirmed) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      // Mantém os paths antes do cascade apagar os registros.
      const storagePaths = evidences
        .map((evidence) => evidence.storage_path)
        .filter(Boolean)

      const { error } = await supabase
        .from('engagements')
        .delete()
        .eq('id', editingId)

      if (error) {
        throw new Error(error.message)
      }

      // ON DELETE CASCADE remove engagement_evidences;
      // os objetos físicos do Storage precisam ser removidos via API.
      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(EVIDENCE_BUCKET)
          .remove(storagePaths)

        if (storageError) {
          console.error(
            'Engajamento excluído, mas alguns arquivos permaneceram no Storage:',
            storageError
          )
        }
      }

      closeDetails()

      setMessage({
        type: 'success',
        text: 'Engajamento excluído com sucesso.'
      })

      await fetchEngajamentos()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text:
          'Erro ao excluir: ' +
          (error?.message || 'erro desconhecido')
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (
    e: FormEvent
  ) => {
    e.preventDefault()

    if (!user || !isStaff) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date || null,
        location: formData.location,
        estimated_duration: formData.estimated_duration
          ? parseFloat(formData.estimated_duration)
          : null,
        horizontal: formData.horizontal,
        vertical: formData.vertical,
        transversal: formData.transversal,
        planned_activities: formData.planned_activities
      }

      if (isStaff || !editingId) {
        payload.status = formData.status
      }

      let result
      let currentEngagementId = editingId

      if (editingId) {
        result = await supabase
          .from('engagements')
          .update(payload)
          .eq('id', editingId)
          .select()
      } else {
        result = await supabase
          .from('engagements')
          .insert([payload])
          .select()

        if (result.data && result.data.length > 0) {
          currentEngagementId = result.data[0].id
        }
      }

      if (result.error) {
        throw new Error(
          'Erro ao salvar: ' + result.error.message
        )
      }

      if (!currentEngagementId) {
        throw new Error(
          'O engajamento foi salvo, mas não foi possível identificar seu ID.'
        )
      }

      if (isStaff) {
        const { error: notesError } = await supabase
          .from('engagement_staff_notes')
          .upsert({
            engagement_id: currentEngagementId,
            notes: formData.feedback
          })

        if (notesError) {
          throw new Error(
            'Erro ao salvar as anotações internas: ' +
              notesError.message
          )
        }
      }

      // --- SINCRONIZAÇÃO DE PARTICIPANTES ---
      if (editingId) {
        const { error: deleteError } = await supabase
          .from('engagement_participants')
          .delete()
          .eq('engagement_id', currentEngagementId)

        if (deleteError) {
          throw new Error(
            'Erro ao atualizar os participantes: ' +
              deleteError.message
          )
        }
      }

      const participantsToSave: Array<{
        engagement_id: string
        user_id: string | null
        email: string | null
      }> = []

      formData.participants.forEach((p) => {
        const normalizedEmail = p.email?.trim() || null
        const normalizedUserId = p.user_id || null

        if (!normalizedUserId && !normalizedEmail) return

        const alreadyAdded = participantsToSave.some(
          (participant) => {
            if (normalizedUserId) {
              return (
                participant.user_id === normalizedUserId
              )
            }

            return participant.email === normalizedEmail
          }
        )

        if (!alreadyAdded) {
          participantsToSave.push({
            engagement_id: currentEngagementId!,
            user_id: normalizedUserId,
            email: normalizedUserId
              ? null
              : normalizedEmail
          })
        }
      })

      if (participantsToSave.length > 0) {
        const { error: partError } = await supabase
          .from('engagement_participants')
          .insert(participantsToSave)

        if (partError) {
          throw new Error(
            'Erro ao vincular participantes: ' +
              partError.message
          )
        }
      }

      // --- UPLOAD DAS EVIDÊNCIAS ---
      // O upload é feito somente após o engagement_id existir.
      if (pendingEvidenceFiles.length > 0) {
        await uploadPendingEvidences(
          currentEngagementId
        )
      }

      // --- EXCLUSÃO DAS EVIDÊNCIAS MARCADAS ---
      // Nenhum arquivo existente é excluído no clique da lixeira.
      // A exclusão é efetivada apenas após o salvamento do engajamento.
      if (pendingEvidenceDeletionIds.length > 0) {
        await applyPendingEvidenceDeletions()
      }

      setMessage({
        type: 'success',
        text: editingId
          ? 'Engajamento atualizado!'
          : 'Engajamento criado!'
      })

      resetForm()
      setEditingId(null)
      setShowForm(false)

      await fetchEngajamentos()
    } catch (error: any) {
      console.error('Erro inesperado:', error)

      setMessage({
        type: 'error',
        text:
          error?.message ||
          'Erro inesperado ao processar a requisição.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data não definida'

    return new Date(dateString).toLocaleString(
      'pt-BR',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    )
  }

  const checkIsPast = useMemo(() => {
    return (
      eventDate: string,
      duration: number
    ) => {
      if (!eventDate) return false

      const endTimeMs =
        new Date(eventDate).getTime() +
        duration * 60 * 60 * 1000

      return endTimeMs < currentTime
    }
  }, [currentTime])

  const filteredEngagements = useMemo(() => {
    return engagements.filter((eng) => {
      // STATUS
      const matchesStatus =
        statusFilter === 'Todos' ||
        normalizeText(eng.status) ===
          normalizeText(statusFilter)

      // BUSCA
      const searchLower = normalizeText(searchTerm)

      const matchesSearch =
        !searchLower ||
        normalizeText(eng.title).includes(searchLower) ||
        normalizeText(eng.description).includes(searchLower)

      // DATA
      let matchesDateRange = true

      if (
        periodFilters.startDate ||
        periodFilters.endDate
      ) {
        if (!eng.event_date) {
          matchesDateRange = false
        } else {
          const engDate = new Date(
            eng.event_date
          ).getTime()

          const startTime =
            periodFilters.startDate
              ? new Date(
                  `${periodFilters.startDate}T00:00:00`
                ).getTime()
              : -Infinity

          const endTime =
            periodFilters.endDate
              ? new Date(
                  `${periodFilters.endDate}T23:59:59.999`
                ).getTime()
              : Infinity

          matchesDateRange =
            engDate >= startTime &&
            engDate <= endTime
        }
      }

      // DIMENSÕES
      const matchesHorizontal =
        matchesDimension(
          eng.horizontal,
          periodFilters.horizontal
        )

      const matchesVertical =
        matchesDimension(
          eng.vertical,
          periodFilters.vertical
        )

      const matchesTransversal =
        matchesDimension(
          eng.transversal,
          periodFilters.transversal
        )

      return (
        matchesStatus &&
        matchesSearch &&
        matchesDateRange &&
        matchesHorizontal &&
        matchesVertical &&
        matchesTransversal
      )
    })
  }, [
    engagements,
    statusFilter,
    searchTerm,
    periodFilters
  ])

  const isFormLocked =
    Boolean(editingId) && !isStaff

  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-20">
      {/* Header Section */}
      <section className="relative overflow-hidden bg-[#0F172A] py-16 md:py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-900 opacity-90" />

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold tracking-wider uppercase mb-6">
              <Target className="w-4 h-4" />
              Gestão de Iniciativas
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
              Seus{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">
                Engajamentos
              </span>
            </h1>
          </div>

          {isStaff && (
            <button
              onClick={() =>
                showForm
                  ? closeDetails()
                  : openNewEngagement()
              }
              className="bg-white text-[#0F172A] font-bold py-4 px-8 rounded-2xl shadow-xl flex items-center gap-3 transition-all hover:bg-cyan-50"
            >
              {showForm ? (
                <X className="w-5 h-5" />
              ) : (
                <Plus className="w-5 h-5" />
              )}

              {showForm
                ? 'Cancelar'
                : 'Novo Engajamento'}
            </button>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 relative z-20">
        <EngagementForm
          showForm={showForm}
          editingId={editingId}
          isStaff={isStaff}
          isSubmitting={isSubmitting}
          isFormLocked={isFormLocked}
          isEvidenceUploading={isEvidenceUploading}
          canFilterParticipants={canFilterParticipants}
          formData={formData}
          setFormData={setFormData}
          handleInputChange={handleInputChange}
          toggleArrayItem={toggleArrayItem}
          handleSubmit={handleSubmit}
          handleDelete={handleDelete}
          closeDetails={closeDetails}
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

        {message && (
          <div
            role={message.type === 'error' ? 'alert' : 'status'}
            className={`mt-8 flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-sm font-semibold ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <span>{message.text}</span>

            <button
              type="button"
              onClick={() => setMessage(null)}
              className="rounded-lg p-1 hover:bg-white/60"
              aria-label="Fechar mensagem"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <EngagementHistory
          loading={loading}
          engagements={filteredEngagements}
          viewMode={viewMode}
          handleViewModeChange={handleViewModeChange}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          filterOptions={filterOptions}
          periodFilters={periodFilters}
          handleFilterChange={handleFilterChange}
          isStaff={isStaff}
          checkIsPast={checkIsPast}
          handleOpenDetails={handleOpenDetails}
          formatDate={formatDate}
          getParticipantDisplayName={getParticipantDisplayName}
        />
      </div>
    </main>
  )
}