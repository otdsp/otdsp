import type { Engagement, EvidenceFilters, UserAuth, UserProfile } from '../types';

export type RawEvidenceData = {
  auth: UserAuth[];
  profiles: UserProfile[];
  engagements: Engagement[];
};

export type DashboardStatusName =
  | 'Planejado'
  | 'Pendente'
  | 'Concluído'
  | 'Cancelado'
  | 'Outro';

export type DashboardInsight = {
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  value?: number | string;
};

export type DashboardUpcomingEngagement = {
  id: string;
  title: string;
  eventDate: string;
  status: string;
  location?: string;
};

export type DashboardTimelineRow = {
  name: string;
  Planejado: number;
  Pendente: number;
  Concluído: number;
  Cancelado: number;
  Outro: number;
  total: number;
};

export type DashboardWorkloadRow = {
  name: string;
  horas: number;
};

export type DashboardOrganizationMetric = {
  name: string;
  value: number;
  orgType: string;
  members: string[];
};

export type DashboardPillarMetric = {
  label: string;
  count: number;
};

export type DashboardPillarGroup = {
  category: 'Verticais' | 'Horizontais' | 'Transversais';
  items: DashboardPillarMetric[];
};

export type DashboardMunicipalityParticipant = {
  email: string;
  name: string;
  role: string;
  municipality: string;
};

export type DashboardMunicipalityMetric = {
  municipality: string;
  count: number;
  engagementCount: number;
  totalHours: number;
  verticalHours: number;
  horizontalHours: number;
  transversalHours: number;
  participants: DashboardMunicipalityParticipant[];
};

export type DashboardGeoPoint = {
  name: string;
  count: number;
  coordinates: [number, number];
  members: string[];
  engagementCount: number;
  institutionCount: number;
  totalHours: number;
};

export type DashboardDerivedData = {
  stats: {
    totalUsers: number;
    attendedCities: number;
    totalEngagements: number;
    attentionCount: number;
    totalEstimatedHours: number;
    signedAgreements: number;
  };
  engagementTimelineData: DashboardTimelineRow[];
  workloadTimelineData: DashboardWorkloadRow[];
  statusData: Array<{ name: DashboardStatusName; value: number }>;
  upcomingEngagements: DashboardUpcomingEngagement[];
  insights: DashboardInsight[];
  organizationData: DashboardOrganizationMetric[];
  geoData: DashboardGeoPoint[];
  pillarsData: DashboardPillarGroup[];
  activityData: DashboardPillarMetric[];
  municipalityChartData: DashboardMunicipalityMetric[];
};

// Se o criador do engajamento também deve contar como participante, altere para true.
// Por padrão, a rede territorial considera apenas engagement_participants.
const INCLUDE_CREATOR_AS_PARTICIPANT = false;

const STATUS_ORDER: DashboardStatusName[] = [
  'Concluído',
  'Planejado',
  'Pendente',
  'Cancelado',
  'Outro',
];

const normalizeText = (value?: string | null) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const normalizeMunicipality = (value?: string | null) => {
  const trimmed = value?.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const getEngagementDate = (engagement: Engagement) => {
  const rawDate = engagement.event_date || engagement.created_at;
  return rawDate ? new Date(rawDate) : new Date(0);
};

const getDuration = (engagement: Engagement) => {
  const raw = engagement.estimated_duration;
  const value = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

const normalizeStatus = (status?: string | null): DashboardStatusName => {
  const normalized = normalizeText(status);
  if (normalized === 'planejado') return 'Planejado';
  if (normalized === 'pendente') return 'Pendente';
  if (normalized === 'concluido') return 'Concluído';
  if (normalized === 'cancelado') return 'Cancelado';
  return 'Outro';
};

const formatGroup = (obj: Record<string, number>): DashboardPillarMetric[] =>
  Object.entries(obj)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'));

function buildTimelineBuckets(startCutoff: Date, endCutoff: Date) {
  const diffTime = Math.abs(endCutoff.getTime() - startCutoff.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isShortPeriod = diffDays <= 31;

  if (isShortPeriod) {
    const buckets: Array<{ key: string; label: string }> = [];
    const cursor = new Date(startCutoff);

    while (cursor <= endCutoff) {
      buckets.push({
        key: `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`,
        label: `${String(cursor.getDate()).padStart(2, '0')}/${String(
          cursor.getMonth() + 1
        ).padStart(2, '0')}`,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return {
      isShortPeriod,
      buckets,
      getKey: (date: Date) =>
        `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    };
  }

  const monthNames = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  const buckets: Array<{ key: string; label: string }> = [];
  const cursor = new Date(startCutoff.getFullYear(), startCutoff.getMonth(), 1);

  while (cursor <= endCutoff) {
    buckets.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      label: `${monthNames[cursor.getMonth()]}/${String(cursor.getFullYear()).slice(-2)}`,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return {
    isShortPeriod,
    buckets,
    getKey: (date: Date) => `${date.getFullYear()}-${date.getMonth()}`,
  };
}

export function processDerivedData(
  rawData: RawEvidenceData,
  filters: EvidenceFilters,
  geocodeCache: Record<string, [number, number]>
): DashboardDerivedData {
  const emptyResult: DashboardDerivedData = {
    stats: {
      totalUsers: 0,
      attendedCities: 0,
      totalEngagements: 0,
      attentionCount: 0,
      totalEstimatedHours: 0,
      signedAgreements: 0,
    },
    engagementTimelineData: [],
    workloadTimelineData: [],
    statusData: STATUS_ORDER.map((name) => ({ name, value: 0 })),
    upcomingEngagements: [],
    insights: [],
    organizationData: [],
    geoData: [],
    pillarsData: [],
    activityData: [],
    municipalityChartData: [],
  };

  if (!rawData.engagements.length) return emptyResult;

  const { auth, profiles, engagements } = rawData;
  const now = new Date();
  const startCutoff = filters.startDate
    ? new Date(`${filters.startDate}T00:00:00`)
    : new Date(2000, 0, 1);
  const endCutoff = filters.endDate
    ? new Date(`${filters.endDate}T23:59:59`)
    : now;

  const profileMap = new Map<string, UserProfile>(
    profiles.map((profile) => [profile.id, profile])
  );
  const authById = new Map<string, UserAuth>(auth.map((user) => [user.id, user]));

  const activeDimensionFilters = [
    { key: 'vertical' as const, filter: filters.vertical },
    { key: 'horizontal' as const, filter: filters.horizontal },
    { key: 'transversal' as const, filter: filters.transversal },
  ].filter(({ filter }) => filter.enabled);

  const matchesDimensionFilters = (engagement: Engagement) =>
    activeDimensionFilters.every(({ key, filter }) => {
      if (!filter.values.length) return true;
      const selected = new Set(filter.values.map((value) => value.trim()));
      const engagementValues = ((engagement as unknown as Record<string, unknown>)[key] as
        | string[]
        | undefined) ?? [];
      return engagementValues.some((value) => selected.has(value?.trim()));
    });

  const engagementSearch = normalizeText(filters.engagementSearch);
  const matchesEngagementSearch = (engagement: Engagement) =>
    !engagementSearch || normalizeText(engagement.title) === engagementSearch;

  // Escopo sem filtro temporal: usado para agenda futura, preservando busca e dimensões.
  const scopedEngagements = engagements.filter(
    (engagement) =>
      matchesDimensionFilters(engagement) && matchesEngagementSearch(engagement)
  );

  // Escopo principal do dashboard: respeita também o período selecionado.
  const filteredEngagements = scopedEngagements.filter((engagement) => {
    const engagementDate = getEngagementDate(engagement);
    return engagementDate >= startCutoff && engagementDate <= endCutoff;
  });

  const relatedUserIds = new Set<string>();
  filteredEngagements.forEach((engagement) => {
    if (INCLUDE_CREATOR_AS_PARTICIPANT && engagement.created_by) {
      relatedUserIds.add(engagement.created_by);
    }
    (engagement.engagement_participants ?? []).forEach((participant) => {
      const userId = participant.user_id?.trim();
      if (userId) relatedUserIds.add(userId);
    });
  });

  const filteredProfiles = profiles.filter((profile) => relatedUserIds.has(profile.id));
  const filteredMunicipalities = filteredProfiles
    .map((profile) => normalizeMunicipality(profile.municipality))
    .filter(Boolean);

  const attentionEngagements = filteredEngagements.filter((engagement) => {
    const status = normalizeStatus(engagement.status);
    const eventDate = getEngagementDate(engagement);
    return eventDate < now && (status === 'Planejado' || status === 'Pendente');
  });

  const signedAgreements = filteredEngagements.filter((engagement) =>
    Array.isArray(engagement.planned_activities)
      ? engagement.planned_activities.some(
          (activity) => activity?.trim() === 'Reunião de Adesão ao Convênio'
        )
      : false
  ).length;

  const totalEstimatedHours = filteredEngagements.reduce(
    (total, engagement) => total + getDuration(engagement),
    0
  );

  const stats = {
    totalUsers: filteredProfiles.length,
    attendedCities: new Set(filteredMunicipalities).size,
    totalEngagements: filteredEngagements.length,
    attentionCount: attentionEngagements.length,
    totalEstimatedHours: +totalEstimatedHours.toFixed(1),
    signedAgreements,
  };

  // Linha do tempo por status — não acumulativa.
  const timelineBuckets = buildTimelineBuckets(startCutoff, endCutoff);
  const timelineMap = new Map<string, DashboardTimelineRow>();
  const workloadMap = new Map<string, DashboardWorkloadRow>();

  timelineBuckets.buckets.forEach(({ key, label }) => {
    timelineMap.set(key, {
      name: label,
      Planejado: 0,
      Pendente: 0,
      Concluído: 0,
      Cancelado: 0,
      Outro: 0,
      total: 0,
    });
    workloadMap.set(key, { name: label, horas: 0 });
  });

  const statusCounts: Record<DashboardStatusName, number> = {
    Planejado: 0,
    Pendente: 0,
    Concluído: 0,
    Cancelado: 0,
    Outro: 0,
  };

  filteredEngagements.forEach((engagement) => {
    const eventDate = getEngagementDate(engagement);
    const key = timelineBuckets.getKey(eventDate);
    const status = normalizeStatus(engagement.status);
    const timelineRow = timelineMap.get(key);
    const workloadRow = workloadMap.get(key);

    statusCounts[status] += 1;
    if (timelineRow) {
      timelineRow[status] += 1;
      timelineRow.total += 1;
    }
    if (workloadRow) {
      workloadRow.horas += getDuration(engagement);
    }
  });

  const engagementTimelineData = Array.from(timelineMap.values());
  const workloadTimelineData = Array.from(workloadMap.values()).map((row) => ({
    ...row,
    horas: +row.horas.toFixed(1),
  }));
  const statusData = STATUS_ORDER.map((name) => ({
    name,
    value: statusCounts[name],
  })).filter((item) => item.value > 0 || item.name !== 'Outro');

  // Agenda futura independente do filtro temporal, mas respeitando busca e dimensões.
  const upcomingLimit = new Date(now);
  upcomingLimit.setDate(upcomingLimit.getDate() + 30);

  const upcomingEngagements = scopedEngagements
    .filter((engagement) => {
      const eventDate = getEngagementDate(engagement);
      const status = normalizeStatus(engagement.status);
      return (
        eventDate > now &&
        eventDate <= upcomingLimit &&
        status !== 'Cancelado' &&
        status !== 'Concluído'
      );
    })
    .sort((a, b) => getEngagementDate(a).getTime() - getEngagementDate(b).getTime())
    .slice(0, 6)
    .map((engagement) => ({
      id: engagement.id,
      title: engagement.title || 'Engajamento sem título',
      eventDate: (engagement.event_date || engagement.created_at) as string,
      status: engagement.status || 'Sem status',
      location: (engagement as Engagement & { location?: string }).location,
    }));

  // Agrupamentos de participantes, organizações e municípios.
  const organizationGroups: Record<
    string,
    {
      count: number;
      prettyName: string;
      types: Record<string, number>;
      members: string[];
    }
  > = {};

  const cityGroups: Record<
    string,
    { count: number; name: string; members: string[]; institutions: Set<string> }
  > = {};

  filteredProfiles.forEach((profile) => {
    const memberName = profile.full_name?.trim() || 'Usuário sem nome';
    const rawOrg = profile.institution_organization?.trim();

    if (rawOrg) {
      const normalizedOrg = normalizeText(rawOrg);
      const orgType = profile.organization_type?.trim() || 'Não informado';
      if (!organizationGroups[normalizedOrg]) {
        organizationGroups[normalizedOrg] = {
          count: 0,
          prettyName:
            rawOrg.length <= 4
              ? rawOrg.toUpperCase()
              : rawOrg.charAt(0).toUpperCase() + rawOrg.slice(1),
          types: {},
          members: [],
        };
      }
      organizationGroups[normalizedOrg].count += 1;
      organizationGroups[normalizedOrg].types[orgType] =
        (organizationGroups[normalizedOrg].types[orgType] ?? 0) + 1;
      if (!organizationGroups[normalizedOrg].members.includes(memberName)) {
        organizationGroups[normalizedOrg].members.push(memberName);
      }
    }

    const city = normalizeMunicipality(profile.municipality);
    if (city) {
      if (!cityGroups[city]) {
        cityGroups[city] = {
          count: 0,
          name: city,
          members: [],
          institutions: new Set<string>(),
        };
      }
      cityGroups[city].count += 1;
      cityGroups[city].members.push(memberName);
      if (rawOrg) cityGroups[city].institutions.add(rawOrg);
    }
  });

  const sortedOrganizations = Object.values(organizationGroups).sort(
    (a, b) => b.count - a.count
  );
  const organizationData: DashboardOrganizationMetric[] = sortedOrganizations
    .slice(0, 8)
    .map((item) => ({
      name: item.prettyName,
      value: item.count,
      orgType:
        Object.entries(item.types).sort((a, b) => b[1] - a[1])[0]?.[0] ??
        'Não informado',
      members: [...item.members].sort((a, b) =>
        a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
      ),
    }));

  const verticalCounts: Record<string, number> = {};
  const horizontalCounts: Record<string, number> = {};
  const transversalCounts: Record<string, number> = {};
  const activityCounts: Record<string, number> = {};

  type ParticipantData = DashboardMunicipalityParticipant;
  const municipalityBuckets: Record<
    string,
    {
      engagementIds: Set<string>;
      totalHours: number;
      verticalHours: number;
      horizontalHours: number;
      transversalHours: number;
      participants: Record<string, ParticipantData>;
    }
  > = {};

  const ensureMunicipalityBucket = (municipality: string) => {
    if (!municipalityBuckets[municipality]) {
      municipalityBuckets[municipality] = {
        engagementIds: new Set<string>(),
        totalHours: 0,
        verticalHours: 0,
        horizontalHours: 0,
        transversalHours: 0,
        participants: {},
      };
    }
    return municipalityBuckets[municipality];
  };

  const addParticipantData = (
    municipality: string,
    participantKey: string,
    email: string,
    name: string,
    role: string
  ) => {
    if (!municipality) return;
    const bucket = ensureMunicipalityBucket(municipality);
    bucket.participants[participantKey] = {
      email,
      name,
      role,
      municipality,
    };
  };

  filteredEngagements.forEach((engagement) => {
    const duration = getDuration(engagement);

    const verticalItems = (engagement.vertical ?? [])
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));
    const horizontalItems = (engagement.horizontal ?? [])
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));
    const transversalItems = (engagement.transversal ?? [])
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));

    verticalItems.forEach((value) => {
      verticalCounts[value] = (verticalCounts[value] ?? 0) + 1;
    });
    horizontalItems.forEach((value) => {
      horizontalCounts[value] = (horizontalCounts[value] ?? 0) + 1;
    });
    transversalItems.forEach((value) => {
      transversalCounts[value] = (transversalCounts[value] ?? 0) + 1;
    });
    (engagement.planned_activities ?? []).forEach((activity) => {
      const value = activity?.trim();
      if (value) activityCounts[value] = (activityCounts[value] ?? 0) + 1;
    });

    const associatedMunicipalities = new Set<string>();

    (engagement.engagement_participants ?? []).forEach((participant) => {
      const userId = participant.user_id?.trim();
      if (!userId) return;

      const participantAuth = authById.get(userId);
      const profile = profileMap.get(userId);
      const municipality = normalizeMunicipality(profile?.municipality);
      if (!municipality) return;

      addParticipantData(
        municipality,
        userId,
        participantAuth?.email?.trim().toLowerCase() || '',
        profile?.full_name?.trim() || 'Usuário sem perfil',
        profile?.job_title?.trim() || 'Sem função'
      );
      associatedMunicipalities.add(municipality);
    });

    if (INCLUDE_CREATOR_AS_PARTICIPANT && engagement.created_by) {
      const creatorProfile = profileMap.get(engagement.created_by);
      const creatorAuth = authById.get(engagement.created_by);
      const municipality = normalizeMunicipality(creatorProfile?.municipality);

      if (creatorProfile && municipality) {
        addParticipantData(
          municipality,
          engagement.created_by,
          creatorAuth?.email?.trim().toLowerCase() || '',
          creatorProfile.full_name?.trim() || 'Usuário sem nome',
          creatorProfile.job_title?.trim() || 'Criador do engajamento'
        );
        associatedMunicipalities.add(municipality);
      }
    }

    associatedMunicipalities.forEach((municipality) => {
      const bucket = ensureMunicipalityBucket(municipality);
      if (bucket.engagementIds.has(engagement.id)) return;

      bucket.engagementIds.add(engagement.id);
      bucket.totalHours += duration;
      if (verticalItems.length) bucket.verticalHours += duration;
      if (horizontalItems.length) bucket.horizontalHours += duration;
      if (transversalItems.length) bucket.transversalHours += duration;
    });
  });

  const municipalityChartData: DashboardMunicipalityMetric[] = Object.entries(
    municipalityBuckets
  )
    .map(([municipality, bucket]) => ({
      municipality,
      count: Object.keys(bucket.participants).length,
      engagementCount: bucket.engagementIds.size,
      totalHours: +bucket.totalHours.toFixed(1),
      verticalHours: +bucket.verticalHours.toFixed(1),
      horizontalHours: +bucket.horizontalHours.toFixed(1),
      transversalHours: +bucket.transversalHours.toFixed(1),
      participants: Object.values(bucket.participants).sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
      ),
    }))
    .sort((a, b) => b.engagementCount - a.engagementCount || b.count - a.count);

  const municipalityByName = new Map(
    municipalityChartData.map((item) => [item.municipality, item])
  );

  const geoData: DashboardGeoPoint[] = Object.values(cityGroups)
    .map((city) => {
      const coordinates = geocodeCache[city.name];
      if (!coordinates) return null;
      const municipalityMetric = municipalityByName.get(city.name);
      return {
        name: city.name,
        count: city.count,
        coordinates,
        members: [...city.members].sort((a, b) =>
          a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
        ),
        engagementCount: municipalityMetric?.engagementCount ?? 0,
        institutionCount: city.institutions.size,
        totalHours: municipalityMetric?.totalHours ?? 0,
      };
    })
    .filter((item): item is DashboardGeoPoint => Boolean(item))
    .sort((a, b) => b.count - a.count);

  const pillarsData: DashboardPillarGroup[] = [
    { category: 'Verticais', items: formatGroup(verticalCounts) },
    { category: 'Horizontais', items: formatGroup(horizontalCounts) },
    { category: 'Transversais', items: formatGroup(transversalCounts) },
  ].filter((pillar) => pillar.items.length > 0) as DashboardPillarGroup[];

  const activityData = formatGroup(activityCounts);

  const insights: DashboardInsight[] = [];
  if (attentionEngagements.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Engajamentos requerem atenção',
      value: attentionEngagements.length,
      description: `${attentionEngagements.length} engajamento${
        attentionEngagements.length === 1 ? '' : 's'
      } permanece${attentionEngagements.length === 1 ? '' : 'm'} Planejado/Pendente após a data prevista.`,
    });
  }

  const upcoming15Days = scopedEngagements.filter((engagement) => {
    const eventDate = getEngagementDate(engagement);
    const status = normalizeStatus(engagement.status);
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 15);
    return (
      eventDate > now &&
      eventDate <= limit &&
      status !== 'Cancelado' &&
      status !== 'Concluído'
    );
  }).length;

  if (upcoming15Days > 0) {
    insights.push({
      type: 'info',
      title: 'Agenda dos próximos 15 dias',
      value: upcoming15Days,
      description: `${upcoming15Days} engajamento${upcoming15Days === 1 ? '' : 's'} programado${
        upcoming15Days === 1 ? '' : 's'
      } para os próximos 15 dias.`,
    });
  }

  if (statusCounts.Cancelado > 0) {
    const cancellationRate = filteredEngagements.length
      ? (statusCounts.Cancelado / filteredEngagements.length) * 100
      : 0;
    insights.push({
      type: 'info',
      title: 'Cancelamentos no período',
      value: statusCounts.Cancelado,
      description: `${statusCounts.Cancelado} cancelamento${
        statusCounts.Cancelado === 1 ? '' : 's'
      }, equivalente${statusCounts.Cancelado === 1 ? '' : 's'} a ${cancellationRate.toFixed(
        1
      )}% dos engajamentos selecionados.`,
    });
  }


  if (!insights.length && filteredEngagements.length > 0) {
    insights.push({
      type: 'success',
      title: 'Sem alertas operacionais no recorte',
      description:
        'Não foram identificados engajamentos vencidos ou cancelamentos no período selecionado.',
    });
  }

  return {
    stats,
    engagementTimelineData,
    workloadTimelineData,
    statusData,
    upcomingEngagements,
    insights: insights.slice(0, 4),
    organizationData,
    geoData,
    pillarsData,
    activityData,
    municipalityChartData,
  };
}