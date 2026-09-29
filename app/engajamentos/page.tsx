'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'motion/react'
import {
  Calendar,
  Plus,
  Search,
  MapPin,
  CheckCircle,
  Activity,
  Loader2,
  Target,
  X,
  Users,
  Briefcase,
  Monitor,
  Heart,
  Trash2,
  Lock,
  Filter,
  Layers3,
  Rows3,
  Waypoints,
  LayoutGrid,
  Table2,
  Paperclip,
  UploadCloud,
  ExternalLink,
  FileText,
  RotateCcw
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DateRangeFilter } from '@/components/DateRangeFilter'
import { MultiSelectFilter } from '@/components/MultiSelectFilter'
import { ParticipantManager } from '@/components/ParticipantManager'
import { EngagementGrid } from '@/components/EngagementGrid'
import { Engagement, Participant } from '@/types/engagement'

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

type EngagementEvidence = {
  id: string
  engagement_id: string
  storage_path: string
  original_name: string
  mime_type: string | null
  file_size: number | null
  uploaded_by: string | null
  created_at: string | null
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

const formatFileSize = (size: number | null | undefined) => {
  if (!size || size <= 0) return 'Tamanho não informado'

  if (size < 1024) return `${size} B`

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`
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
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<
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
    e: React.ChangeEvent<HTMLInputElement>
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
      const { data, error } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .createSignedUrl(
          evidence.storage_path,
          SIGNED_URL_EXPIRATION_SECONDS
        )

      if (error || !data?.signedUrl) {
        if (previewWindow) previewWindow.close()

        throw new Error(
          error?.message ||
            'Não foi possível gerar o link do arquivo.'
        )
      }

      if (previewWindow) {
        previewWindow.location.href = data.signedUrl
      } else {
        window.location.href = data.signedUrl
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
    e: React.FormEvent
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
    // Filtro desligado = não interfere
    if (!filter.enabled) return true

    // Filtro ligado sem nenhuma opção = nenhum resultado
    if (filter.values.length === 0) return false

    const engagementSet = new Set(
      (engagementValues ?? []).map(normalizeText)
    )

    return filter.values.some((value) =>
      engagementSet.has(normalizeText(value))
    )
  }

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

                  {/* Seção 4: Evidências */}
                  <div className="space-y-5 pt-8 mt-8 border-t border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-5 h-5 text-cyan-600" />

                          <h3 className="text-lg font-bold text-slate-800">
                            Evidências
                          </h3>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          Arquivos vinculados a este
                          engajamento.
                        </p>
                      </div>

                      {evidences.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            {evidences.length}{' '}
                            {evidences.length === 1
                              ? 'arquivo'
                              : 'arquivos'}
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

                    {/* Visualização disponível para qualquer perfil autorizado pelas policies */}
                    {editingId && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                        {evidences.length === 0 ? (
                          <div className="px-6 py-8 text-center">
                            <FileText className="w-8 h-8 mx-auto mb-3 text-slate-300" />

                            <p className="text-sm font-semibold text-slate-600">
                              Nenhuma evidência cadastrada.
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Os arquivos anexados ao
                              engajamento aparecerão aqui.
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-200">
                            {evidences.map(
                              (evidence) => (
                                <div
                                  key={
                                    evidence.id
                                  }
                                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 transition-colors ${
                                    pendingEvidenceDeletionIds.includes(
                                      evidence.id
                                    )
                                      ? 'bg-red-50/70'
                                      : 'bg-white/70'
                                  }`}
                                >
                                  <div className="min-w-0 flex items-start gap-3">
                                    <div className="shrink-0 w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                                      <FileText className="w-5 h-5" />
                                    </div>

                                    <div className="min-w-0">
                                      <p
                                        className="text-sm font-bold text-slate-800 truncate"
                                        title={
                                          evidence.original_name
                                        }
                                      >
                                        {
                                          evidence.original_name
                                        }
                                      </p>

                                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                                        <span>
                                          {formatFileSize(
                                            evidence.file_size
                                          )}
                                        </span>

                                        {evidence.mime_type && (
                                          <span className="max-w-[220px] truncate">
                                            {
                                              evidence.mime_type
                                            }
                                          </span>
                                        )}

                                        {evidence.created_at && (
                                          <span>
                                            {new Date(
                                              evidence.created_at
                                            ).toLocaleDateString(
                                              'pt-BR'
                                            )}
                                          </span>
                                        )}
                                      </div>

                                      {pendingEvidenceDeletionIds.includes(
                                        evidence.id
                                      ) && (
                                        <p className="mt-2 text-[11px] font-bold text-red-600">
                                          Exclusão pendente.
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenEvidence(
                                          evidence
                                        )
                                      }
                                      disabled={
                                        openingEvidenceId ===
                                        evidence.id
                                      }
                                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {openingEvidenceId ===
                                      evidence.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <ExternalLink className="w-4 h-4" />
                                      )}

                                      Abrir
                                    </button>

                                    {isStaff && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleEvidenceDeletion(
                                            evidence.id
                                          )
                                        }
                                        disabled={isSubmitting}
                                        className={`inline-flex items-center justify-center rounded-xl border bg-white p-2.5 disabled:cursor-not-allowed disabled:opacity-50 ${
                                          pendingEvidenceDeletionIds.includes(
                                            evidence.id
                                          )
                                            ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            : 'border-red-200 text-red-600 hover:bg-red-50'
                                        }`}
                                        aria-label={
                                          pendingEvidenceDeletionIds.includes(
                                            evidence.id
                                          )
                                            ? `Desfazer exclusão de ${evidence.original_name}`
                                            : `Marcar ${evidence.original_name} para exclusão`
                                        }
                                        title={
                                          pendingEvidenceDeletionIds.includes(
                                            evidence.id
                                          )
                                            ? 'Desfazer exclusão'
                                            : 'Excluir ao salvar'
                                        }
                                      >
                                        {pendingEvidenceDeletionIds.includes(
                                          evidence.id
                                        ) ? (
                                          <RotateCcw className="w-4 h-4" />
                                        ) : (
                                          <Trash2 className="w-4 h-4" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload: invisível para pesquisa e usuário comum */}
                    {isStaff && (
                      <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/30 p-5 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              Adicionar evidências
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Selecione um ou mais
                              arquivos. Limite de{' '}
                              <strong>
                                3 MB por arquivo
                              </strong>
                              . Os arquivos serão enviados
                              ao salvar o engajamento.
                            </p>
                          </div>

                          <div className="shrink-0">
                            <input
                              ref={
                                evidenceInputRef
                              }
                              id="engagement-evidences-input"
                              type="file"
                              multiple
                              onChange={
                                handleEvidenceFileSelection
                              }
                              className="sr-only"
                            />

                            <label
                              htmlFor="engagement-evidences-input"
                              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-cyan-700"
                            >
                              <UploadCloud className="w-4 h-4" />
                              Selecionar arquivos
                            </label>
                          </div>
                        </div>

                        {pendingEvidenceFiles.length >
                          0 && (
                          <div className="mt-5 space-y-2">
                            <p className="text-[11px] font-black uppercase tracking-wider text-cyan-700">
                              Aguardando envio
                            </p>

                            {pendingEvidenceFiles.map(
                              (file, index) => (
                                <div
                                  key={`${file.name}-${file.size}-${file.lastModified}`}
                                  className="flex items-center justify-between gap-3 rounded-xl border border-cyan-100 bg-white px-4 py-3"
                                >
                                  <div className="min-w-0 flex items-center gap-3">
                                    <Paperclip className="w-4 h-4 shrink-0 text-cyan-600" />

                                    <div className="min-w-0">
                                      <p
                                        className="truncate text-sm font-semibold text-slate-700"
                                        title={
                                          file.name
                                        }
                                      >
                                        {
                                          file.name
                                        }
                                      </p>

                                      <p className="text-xs text-slate-400">
                                        {formatFileSize(
                                          file.size
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removePendingEvidenceFile(
                                        index
                                      )
                                    }
                                    disabled={
                                      isSubmitting ||
                                      isEvidenceUploading
                                    }
                                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label={`Remover ${file.name} da fila`}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

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

        {message && (
          <div
            role={
              message.type === 'error'
                ? 'alert'
                : 'status'
            }
            className={`mt-8 flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-sm font-semibold ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            <span>{message.text}</span>

            <button
              type="button"
              onClick={() =>
                setMessage(null)
              }
              className="rounded-lg p-1 hover:bg-white/60"
              aria-label="Fechar mensagem"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Existing List */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white p-2 mt-8">
          <div className="bg-white rounded-[2rem] shadow-sm p-8 md:p-12 min-h-[500px]">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-800">
                  <Calendar className="w-6 h-6" />
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    Seu Histórico
                  </h2>

                  <p className="text-slate-500">
                    Acompanhe suas ações no
                    ecossistema.
                  </p>
                </div>
              </div>

              <div
                className="inline-flex w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 p-1"
                role="group"
                aria-label="Modo de visualização"
              >
                <button
                  type="button"
                  aria-pressed={
                    viewMode === 'cards'
                  }
                  onClick={() =>
                    handleViewModeChange(
                      'cards'
                    )
                  }
                  className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                    viewMode === 'cards'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Cards
                </button>

                <button
                  type="button"
                  aria-pressed={
                    viewMode === 'grid'
                  }
                  onClick={() =>
                    handleViewModeChange(
                      'grid'
                    )
                  }
                  className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Table2 className="w-4 h-4" />
                  Grade
                </button>
              </div>
            </div>

            {/* Bloco de Filtros */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-5 lg:items-center relative z-40 mb-8">
              <div className="flex items-center gap-2 lg:border-r border-slate-100 pr-4 shrink-0">
                <Filter className="w-5 h-5 text-slate-400" />

                <span className="font-semibold text-slate-700 text-sm tracking-wide uppercase">
                  Filtros
                </span>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="w-full md:w-80 flex flex-col space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">
                      Buscar
                    </label>

                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />

                      <input
                        type="text"
                        placeholder="Título ou descrição..."
                        value={searchTerm}
                        onChange={(e) =>
                          setSearchTerm(
                            e.target.value
                          )
                        }
                        className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex-1 w-full">
                    <DateRangeFilter
                      startDate={
                        periodFilters.startDate
                      }
                      endDate={
                        periodFilters.endDate
                      }
                      onStartDateChange={(
                        date
                      ) =>
                        handleFilterChange(
                          'startDate',
                          date
                        )
                      }
                      onEndDateChange={(
                        date
                      ) =>
                        handleFilterChange(
                          'endDate',
                          date
                        )
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MultiSelectFilter
                    label="Vertical"
                    icon={Layers3}
                    enabled={
                      periodFilters.vertical
                        .enabled
                    }
                    values={
                      periodFilters.vertical
                        .values
                    }
                    options={
                      filterOptions.verticals
                    }
                    onEnabledChange={(
                      nextEnabled
                    ) =>
                      handleFilterChange(
                        'vertical',
                        {
                          enabled:
                            nextEnabled,
                          values:
                            nextEnabled
                              ? [
                                  ...filterOptions.verticals
                                ]
                              : []
                        }
                      )
                    }
                    onValuesChange={(
                      nextValues
                    ) =>
                      handleFilterChange(
                        'vertical',
                        {
                          ...periodFilters.vertical,
                          values:
                            nextValues
                        }
                      )
                    }
                  />

                  <MultiSelectFilter
                    label="Horizontal"
                    icon={Rows3}
                    enabled={
                      periodFilters
                        .horizontal.enabled
                    }
                    values={
                      periodFilters
                        .horizontal.values
                    }
                    options={
                      filterOptions.horizontals
                    }
                    onEnabledChange={(
                      nextEnabled
                    ) =>
                      handleFilterChange(
                        'horizontal',
                        {
                          enabled:
                            nextEnabled,
                          values:
                            nextEnabled
                              ? [
                                  ...filterOptions.horizontals
                                ]
                              : []
                        }
                      )
                    }
                    onValuesChange={(
                      nextValues
                    ) =>
                      handleFilterChange(
                        'horizontal',
                        {
                          ...periodFilters.horizontal,
                          values:
                            nextValues
                        }
                      )
                    }
                  />

                  <MultiSelectFilter
                    label="Transversal"
                    icon={Waypoints}
                    enabled={
                      periodFilters
                        .transversal.enabled
                    }
                    values={
                      periodFilters
                        .transversal.values
                    }
                    options={
                      filterOptions.transversals
                    }
                    onEnabledChange={(
                      nextEnabled
                    ) =>
                      handleFilterChange(
                        'transversal',
                        {
                          enabled:
                            nextEnabled,
                          values:
                            nextEnabled
                              ? [
                                  ...filterOptions.transversals
                                ]
                              : []
                        }
                      )
                    }
                    onValuesChange={(
                      nextValues
                    ) =>
                      handleFilterChange(
                        'transversal',
                        {
                          ...periodFilters.transversal,
                          values:
                            nextValues
                        }
                      )
                    }
                  />

                  <div className="relative flex items-center h-full min-h-[42px]">
                    <Activity className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />

                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(
                          e.target.value
                        )
                      }
                      className="w-full h-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl pl-9 pr-8 text-xs font-semibold text-slate-600 appearance-none outline-none cursor-pointer focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all py-3"
                    >
                      <option value="Todos">
                        Todos os Status
                      </option>

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

                    <div className="absolute right-3 pointer-events-none text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
              </div>
            ) : filteredEngagements.length ===
              0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-4" />

                <h3 className="text-lg font-bold text-slate-700">
                  Nenhum engajamento
                  encontrado
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  Ajuste os filtros ou a
                  busca para visualizar
                  outros resultados.
                </p>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEngagements.map(
                  (eng) => {
                    const isPast =
                      checkIsPast(
                        eng.event_date,
                        eng.estimated_duration ||
                          0
                      )

                    return (
                      <motion.div
                        key={eng.id}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          handleOpenDetails(
                            eng
                          )
                        }
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                              'Enter' ||
                            event.key === ' '
                          ) {
                            event.preventDefault()
                            handleOpenDetails(
                              eng
                            )
                          }
                        }}
                        className="cursor-pointer bg-white border border-slate-100 hover:border-cyan-200 hover:shadow-xl rounded-3xl p-8 outline-none transition-all duration-300 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/30"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
                          <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-cyan-50 text-cyan-600">
                            {eng.status}
                          </span>

                          {isPast && (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                              <Lock className="w-3 h-3" />
                              Encerrado
                            </span>
                          )}
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 mb-2">
                          {eng.title}
                        </h3>

                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                          {eng.description}
                        </p>

                        {isStaff &&
                          eng
                            .engagement_staff_notes
                            ?.notes && (
                            <div className="mb-4 p-4 bg-cyan-50/20 rounded-xl border border-cyan-100/50">
                              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600 mb-1">
                                Notas
                                Administrativas
                                (Staff)
                              </p>

                              <p className="text-xs text-slate-700 italic font-medium">
                                &quot;
                                {
                                  eng
                                    .engagement_staff_notes
                                    .notes
                                }
                                &quot;
                              </p>
                            </div>
                          )}

                        {eng
                          .engagement_participants &&
                          eng
                            .engagement_participants
                            .length >
                            0 && (
                            <div className="mb-6">
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Participantes
                              </p>

                              <div className="flex flex-wrap gap-1.5">
                                {eng.engagement_participants
                                  .slice(
                                    0,
                                    5
                                  )
                                  .map(
                                    (
                                      p: any,
                                      idx: number
                                    ) => {
                                      const displayName =
                                        getParticipantDisplayName(
                                          p
                                        )

                                      return (
                                        <span
                                          key={
                                            p.user_id ||
                                            p.email ||
                                            idx
                                          }
                                          className="text-[11px] font-semibold border border-slate-200 bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1 text-slate-600"
                                        >
                                          {
                                            displayName
                                          }
                                        </span>
                                      )
                                    }
                                  )}

                                {eng
                                  .engagement_participants
                                  .length >
                                  5 && (
                                  <span
                                    className="text-[11px] font-bold border border-slate-200 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md flex items-center"
                                    title={`+${
                                      eng
                                        .engagement_participants
                                        .length -
                                      5
                                    } participantes`}
                                  >
                                    +
                                    {eng
                                      .engagement_participants
                                      .length -
                                      5}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                        <div className="pt-4 border-t border-slate-50">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(
                                eng.event_date
                              )}
                            </span>

                            <span className="flex items-center gap-1 text-cyan-600">
                              <MapPin className="w-4 h-4" />
                              {eng.location ||
                                'Local não definido'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  }
                )}
              </div>
            ) : (
              <EngagementGrid
                engagements={
                  filteredEngagements
                }
                onOpenDetails={
                  handleOpenDetails
                }
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

// Componente para a grade de multi-seleção
const BadgeToggleList = ({
  options,
  selected,
  onToggle,
  label,
  icon: Icon
}: any) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1">
      <Icon className="w-4 h-4 text-slate-400" />
      {label}
    </div>

    <div className="flex flex-wrap gap-1.5">
      {options.map((opt: string) => {
        const isActive =
          selected.includes(opt)

        return (
          <button
            key={opt}
            type="button"
            onClick={() =>
              onToggle(opt)
            }
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