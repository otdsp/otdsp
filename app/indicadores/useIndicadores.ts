'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { UserAuth, UserProfile, Engagement, OrgGroup } from './types';

export function useIndicadores() {
  const router = useRouter();
  const [geocodeCache, setGeocodeCache] = useState<Record<string, [number, number]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const [rawData, setRawData] = useState<{ auth: UserAuth[]; profiles: UserProfile[]; engagements: Engagement[] }>({
    auth: [], profiles: [], engagements: []
  });

  // Alterado: O estado agora controla as datas limites explicitamente
  const [filters, setFilters] = useState({
    startDate: '2026-04-01', // String em formato YYYY-MM-DD ou vazio
    endDate: '',             // String em formato YYYY-MM-DD ou vazio
    orgType: 'all',
    status: 'all',
    geography: 'all'
  });

  const [filterOptions, setFilterOptions] = useState({
    orgTypes: [] as string[],
    statuses: [] as string[],
    geographies: [] as string[]
  });

  useEffect(() => {
    const fetchRawData = async () => {
      const [ { data: authData }, { data: profileData }, { data: engData } ] = await Promise.all([
        supabase.from('user_auth').select('id, is_active, date_joined'),
        supabase.from('user_profile').select('id, user_id, municipality, referral_source, institution_organization, organization_type'),
        supabase.from('engagements').select('id, created_by, status, interests, technologies, public_policies, planned_activities, created_at')
      ]);

      const safeAuth: UserAuth[] = authData || [];
      const safeProfiles: UserProfile[] = profileData || [];
      const safeEng: Engagement[] = engData || [];

      const uniqueOrgTypes = new Set<string>();
      const uniqueGeographies = new Set<string>();
      const uniqueStatuses = new Set<string>();
      const cityFreq: Record<string, number> = {};

      safeProfiles.forEach((p) => {
        if (p.organization_type) uniqueOrgTypes.add(p.organization_type.trim());
        if (p.municipality) {
          const city = p.municipality.trim().charAt(0).toUpperCase() + p.municipality.trim().slice(1);
          uniqueGeographies.add(city);
          cityFreq[city] = (cityFreq[city] || 0) + 1;
        }
      });
      safeEng.forEach((e) => {
        if (e.status) uniqueStatuses.add(e.status.trim());
      });

      setFilterOptions({
        orgTypes: Array.from(uniqueOrgTypes).sort(),
        geographies: Array.from(uniqueGeographies).sort(),
        statuses: Array.from(uniqueStatuses).sort()
      });

      const topCities = Object.entries(cityFreq).sort((a, b) => b[1] - a[1]).slice(0, 30).map(x => x[0]);
      const newGeoData: Record<string, [number, number]> = {};
      
      await Promise.all(topCities.map(async (city) => {
        try {
          const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&format=json`);
          const json = await res.json();
          if (json.results && json.results.length > 0) {
            newGeoData[city] = [json.results[0].longitude, json.results[0].latitude];
          }
        } catch (e) { 
          console.error(`Erro Geocache: ${city}`); 
        }
      }));

      setGeocodeCache(prev => ({ ...prev, ...newGeoData }));
      setRawData({ auth: safeAuth, profiles: safeProfiles, engagements: safeEng });
    };

    const authenticateAndFetch = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return router.replace('/');

        const { data: userData, error: userError } = await supabase
          .from('user_auth').select('is_staff').eq('id', session.user.id).single();

        if (userError || !userData?.is_staff) return router.replace('/');

        setIsAuthorized(true);
        await fetchRawData();

      } catch (error) {
        console.error("Erro na autenticação:", error);
        router.replace('/');
      } finally {
        setIsLoading(false);
      }
    };

    authenticateAndFetch();
  }, [router]);

  const derivedData = useMemo(() => {
    const emptyResult = {
      stats: { totalUsers: 0, activeUsers: 0, totalEngagements: 0, signedAgreements: 0 },
      timelineData: [] as { name: string; Membros: number }[],
      engagementTimelineData: [] as { name: string; Engajamentos: number }[],
      referralData: [] as { name: string; value: number }[],
      organizationData: [] as { name: string; value: number; orgType: string }[],
      geoData: [] as { name: string; count: number; coordinates: [number, number] }[],
      pillarsData: [] as { category: string; items: { label: string; count: number }[] }[]
    };

    if (!rawData.auth.length && !rawData.profiles.length) return emptyResult;

    const { auth, profiles, engagements } = rawData;
    const profileMap = new Map<string, UserProfile>();
    profiles.forEach(p => { profileMap.set(p.user_id || p.id, p); });

    // Lógica Dinâmica de Limites de Data
    const startCutoff = filters.startDate ? new Date(filters.startDate + 'T00:00:00') : new Date(2000, 0, 1);
    const endCutoff = filters.endDate ? new Date(filters.endDate + 'T23:59:59') : new Date();

    // Filtros aplicados baseados no range selecionado
    const filteredAuth = auth.filter(u => {
      const p = profileMap.get(u.id);
      const userDate = new Date(u.date_joined);
      const dateOk = userDate >= startCutoff && userDate <= endCutoff;
      const orgOk = filters.orgType === 'all' || p?.organization_type?.trim() === filters.orgType;
      const geoOk = filters.geography === 'all' || (p?.municipality && p.municipality.trim().charAt(0).toUpperCase() + p.municipality.trim().slice(1) === filters.geography);
      return dateOk && orgOk && geoOk;
    });

    const validUserIds = new Set(filteredAuth.map(u => u.id));

    const filteredEngagements = engagements.filter(e => {
      const engDate = new Date(e.created_at);
      const dateOk = engDate >= startCutoff && engDate <= endCutoff;
      const statusOk = filters.status === 'all' || e.status?.trim() === filters.status;
      const userOk = validUserIds.has(e.created_by);
      return dateOk && statusOk && userOk;
    });

    const filteredProfiles = profiles.filter(p => validUserIds.has(p.user_id || p.id));

    const signedCount = filteredEngagements.filter(e => 
      Array.isArray(e.planned_activities) && 
      e.planned_activities.some(activity => activity?.trim() === "Reunião de Adesão ao Convênio")
    ).length;

    const stats = {
      totalUsers: filteredAuth.length,
      activeUsers: filteredAuth.filter(u => u.is_active).length,
      totalEngagements: filteredEngagements.length,
      signedAgreements: signedCount
    };

    // Define o comportamento dinâmico do gráfico com base na amplitude dos dias selecionados
    const diffTime = Math.abs(endCutoff.getTime() - startCutoff.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Se o intervalo capturado for menor ou igual a 30 dias, plota dia a dia, caso contrário plota por mês
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

      let authAcc = auth.filter(u => new Date(u.date_joined) < startCutoff).length;
      let engAcc = engagements.filter(e => new Date(e.created_at) < startCutoff).length;

      filteredAuth.forEach(u => {
        if (u.date_joined) {
          const dt = new Date(u.date_joined);
          const k = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
          if (authDaily[k] !== undefined) authDaily[k]++;
        }
      });

      filteredEngagements.forEach(e => {
        if (e.created_at) {
          const dt = new Date(e.created_at);
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

      let authAcc = auth.filter(u => new Date(u.date_joined) < startCutoff).length;
      let engAcc = engagements.filter(e => new Date(e.created_at) < startCutoff).length;

      filteredAuth.forEach(u => {
        if (u.date_joined) {
          const dt = new Date(u.date_joined);
          const k = `${dt.getFullYear()}-${dt.getMonth()}`;
          if (authMonthly[k] !== undefined) authMonthly[k]++;
        }
      });

      filteredEngagements.forEach(e => {
        if (e.created_at) {
          const dt = new Date(e.created_at);
          const k = `${dt.getFullYear()}-${dt.getMonth()}`;
          if (engMonthly[k] !== undefined) engMonthly[k]++;
        }
      });

      timelineArr = monthList.map(m => { authAcc += authMonthly[m.key]; return { name: m.label, Membros: authAcc }; });
      engagementTimelineArr = monthList.map(m => { engAcc += engMonthly[m.key]; return { name: m.label, Engajamentos: engAcc }; });
    }

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
            orgGroups[normOrg] = { count: 0, prettyName: rawOrg.length <= 4 ? rawOrg.toUpperCase() : rawOrg.charAt(0).toUpperCase() + rawOrg.slice(1), types: {} };
          }
          orgGroups[normOrg].count++;
          orgGroups[normOrg].types[currentType] = (orgGroups[normOrg].types[currentType] || 0) + 1;
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
      name: item.prettyName, value: item.count, orgType: Object.entries(item.types).sort((a, b) => b[1] - a[1])[0][0]
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
      organizationData.push({ name: 'Outras', value: rCount, orgType: topRTypes || 'Diversos' });
    }

    const localGeoData: { name: string; count: number; coordinates: [number, number] }[] = [];
    Object.values(cityGroups).forEach((c) => {
      const coords = geocodeCache[c.name];
      if (coords) localGeoData.push({ name: c.name, count: c.count, coordinates: coords });
    });

    const iCounts: Record<string, number> = {};
    const tCounts: Record<string, number> = {};
    const pCounts: Record<string, number> = {};
    
    filteredEngagements.forEach(eng => {
      if (Array.isArray(eng.interests)) eng.interests.forEach(i => { if (i) iCounts[i.trim()] = (iCounts[i.trim()] || 0) + 1; });
      if (Array.isArray(eng.technologies)) eng.technologies.forEach(t => { if (t) tCounts[t.trim()] = (tCounts[t.trim()] || 0) + 1; });
      if (Array.isArray(eng.public_policies)) eng.public_policies.forEach(p => { if (p) pCounts[p.trim()] = (pCounts[p.trim()] || 0) + 1; });
    });

    const formatGroup = (obj: Record<string, number>) => Object.entries(obj).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    
    const pillarsData = [
      { category: 'Áreas de Atuação', items: formatGroup(iCounts) },
      { category: 'Tecnologias', items: formatGroup(tCounts) },
      { category: 'Políticas Transversais', items: formatGroup(pCounts) }
    ].filter(p => p.items.length > 0);

    return { 
      stats, 
      timelineData: timelineArr, 
      engagementTimelineData: engagementTimelineArr, 
      referralData, 
      organizationData, 
      geoData: localGeoData, 
      pillarsData 
    };
  }, [rawData, filters, geocodeCache]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return {
    isLoading,
    isAuthorized,
    filters,
    filterOptions,
    handleFilterChange,
    derivedData
  };
}