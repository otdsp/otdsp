'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Users, Activity, Target, Handshake, 
  Globe2, BarChart3, ShieldAlert, Loader2, 
  PieChart as PieIcon, Briefcase, Filter, Calendar as CalendarIcon, MapPin, Tag
} from 'lucide-react';

import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// --- INTERFACES PARA TIPAGEM ESTRITA (Remove os avisos de "any") ---

interface UserAuth {
  id: string;
  is_active: boolean;
  date_joined: string;
}

interface UserProfile {
  id: string;
  user_id?: string;
  municipality?: string;
  referral_source?: string;
  institution_organization?: string;
  organization_type?: string;
}

interface Engagement {
  id: string;
  created_by: string;
  status?: string;
  interests?: string[];
  technologies?: string[];
  public_policies?: string[];
  planned_activities?: string[];
  created_at: string;
}

interface KPIStats {
  totalUsers: number;
  activeUsers: number;
  totalEngagements: number;
  signedAgreements: number;
}

interface FilterSelectProps {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}

interface OrgGroup {
  count: number;
  prettyName: string;
  types: Record<string, number>;
}

// ------------------------------------------------------------------

const PIE_COLORS = ['#0891b2', '#059669', '#d97706', '#7c3aed', '#db2777', '#475569'];
const ORG_COLORS = ['#4f46e5', '#ea580c', '#0284c7', '#16a34a', '#9333ea', '#64748b'];

// Correção 1: Tipagem do Tooltip Customizado
const CustomOrgTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xl text-xs space-y-1.5 z-50">
        <p className="font-extrabold text-slate-900 text-sm tracking-tight">{data.name}</p>
        <div className="flex items-center gap-4 text-slate-600">
          <span><strong className="text-slate-800 font-semibold">Membros:</strong> {data.value}</span>
        </div>
        <div className="pt-1 border-t border-slate-100 text-[11px]">
          <span className="text-slate-500">
            {data.name === 'Outras' ? 'Segmentos Predominantes: ' : 'Segmento (Mais frequente): '}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium font-sans">
            {data.orgType}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function IndicadoresStaff() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null); // Mapas costumam usar any para instâncias de bibliotecas externas sem types locais
  const geocodeCache = useRef<Record<string, [number, number]>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const [rawData, setRawData] = useState<{ auth: UserAuth[], profiles: UserProfile[], engagements: Engagement[] }>({
    auth: [], profiles: [], engagements: []
  });

  const [filters, setFilters] = useState({
    period: 'all',
    orgType: 'all',
    status: 'all',
    geography: 'all'
  });

  const [filterOptions, setFilterOptions] = useState({
    orgTypes: [] as string[],
    statuses: [] as string[],
    geographies: [] as string[]
  });

  const [stats, setStats] = useState<KPIStats>({ totalUsers: 0, activeUsers: 0, totalEngagements: 0, signedAgreements: 0 });
  const [timelineData, setTimelineData] = useState<{ name: string; Membros?: number; Engajamentos?: number }[]>([]);
  const [engagementTimelineData, setEngagementTimelineData] = useState<{ name: string; Engajamentos?: number }[]>([]);
  const [geoData, setGeoData] = useState<{ name: string; count: number; coordinates: [number, number] }[]>([]);
  const [referralData, setReferralData] = useState<{ name: string; value: number }[]>([]);
  const [organizationData, setOrganizationData] = useState<{ name: string; value: number; orgType: string }[]>([]);
  const [pillarsData, setPillarsData] = useState<{ category: string, items: { label: string, count: number }[] }[]>([]);

  // Correção 2: fetchRawData movido para dentro do useEffect para evitar react-hooks/exhaustive-deps
  useEffect(() => {
    const fetchRawData = async () => {
      const [ { data: authData }, { data: profileData }, { data: engData } ] = await Promise.all([
        supabase.from('user_auth').select('id, is_active, date_joined'),
        supabase.from('user_profile').select('id, user_id, municipality, referral_source, institution_organization, organization_type'),
        supabase.from('engagements').select('id, created_by, status, interests, technologies, public_policies, planned_activities, created_at')
      ]);

      // Correção 3, 4 e 5: Castings com as interfaces corretas e seguras
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
      await Promise.all(topCities.map(async (city) => {
        if (!geocodeCache.current[city]) {
          try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&format=json`);
            const json = await res.json();
            if (json.results && json.results.length > 0) {
              geocodeCache.current[city] = [json.results[0].longitude, json.results[0].latitude];
            }
          } catch (e) { console.error(`Erro Geocache: ${city}`); }
        }
      }));

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

  useEffect(() => {
    if (!rawData.auth.length && !rawData.profiles.length) return;
    const { auth, profiles, engagements } = rawData;

    const profileMap = new Map<string, UserProfile>();
    profiles.forEach(p => { profileMap.set(p.user_id || p.id, p); });

    const now = new Date();
    const cutoffDate = new Date();
    if (filters.period === '7d') cutoffDate.setDate(now.getDate() - 7);
    else if (filters.period === '30d') cutoffDate.setDate(now.getDate() - 30);
    else if (filters.period === '90d') cutoffDate.setDate(now.getDate() - 90);
    else if (filters.period === '12m') cutoffDate.setFullYear(now.getFullYear() - 1);
    else cutoffDate.setFullYear(2000); 

    const filteredAuth = auth.filter(u => {
      const p = profileMap.get(u.id);
      const dateOk = new Date(u.date_joined) >= cutoffDate;
      const orgOk = filters.orgType === 'all' || p?.organization_type?.trim() === filters.orgType;
      const geoOk = filters.geography === 'all' || (p?.municipality && p.municipality.trim().charAt(0).toUpperCase() + p.municipality.trim().slice(1) === filters.geography);
      return dateOk && orgOk && geoOk;
    });

    const validUserIds = new Set(filteredAuth.map(u => u.id));

    const filteredEngagements = engagements.filter(e => {
      const dateOk = new Date(e.created_at) >= cutoffDate;
      const statusOk = filters.status === 'all' || e.status?.trim() === filters.status;
      const userOk = validUserIds.has(e.created_by);
      return dateOk && statusOk && userOk;
    });

    const filteredProfiles = profiles.filter(p => validUserIds.has(p.user_id || p.id));

    const signedCount = filteredEngagements.filter(e => 
      Array.isArray(e.planned_activities) && 
      e.planned_activities.some(activity => activity?.trim() === "Reunião de Adesão ao Convênio")
    ).length;

    setStats({
      totalUsers: filteredAuth.length,
      activeUsers: filteredAuth.filter(u => u.is_active).length,
      totalEngagements: filteredEngagements.length,
      signedAgreements: signedCount
    });

    buildCascadeCharts(filteredAuth, filteredProfiles, filteredEngagements, cutoffDate);

  }, [rawData, filters]);

  const buildCascadeCharts = (fAuth: UserAuth[], fProfiles: UserProfile[], fEngagements: Engagement[], cutoff: Date) => {
    const now = new Date();
    const isShortPeriod = filters.period === '7d' || filters.period === '30d';

    let timelineArr: { name: string; Membros: number }[] = [];
    let engagementTimelineArr: { name: string; Engajamentos: number }[] = [];

    if (isShortPeriod) {
      const daysCount = filters.period === '7d' ? 7 : 30;
      const dayList = [];
      for (let i = daysCount - 1; i >= 0; i--) {
        const day = new Date();
        day.setDate(now.getDate() - i);
        dayList.push({
          key: `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`,
          label: `${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}`
        });
      }

      const authDaily: Record<string, number> = {};
      const engDaily: Record<string, number> = {};
      dayList.forEach(d => { authDaily[d.key] = 0; engDaily[d.key] = 0; });

      let authAcc = fAuth.filter(u => new Date(u.date_joined) < cutoff).length;
      let engAcc = fEngagements.filter(e => new Date(e.created_at) < cutoff).length;

      fAuth.forEach(u => {
        if (u.date_joined) {
          const dt = new Date(u.date_joined);
          const k = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
          if (authDaily[k] !== undefined) authDaily[k]++;
        }
      });

      fEngagements.forEach(e => {
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
      for (let i = 11; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthList.push({ key: `${m.getFullYear()}-${m.getMonth()}`, label: monthNames[m.getMonth()] });
      }

      const authMonthly: Record<string, number> = {};
      const engMonthly: Record<string, number> = {};
      monthList.forEach(m => { authMonthly[m.key] = 0; engMonthly[m.key] = 0; });

      let authAcc = fAuth.filter(u => new Date(u.date_joined) < cutoff).length;
      let engAcc = fEngagements.filter(e => new Date(e.created_at) < cutoff).length;

      fAuth.forEach(u => {
        if (u.date_joined) {
          const dt = new Date(u.date_joined);
          const k = `${dt.getFullYear()}-${dt.getMonth()}`;
          if (authMonthly[k] !== undefined) authMonthly[k]++;
        }
      });

      fEngagements.forEach(e => {
        if (e.created_at) {
          const dt = new Date(e.created_at);
          const k = `${dt.getFullYear()}-${dt.getMonth()}`;
          if (engMonthly[k] !== undefined) engMonthly[k]++;
        }
      });

      timelineArr = monthList.map(m => { authAcc += authMonthly[m.key]; return { name: m.label, Membros: authAcc }; });
      engagementTimelineArr = monthList.map(m => { engAcc += engMonthly[m.key]; return { name: m.label, Engajamentos: engAcc }; });
    }

    setTimelineData(timelineArr);
    setEngagementTimelineData(engagementTimelineArr);

    const referralCounts: Record<string, number> = {};
    const orgGroups: Record<string, OrgGroup> = {};
    const cityGroups: Record<string, { count: number, name: string }> = {};

    fProfiles.forEach(p => {
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

    setReferralData(Object.entries(referralCounts).map(([name, value]) => ({ name, value })));

    // Correção 6: Ordenação sem forçar "any"
    const sortedOrgs = Object.values(orgGroups).sort((a, b) => b.count - a.count);
    const topOrgs = sortedOrgs.slice(0, 5).map((item) => ({
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
      topOrgs.push({ name: 'Outras', value: rCount, orgType: topRTypes || 'Diversos' });
    }
    setOrganizationData(topOrgs);

    const geoPoints: { name: string; count: number; coordinates: [number, number] }[] = [];
    Object.values(cityGroups).forEach((c) => {
      const coords = geocodeCache.current[c.name];
      if (coords) geoPoints.push({ name: c.name, count: c.count, coordinates: coords });
    });
    setGeoData(geoPoints);

    const iCounts: Record<string, number> = {};
    const tCounts: Record<string, number> = {};
    const pCounts: Record<string, number> = {};
    
    fEngagements.forEach(eng => {
      if (Array.isArray(eng.interests)) eng.interests.forEach(i => { if (i) iCounts[i.trim()] = (iCounts[i.trim()] || 0) + 1; });
      if (Array.isArray(eng.technologies)) eng.technologies.forEach(t => { if (t) tCounts[t.trim()] = (tCounts[t.trim()] || 0) + 1; });
      if (Array.isArray(eng.public_policies)) eng.public_policies.forEach(p => { if (p) pCounts[p.trim()] = (pCounts[p.trim()] || 0) + 1; });
    });

    const formatGroup = (obj: Record<string, number>) => Object.entries(obj).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    
    setPillarsData([
      { category: 'Áreas de Atuação', items: formatGroup(iCounts) },
      { category: 'Tecnologias', items: formatGroup(tCounts) },
      { category: 'Políticas Transversais', items: formatGroup(pCounts) }
    ].filter(p => p.items.length > 0));
  };

  useEffect(() => {
    if (!isAuthorized || geoData.length === 0 || !mapRef.current) return;
    import('leaflet').then((L) => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link'); link.id = 'leaflet-css'; link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
      }
      if (!mapInstance.current) {
        if (mapRef.current) mapInstance.current = L.map(mapRef.current).setView([-15.7801, -47.9292], 4);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(mapInstance.current);
      } else {
        mapInstance.current.eachLayer((layer: any) => { if (layer instanceof L.CircleMarker) mapInstance.current.removeLayer(layer); });
      }

      const bounds: [number, number][] = [];
      geoData.forEach((city) => {
        const [lng, lat] = city.coordinates; 
        let mColor = city.count > 50 ? "#b91c1c" : city.count > 20 ? "#dc2626" : city.count > 5 ? "#f97316" : "#eab308";  
        const marker = L.circleMarker([lat, lng], { radius: Math.min(6 + city.count * 1.5, 25), fillColor: mColor, color: "#ffffff", weight: 1.5, fillOpacity: 0.75 }).addTo(mapInstance.current);
        marker.bindPopup(`<div style="font-family: Inter; font-size: 13px;"><strong style="color: #0f172a;">${city.name}</strong><br/><span>${city.count} membros ativos</span></div>`);
        bounds.push([lat, lng]);
      });
      if (bounds.length > 0) mapInstance.current.fitBounds(bounds, { padding: [40, 40] });
    });
  }, [geoData, isAuthorized]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-cyan-600 animate-spin" />
        <p className="text-slate-600 font-medium tracking-wide text-sm animate-pulse">Sincronizando cascata reativa de indicadores...</p>
      </div>
    );
  }

  if (!isAuthorized) return (<div className="min-h-screen bg-slate-50 flex items-center justify-center"><ShieldAlert className="w-16 h-16 text-red-500" /></div>);

  return (
    <div className="min-h-screen bg-slate-50 text-[#0F172A] p-6 pt-28 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="border-b border-slate-200 pb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight mb-2">Painel de Indicadores</h1>
          <p className="text-slate-500 text-lg font-light tracking-wide">Inteligência operacional e métricas da comunidade <span className="text-cyan-600 font-medium">OTDSP</span></p>
        </header>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 lg:items-center relative z-20">
          <div className="flex items-center gap-2 lg:border-r border-slate-100 pr-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="font-semibold text-slate-700 text-sm tracking-wide uppercase">Filtros</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            <FilterSelect icon={CalendarIcon} label="Período" value={filters.period} onChange={(e) => handleFilterChange('period', e.target.value)}>
              <option value="all">Todo o Período</option>
              <option value="12m">Últimos 12 meses</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="7d">Últimos 7 dias</option>
            </FilterSelect>

            <FilterSelect icon={Briefcase} label="Segmento" value={filters.orgType} onChange={(e) => handleFilterChange('orgType', e.target.value)}>
              <option value="all">Todos os Segmentos</option>
              {filterOptions.orgTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </FilterSelect>

            <FilterSelect icon={Tag} label="Status (Engajamento)" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
              <option value="all">Todos os Status</option>
              {filterOptions.statuses.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </FilterSelect>

            <FilterSelect icon={MapPin} label="Região" value={filters.geography} onChange={(e) => handleFilterChange('geography', e.target.value)}>
              <option value="all">Todas as Cidades</option>
              {filterOptions.geographies.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </FilterSelect>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Total de Membros" value={stats.totalUsers} icon={Users} bgColor="bg-cyan-50" iconColor="text-cyan-600" />
          <KpiCard title="Membros Ativos" value={stats.activeUsers} icon={Activity} bgColor="bg-emerald-50" iconColor="text-emerald-600" />
          <KpiCard title="Engajamentos" value={stats.totalEngagements} icon={Target} bgColor="bg-amber-50" iconColor="text-amber-600" />
          <KpiCard title="Convênios Firmados" value={stats.signedAgreements} icon={Handshake} bgColor="bg-indigo-50" iconColor="text-indigo-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-96 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="text-cyan-600 w-6 h-6" />
              <h2 className="text-lg font-bold tracking-tight text-slate-800">Crescimento de Membros</h2>
            </div>
            <div className="flex-1 w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMembros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="Membros" stroke="#0891b2" strokeWidth={3} fillOpacity={1} fill="url(#colorMembros)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-96 flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <PieIcon className="text-cyan-600 w-6 h-6" />
              <h2 className="text-lg font-bold tracking-tight text-slate-800">Origem de Descoberta</h2>
            </div>
            <div className="flex-1 w-full h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={referralData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {referralData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <Globe2 className="text-amber-600 w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-800">Distribuição de Membros</h2>
            </div>
          </div>
          <div className="w-full h-[450px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 z-10">
            <div ref={mapRef} className="w-full h-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-96 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Target className="text-emerald-500 w-6 h-6" />
              <h2 className="text-lg font-bold tracking-tight text-slate-800">Crescimento de Engajamentos</h2>
            </div>
            <div className="flex-1 w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEngajamentos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="Engajamentos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEngajamentos)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-96 flex flex-col">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="text-indigo-600 w-6 h-6" />
              <h2 className="text-lg font-bold tracking-tight text-slate-800">Organizações / Instituições</h2>
            </div>
            <div className="flex-1 w-full h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={organizationData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {organizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ORG_COLORS[index % ORG_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomOrgTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#475569' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {pillarsData.map((pillar, idx) => (
            <MiniPilarCard key={idx} title={pillar.category} data={pillar.items} />
          ))}
        </div>

      </div>
    </div>
  );
}

// Correção 7: Interface aplicada aos Filtros
function FilterSelect({ icon: Icon, label, value, onChange, children }: FilterSelectProps) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 text-cyan-600" />
        </div>
        <select 
          value={value} onChange={onChange}
          className="block w-full pl-9 pr-8 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 appearance-none hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {children}
        </select>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, bgColor, iconColor }: { title: string, value: number | string, icon: React.ElementType, bgColor: string, iconColor: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all duration-300">
      <div className="space-y-2">
        <h3 className="text-slate-500 font-semibold tracking-wide text-xs uppercase">{title}</h3>
        <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
      </div>
      <div className={`p-4 rounded-xl ${bgColor} ${iconColor} transition-transform group-hover:scale-110 duration-300`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

function MiniPilarCard({ title, data }: { title: string, data: { label: string, count: number }[] }) {
  const maxCount = Math.max(...data.map(item => item.count), 1);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <h3 className="text-base font-bold text-slate-800 mb-6 tracking-tight border-b border-slate-100 pb-3">{title}</h3>
      <div className="space-y-4 flex-1">
        {data.map((item, i) => {
          const widthPercentage = (item.count / maxCount) * 100;
          return (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-medium">{item.label}</span>
                <span className="text-slate-900 font-bold font-mono">{item.count} {item.count === 1 ? 'eng' : 'engs'}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-cyan-600 h-2 rounded-full transition-all duration-500" style={{ width: `${widthPercentage}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}