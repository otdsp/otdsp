import { UserAuth, UserProfile, Engagement, EvidenceFilters, OrgGroup, DerivedEvidenceData } from '../types';

export type RawEvidenceData = {
  auth: UserAuth[];
  profiles: UserProfile[];
  engagements: Engagement[];
};

export function processDerivedData(
  rawData: RawEvidenceData,
  filters: EvidenceFilters,
  geocodeCache: Record<string, [number, number]>
): DerivedEvidenceData {
  const emptyResult: DerivedEvidenceData = {
    stats: { totalUsers: 0, attendedCities: 0, totalEngagements: 0, signedAgreements: 0 },
    timelineData: [],
    engagementTimelineData: [],
    referralData: [],
    organizationData: [],
    geoData: [],
    pillarsData: [],
    durationChart: [],
    municipalityChartData: []
  };

  // Retorna vazio se não houver dados para processar
  if (!rawData.auth.length && !rawData.profiles.length) return emptyResult;

  const { auth, profiles, engagements } = rawData;

  // 1. Mapeamentos iniciais para busca rápida (O(1))
  const profileMap = new Map<string, UserProfile>(
    profiles.map((profile) => [profile.id, profile])
  );

  const authById = new Map<string, UserAuth>(
    auth.map((user) => [user.id, user])
  );

  // 2. Lógica Dinâmica de Limites de Data
  const startCutoff = filters.startDate ? new Date(filters.startDate + 'T00:00:00') : new Date(2000, 0, 1);
  const endCutoff = filters.endDate ? new Date(filters.endDate + 'T23:59:59') : new Date();

  // Considere o filtro ativo apenas pelo booleano 'enabled'
  const activeDimensionFilters = [
    { key: 'vertical' as const, filter: filters.vertical },
    { key: 'horizontal' as const, filter: filters.horizontal },
    { key: 'transversal' as const, filter: filters.transversal }
  ].filter(({ filter }) => filter.enabled);

  const matchesDimensionFilters = (engagement: Engagement) => {
    return activeDimensionFilters.every(({ key, filter }) => {
      if (filter.values.length === 0) return true;

      const selectedValues = filter.values.map((value) => value.trim());
      const engagementValues = ((engagement as unknown as Record<string, unknown>)[key] as string[] || []).map((value) => value.trim());
      
      return engagementValues.some((value) => selectedValues.includes(value));
    });
  };

  // Normaliza textos para permitir busca sem diferença de maiúsculas/minúsculas e acentos.
  const normalizeText = (value?: string | null) =>
    (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const engagementSearch = normalizeText(
    filters.engagementSearch
  );

  const hasEngagementSearch =
    engagementSearch.length > 0;

  const matchesEngagementSearch = (engagement: Engagement) => {
    if (!hasEngagementSearch) {
      return true;
    }

    return normalizeText(engagement.title) === engagementSearch;
  };

  // 3. Filtragem de base
  const baseAuth = auth.filter(u => {
    const userDate = new Date(u.date_joined);
    return userDate >= startCutoff && userDate <= endCutoff;
  });


  const getEngagementPeriodDate = (engagement: Engagement) => {
    const rawDate = engagement.event_date || engagement.created_at;
    return rawDate ? new Date(rawDate) : new Date(0);
  };

  const scopedEngagements = engagements.filter((engagement) => {
    const dimensionOk = activeDimensionFilters.length === 0 || matchesDimensionFilters(engagement);
    const engagementSearchOk = matchesEngagementSearch(engagement);
    return dimensionOk && engagementSearchOk;
  });

  const filteredEngagements = scopedEngagements.filter((engagement) => {
    const engagementDate = getEngagementPeriodDate(engagement);
    return (engagementDate >= startCutoff && engagementDate <= endCutoff);
  });

  const relatedUserIds = new Set<string>();

  filteredEngagements.forEach((engagement) => {
    if (engagement.created_by) {
      relatedUserIds.add(engagement.created_by);
    }

    (engagement.engagement_participants ?? []).forEach((participant) => {
      const userId = participant.user_id?.trim();
      if (!userId) return;

      relatedUserIds.add(userId);
    });
  });

  const filteredAuth = baseAuth.filter((user) => relatedUserIds.has(user.id));
  const filteredProfiles = profiles.filter((profile) => relatedUserIds.has(profile.id));

  const signedCount = filteredEngagements.filter(e => 
    Array.isArray(e.planned_activities) && 
    e.planned_activities.some(activity => activity?.trim() === "Reunião de Adesão ao Convênio")
  ).length;

  const stats = {
    totalUsers: filteredProfiles.length,
    attendedCities: new Set(filteredProfiles.map(p => p.municipality)).size,
    totalEngagements: filteredEngagements.length,
    signedAgreements: signedCount
  };

  // 4. Lógica de Timelines (Diário vs Mensal)
  const diffTime = Math.abs(endCutoff.getTime() - startCutoff.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isShortPeriod = diffDays <= 30;
  
  let timelineArr: { name: string; Membros: number }[] = [];
  let engagementTimelineArr: { name: string; Engajamentos: number }[] = [];

  if (isShortPeriod) {
    const dayList = [];
    const loopDate = new Date(startCutoff);
    
    while (loopDate <= endCutoff) {
      dayList.push({
        key: `${loopDate.getFullYear()}-${loopDate.getMonth()}-${loopDate.getDate()}`,
        label: `${String(loopDate.getDate()).padStart(2, '0')}/${String(loopDate.getMonth() + 1).padStart(2, '0')}`
      });
      loopDate.setDate(loopDate.getDate() + 1);
    }

    const authDaily: Record<string, number> = {};
    const engDaily: Record<string, number> = {};
    dayList.forEach(d => { authDaily[d.key] = 0; engDaily[d.key] = 0; });

    let authAcc = hasEngagementSearch
      ? auth.filter(
          (u) =>
            relatedUserIds.has(u.id) &&
            new Date(u.date_joined) < startCutoff
        ).length
      : auth.filter(
          (u) =>
            new Date(u.date_joined) < startCutoff
        ).length;

    let engAcc = hasEngagementSearch
      ? scopedEngagements.filter(
          (e) =>
            getEngagementPeriodDate(e) <
            startCutoff
        ).length
      : engagements.filter(
          (e) =>
            getEngagementPeriodDate(e) <
            startCutoff
        ).length;

    filteredAuth.forEach(u => {
      if (u.date_joined) {
        const dt = new Date(u.date_joined);
        const k = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
        if (authDaily[k] !== undefined) authDaily[k]++;
      }
    });

    filteredEngagements.forEach(e => {
      const rawDate = e.event_date || e.created_at;
      if (rawDate) {
        const dt = new Date(rawDate);
        const k = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
        if (engDaily[k] !== undefined) engDaily[k]++;
      }
    });

    timelineArr = dayList.map(d => { authAcc += authDaily[d.key]; return { name: d.label, Membros: authAcc }; });
    engagementTimelineArr = dayList.map(d => { engAcc += engDaily[d.key]; return { name: d.label, Engajamentos: engAcc }; });

  } else {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthList = [];
    const loopDate = new Date(startCutoff.getFullYear(), startCutoff.getMonth(), 1);

    while (loopDate <= endCutoff) {
      monthList.push({ 
        key: `${loopDate.getFullYear()}-${loopDate.getMonth()}`, 
        label: `${monthNames[loopDate.getMonth()]}/${String(loopDate.getFullYear()).slice(-2)}` 
      });
      loopDate.setMonth(loopDate.getMonth() + 1);
    }

    const authMonthly: Record<string, number> = {};
    const engMonthly: Record<string, number> = {};
    monthList.forEach(m => { authMonthly[m.key] = 0; engMonthly[m.key] = 0; });

    let authAcc = hasEngagementSearch
      ? auth.filter(
          (u) =>
            relatedUserIds.has(u.id) &&
            new Date(u.date_joined) < startCutoff
        ).length
      : auth.filter(
          (u) =>
            new Date(u.date_joined) < startCutoff
        ).length;

    let engAcc = hasEngagementSearch
      ? scopedEngagements.filter(
          (e) =>
            getEngagementPeriodDate(e) <
            startCutoff
        ).length
      : engagements.filter(
          (e) =>
            getEngagementPeriodDate(e) <
            startCutoff
        ).length;

    filteredAuth.forEach(u => {
      if (u.date_joined) {
        const dt = new Date(u.date_joined);
        const k = `${dt.getFullYear()}-${dt.getMonth()}`;
        if (authMonthly[k] !== undefined) authMonthly[k]++;
      }
    });

    filteredEngagements.forEach(e => {
      const rawDate = e.event_date || e.created_at;
      if (rawDate) {
        const dt = new Date(rawDate);
        const k = `${dt.getFullYear()}-${dt.getMonth()}`;
        if (engMonthly[k] !== undefined) engMonthly[k]++;
      }
    });

    timelineArr = monthList.map(m => { authAcc += authMonthly[m.key]; return { name: m.label, Membros: authAcc }; });
    engagementTimelineArr = monthList.map(m => { engAcc += engMonthly[m.key]; return { name: m.label, Engajamentos: engAcc }; });
  }

  // 5. Agrupamentos (Referrals, Organizações, Cidades)
  const referralCounts: Record<string, number> = {};
  const orgGroups: Record<string, OrgGroup> = {};
  const cityGroups: Record<string, { count: number, name: string }> = {};

  filteredProfiles.forEach(p => {
    if (p.referral_source) referralCounts[p.referral_source] = (referralCounts[p.referral_source] || 0) + 1;
    
    if (p.institution_organization) {
      const rawOrg = p.institution_organization.trim();
      const normOrg = rawOrg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const currentType = p.organization_type ? p.organization_type.trim() : 'Não informado';
      
      if (normOrg) {
        if (!orgGroups[normOrg]) {
          orgGroups[normOrg] = {
            count: 0,
            prettyName: rawOrg.length <= 4 ? rawOrg.toUpperCase() : rawOrg.charAt(0).toUpperCase() + rawOrg.slice(1),
            types: {},
            members: []
          };
        }
        orgGroups[normOrg].count++;
        orgGroups[normOrg].types[currentType] = (orgGroups[normOrg].types[currentType] || 0) + 1;
        const memberName = p.full_name?.trim() || 'Usuário sem nome';
        if (!orgGroups[normOrg].members.includes(memberName)) {
          orgGroups[normOrg].members.push(memberName);
        }
      }
    }

    if (p.municipality) {
      const normCity = p.municipality.trim().charAt(0).toUpperCase() + p.municipality.trim().slice(1);
      if (!cityGroups[normCity]) cityGroups[normCity] = { count: 0, name: normCity };
      cityGroups[normCity].count++;
    }
  });

  const referralData = Object.entries(referralCounts).map(([name, value]) => ({ name, value }));

  const sortedOrgs = Object.values(orgGroups).sort((a, b) => b.count - a.count);
  const organizationData = sortedOrgs.slice(0, 5).map((item) => ({
    name: item.prettyName,
    value: item.count,
    orgType: Object.entries(item.types).sort((a, b) => b[1] - a[1])[0][0],
    members: item.members
  }));
  
  const remainderOrgs = sortedOrgs.slice(5);
  if (remainderOrgs.length > 0) {
    let rCount = 0;
    const rTypes: Record<string, number> = {};
    remainderOrgs.forEach((item) => {
      rCount += item.count;
      Object.entries(item.types).forEach(([t, c]) => { rTypes[t] = (rTypes[t] || 0) + c; });
    });
    const topRTypes = Object.entries(rTypes).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]).join(', ');
    organizationData.push({ 
      name: 'Outras', 
      value: rCount, 
      orgType: topRTypes || 'Diversos', 
      members: remainderOrgs.flatMap(item => item.members) 
    });
  }

  // 6. Dados Geográficos
  const localGeoData: { name: string; count: number; coordinates: [number, number] }[] = [];
  Object.values(cityGroups).forEach((c) => {
    const coords = geocodeCache[c.name];
    if (coords) localGeoData.push({ name: c.name, count: c.count, coordinates: coords });
  });

  // 7. Agrupamentos de Engajamento e Municípios
  const iCounts: Record<string, number> = {};
  const tCounts: Record<string, number> = {};
  const pCounts: Record<string, number> = {};
  const paCounts: Record<string, number> = {};
  
  const horizDurMap: Record<string, { total: number; count: number }> = {};
  const vertDurMap: Record<string, { total: number; count: number }> = {};
  const transDurMap: Record<string, { total: number; count: number }> = {};

  type ParticipantData = {
    email: string;
    name: string;
    role: string;
    municipality: string;
  };

  const municipalityBuckets: Record<string, {
    engagementIds: Set<string>;
    horizontalEngagements: Set<string>;
    verticalEngagements: Set<string>;
    transversalEngagements: Set<string>;
    participants: Record<string, ParticipantData>;
  }> = {};

  const ensureMunicipalityBucket = (municipality: string) => {
    if (!municipalityBuckets[municipality]) {
      municipalityBuckets[municipality] = {
        engagementIds: new Set(),
        horizontalEngagements: new Set(),
        verticalEngagements: new Set(),
        transversalEngagements: new Set(),
        participants: {}
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
    const bucket = ensureMunicipalityBucket(municipality);
    bucket.participants[participantKey] = { email, name, role, municipality };
  };

  filteredEngagements.forEach(eng => {
    const dur = typeof eng.estimated_duration === 'number' ? eng.estimated_duration : Number(eng.estimated_duration) || 0;
    
    if (Array.isArray(eng.horizontal)) eng.horizontal.forEach(i => { if (i) { const k = i.trim(); tCounts[k] = (tCounts[k] || 0) + 1; const cur = horizDurMap[k] || { total: 0, count: 0 }; cur.total += dur; cur.count += 1; horizDurMap[k] = cur; } });
    if (Array.isArray(eng.vertical)) eng.vertical.forEach(t => { if (t) { const k = t.trim(); iCounts[k] = (iCounts[k] || 0) + 1; const cur = vertDurMap[k] || { total: 0, count: 0 }; cur.total += dur; cur.count += 1; vertDurMap[k] = cur; } });
    if (Array.isArray(eng.transversal)) eng.transversal.forEach(p => { if (p) { const k = p.trim(); pCounts[k] = (pCounts[k] || 0) + 1; const cur = transDurMap[k] || { total: 0, count: 0 }; cur.total += dur; cur.count += 1; transDurMap[k] = cur; } });
    if (Array.isArray(eng.planned_activities)) eng.planned_activities.forEach(activity => { if (activity) { const k = activity.trim(); paCounts[k] = (paCounts[k] || 0) + 1; } });

    const hasHorizontal = Array.isArray(eng.horizontal) && eng.horizontal.some((value) => value?.trim());
    const hasVertical = Array.isArray(eng.vertical) && eng.vertical.some((value) => value?.trim());
    const hasTransversal = Array.isArray(eng.transversal) && eng.transversal.some((value) => value?.trim());

    const associatedMunicipalities = new Set<string>();

    if (Array.isArray(eng.engagement_participants)) {
      eng.engagement_participants.forEach((participant) => {
        const userId = participant.user_id?.trim();
        if (!userId) return;

        // Correlação estritamente por UUID:
        // engagement_participants.user_id -> user_auth.id -> user_profile.id
        const participantAuth = authById.get(userId);
        const profile = profileMap.get(userId);

        // Um participante sem perfil continua sendo contabilizado.
        const municipality = profile?.municipality?.trim().replace(/\s+/g, ' ') || 'Não informado';
        const email = participantAuth?.email?.trim().toLowerCase() || '';
        const name = profile?.full_name?.trim() || 'Usuário sem perfil';
        const role = profile?.job_title?.trim() || 'Sem função';

        // A chave de deduplicação é o UUID, nunca o e-mail.
        addParticipantData(municipality, userId, email, name, role);
        associatedMunicipalities.add(municipality);
      });
    }

    const creatorProfile = profileMap.get(eng.created_by);
    const creatorAuth = authById.get(eng.created_by);

    if (creatorProfile) {
      const municipality = creatorProfile.municipality?.trim().replace(/\s+/g, ' ') || 'Não informado';
      const email = creatorAuth?.email?.trim().toLowerCase() || '';
      const name = creatorProfile.full_name?.trim() || 'Usuário sem nome';
      const role = creatorProfile.job_title?.trim() || 'Criador do engajamento';

      addParticipantData(municipality, eng.created_by, email, name, role);
      associatedMunicipalities.add(municipality);
    }

    associatedMunicipalities.forEach((municipality) => {
      const bucket = ensureMunicipalityBucket(municipality);
      bucket.engagementIds.add(eng.id);
      if (hasHorizontal) bucket.horizontalEngagements.add(eng.id);
      if (hasVertical) bucket.verticalEngagements.add(eng.id);
      if (hasTransversal) bucket.transversalEngagements.add(eng.id);
    });
  });

  const municipalityChartData = Object.entries(municipalityBuckets)
    .map(([municipality, bucket]) => {
      const participantsList = Object.values(bucket.participants).sort((a, b) => a.name.localeCompare(b.name));
      return {
        municipality,
        count: participantsList.length,
        horizontalCount: bucket.horizontalEngagements.size,
        verticalCount: bucket.verticalEngagements.size,
        transversalCount: bucket.transversalEngagements.size,
        participants: participantsList
      };
    })
    .sort((a, b) => b.count - a.count);

  const formatGroup = (obj: Record<string, number>) => Object.entries(obj).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  
  const pillarsData = [
    { category: 'Áreas de Atuação', items: formatGroup(iCounts) },
    { category: 'Tecnologias', items: formatGroup(tCounts) },
    { category: 'Políticas Transversais', items: formatGroup(pCounts) },
    { category: 'Atividades Planejadas', items: formatGroup(paCounts) }
  ].filter(p => p.items.length > 0);

  const formatAvg = (map: Record<string, { total: number; count: number }>, enabled: boolean, allowed: string[]) => {
    const allowedSet = new Set(allowed.map(a => a.trim()));
    const arr = Object.entries(map).map(([label, v]) => ({ label: label.trim(), value: +(v.count > 0 ? (v.total / v.count) : 0).toFixed(2) }));
    const filtered = enabled && allowed.length > 0 ? arr.filter(x => allowedSet.has(x.label)) : arr;
    return filtered.sort((a, b) => b.value - a.value);
  };

  let durationChart = [
    { dimension: 'Horizontal', color: '#1f77b4', data: formatAvg(horizDurMap, filters.horizontal.enabled, filters.horizontal.values) },
    { dimension: 'Vertical', color: '#10b981', data: formatAvg(vertDurMap, filters.vertical.enabled, filters.vertical.values) },
    { dimension: 'Transversal', color: '#ff7f0e', data: formatAvg(transDurMap, filters.transversal.enabled, filters.transversal.values) }
  ];

  const selectedUnionArr: string[] = [];
  if (filters.horizontal.enabled && filters.horizontal.values.length) selectedUnionArr.push(...filters.horizontal.values.map(v => v.trim()));
  if (filters.vertical.enabled && filters.vertical.values.length) selectedUnionArr.push(...filters.vertical.values.map(v => v.trim()));
  if (filters.transversal.enabled && filters.transversal.values.length) selectedUnionArr.push(...filters.transversal.values.map(v => v.trim()));
  
  const selectedUnionSet = new Set(selectedUnionArr);
  if (selectedUnionSet.size > 0) {
    durationChart = durationChart.map(s => ({ ...s, data: s.data.filter(d => selectedUnionSet.has(d.label)) }));
  }

  // 8. Retorno dos Dados Processados
  return { 
    stats, 
    timelineData: timelineArr, 
    engagementTimelineData: engagementTimelineArr, 
    referralData, 
    organizationData, 
    geoData: localGeoData, 
    pillarsData,
    durationChart,
    municipalityChartData
  };
}