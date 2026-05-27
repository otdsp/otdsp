'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Users, Activity, Target, CheckCircle2, 
  Globe2, BarChart3, ShieldAlert, Loader2, 
  PieChart as PieIcon, Briefcase
} from 'lucide-react';

import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface KPIStats {
  totalUsers: number;
  activeUsers: number;
  totalEngagements: number;
  completedEngagements: number;
}

const PIE_COLORS = ['#0891b2', '#059669', '#d97706', '#7c3aed', '#db2777', '#475569'];
const ORG_COLORS = ['#4f46e5', '#ea580c', '#0284c7', '#16a34a', '#9333ea', '#64748b'];

// Componente do Balão de Informações Customizado Inteligente
const CustomOrgTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xl text-xs space-y-1.5 z-50 animate-in fade-in-50 duration-150">
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
  const mapInstance = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const [stats, setStats] = useState<KPIStats>({
    totalUsers: 0, activeUsers: 0, totalEngagements: 0, completedEngagements: 0,
  });
  
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [engagementTimelineData, setEngagementTimelineData] = useState<any[]>([]);
  const [geoData, setGeoData] = useState<any[]>([]);
  const [referralData, setReferralData] = useState<any[]>([]);
  const [organizationData, setOrganizationData] = useState<any[]>([]);
  const [pillarsData, setPillarsData] = useState<{ category: string, items: { label: string, count: number }[] }[]>([]);

  useEffect(() => {
    const authenticateAndFetch = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return router.replace('/');

        const { data: userData, error: userError } = await supabase
          .from('user_auth').select('is_staff').eq('id', session.user.id).single();

        if (userError || !userData?.is_staff) return router.replace('/');

        setIsAuthorized(true);
        await fetchDashboardData();

      } catch (error) {
        console.error("Erro na autenticação:", error);
        router.replace('/');
      } finally {
        setIsLoading(false);
      }
    };

    authenticateAndFetch();
  }, [router]);

  // GERENCIAMENTO DO MAPA NATIVO LEAFLET
  useEffect(() => {
    if (!isAuthorized || geoData.length === 0 || !mapRef.current) return;

    import('leaflet').then((L) => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!mapInstance.current) {
        if (mapRef.current) {
            mapInstance.current = L.map(mapRef.current).setView([0, 0], 2);
        }
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(mapInstance.current);
      } else {
        mapInstance.current.eachLayer((layer: any) => {
          if (layer instanceof L.CircleMarker) {
            mapInstance.current.removeLayer(layer);
          }
        });
      }

      const bounds: [number, number][] = [];

      geoData.forEach((city) => {
        if (city.coordinates) {
          const [lng, lat] = city.coordinates; 
          
          let markerColor = "#eab308"; 
          if (city.count > 50) markerColor = "#b91c1c";      
          else if (city.count > 20) markerColor = "#dc2626"; 
          else if (city.count > 5) markerColor = "#f97316";  

          const marker = L.circleMarker([lat, lng], {
            radius: Math.min(6 + city.count * 1.5, 25), 
            fillColor: markerColor,
            color: "#ffffff",
            weight: 1.5,
            fillOpacity: 0.75
          }).addTo(mapInstance.current);

          marker.bindPopup(`
            <div style="font-family: Inter, sans-serif; font-size: 13px; color: #1e293b;">
              <strong style="color: #0f172a; text-transform: uppercase;">${city.name}</strong><br/>
              <span>${city.count} membros cadastrados</span>
            </div>
          `);

          bounds.push([lat, lng]);
        }
      });

      if (bounds.length > 0) {
        mapInstance.current.fitBounds(bounds, { padding: [40, 40] });
      }
    });
  }, [isAuthorized, geoData]);

  const fetchDashboardData = async () => {
    const [
      { count: totalUsers }, { count: activeUsers }, { count: totalEng }, { count: completedEng },
      { data: authTimeline }, { data: profileData },
      { data: engagementsData }
    ] = await Promise.all([
      supabase.from('user_auth').select('*', { count: 'exact', head: true }),
      supabase.from('user_auth').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('engagements').select('*', { count: 'exact', head: true }),
      supabase.from('engagements').select('*', { count: 'exact', head: true }).eq('status', 'Efetivado'),
      supabase.from('user_auth').select('date_joined'),
      supabase.from('user_profile').select('municipality, referral_source, institution_organization, organization_type'),
      supabase.from('engagements').select('interests, technologies, public_policies, created_at') 
    ]);

    setStats({
      totalUsers: totalUsers || 0, activeUsers: activeUsers || 0,
      totalEngagements: totalEng || 0, completedEngagements: completedEng || 0,
    });

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // TRATAMENTO 1: Crescimento Timeline (Membros)
    if (authTimeline) {
      const grouped: { [key: string]: number } = {};
      months.forEach(m => grouped[m] = 0);

      authTimeline.forEach((user: any) => {
        if (user.date_joined) {
          const date = new Date(user.date_joined);
          grouped[months[date.getMonth()]] += 1;
        }
      });

      let acumulado = 0;
      setTimelineData(months.map(m => {
        acumulado += grouped[m];
        return { name: m, "Membros": acumulado };
      }));
    }

    // TRATAMENTO 2: Fontes Geográficas e Organizações Unificadas com Tipo por Maioria
    if (profileData) {
      const cityGroups: { [key: string]: { count: number; prettyName: string } } = {};
      const referralCounts: { [key: string]: number } = {};
      
      // 🔥 Nova Estrutura: Mapeia a contagem de cada tipo de organização por instituição
      const orgGroups: { 
        [key: string]: { 
          count: number; 
          prettyName: string; 
          typesDistribution: Record<string, number> 
        } 
      } = {};

      // Estrutura separada para entender o ecossistema geral da fatia "Outras"
      const remainderTypeCounts: Record<string, number> = {};
      
      profileData.forEach((p: any) => {
        if (p.referral_source) {
          const source = p.referral_source;
          referralCounts[source] = (referralCounts[source] || 0) + 1;
        }

        if (p.institution_organization) {
          const rawOrg = p.institution_organization.trim();
          const normalizedOrgKey = rawOrg.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const currentType = p.organization_type ? p.organization_type.trim() : 'Não informado';

          if (normalizedOrgKey) {
            if (!orgGroups[normalizedOrgKey]) {
              orgGroups[normalizedOrgKey] = {
                count: 0,
                prettyName: rawOrg.length <= 4 ? rawOrg.toUpperCase() : rawOrg.charAt(0).toUpperCase() + rawOrg.slice(1),
                typesDistribution: {}
              };
            }
            orgGroups[normalizedOrgKey].count += 1;
            // Adiciona um voto para este tipo específico dentro desta instituição
            orgGroups[normalizedOrgKey].typesDistribution[currentType] = 
              (orgGroups[normalizedOrgKey].typesDistribution[currentType] || 0) + 1;
          }
        }

        if (p.municipality) {
          const rawCity = p.municipality.trim();
          const normalizedKey = rawCity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          if (normalizedKey) {
            if (!cityGroups[normalizedKey]) {
              cityGroups[normalizedKey] = {
                count: 0,
                prettyName: rawCity.charAt(0).toUpperCase() + rawCity.slice(1) 
              };
            }
            cityGroups[normalizedKey].count += 1;
          }
        }
      });

      setReferralData(Object.entries(referralCounts).map(([name, value]) => ({ name, value })));
      
      // 🔥 RESOLUÇÃO DINÂMICA DA MAIORIA DOS TIPOS
      const sortedOrgs = Object.values(orgGroups).sort((a: any, b: any) => b.count - a.count);
      
      const topOrgsRaw = sortedOrgs.slice(0, 5);
      const remainderOrgsRaw = sortedOrgs.slice(5);

      const topOrgsProcessed = topOrgsRaw.map((item: any) => {
        // Encontra o tipo com maior número de votos/frequência para esta instituição específica
        const dominantType = Object.entries(item.typesDistribution)
          .sort((a: any, b: any) => b[1] - a[1])[0][0];

        return {
          name: item.prettyName,
          value: item.count,
          orgType: dominantType
        };
      });
      
      // Processa a fatia "Outras" combinando suas distribuições
      if (remainderOrgsRaw.length > 0) {
        // 🔥 Tipado ': any' explicitamente no acumulador e no item para matar o erro do TS
        let remainderTotalCount = remainderOrgsRaw.reduce((sum: number, item: any) => sum + item.count, 0);
        
        remainderOrgsRaw.forEach((item: any) => {
          Object.entries(item.typesDistribution).forEach(([type, count]) => {
            remainderTypeCounts[type] = (remainderTypeCounts[type] || 0) + (count as number);
          });
        });

        // Pega os até 3 tipos mais comuns da fatia de empresas menores para listar no hover
        const topRemainderTypes = Object.entries(remainderTypeCounts)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 3)
          .map(([type]) => type)
          .join(', ');

        topOrgsProcessed.push({ 
          name: 'Outras', 
          value: remainderTotalCount, 
          orgType: topRemainderTypes || 'Diversos' 
        });
      }
      
      setOrganizationData(topOrgsProcessed);

      // Geocodificação das Cidades
      const topCities = Object.entries(cityGroups)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 20);
      
      const geoPoints = await Promise.all(
        topCities.map(async ([_, data]) => {
          try {
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(data.prettyName)}&count=1&format=json`);
            const json = await res.json();
            if (json.results && json.results.length > 0) {
              return {
                name: data.prettyName,
                count: data.count,
                coordinates: [json.results[0].longitude, json.results[0].latitude]
              };
            }
          } catch (e) { console.error(`Erro Geocoding ${data.prettyName}`); }
          return null;
        })
      );
      setGeoData(geoPoints.filter(point => point !== null));
    }

    // TRATAMENTO 3: Pilares Dinâmicos e Timeline de Engajamentos
    if (engagementsData) {
      const interestsCounts: Record<string, number> = {};
      const techCounts: Record<string, number> = {};
      const policiesCounts: Record<string, number> = {};
      
      const engGrouped: { [key: string]: number } = {};
      months.forEach(m => engGrouped[m] = 0);

      engagementsData.forEach((eng: any) => {
        if (eng.created_at) {
          const date = new Date(eng.created_at);
          engGrouped[months[date.getMonth()]] += 1;
        }

        if (eng.interests && Array.isArray(eng.interests)) {
          eng.interests.forEach((item: string) => {
            if (item) interestsCounts[item.trim()] = (interestsCounts[item.trim()] || 0) + 1;
          });
        }
        if (eng.technologies && Array.isArray(eng.technologies)) {
          eng.technologies.forEach((item: string) => {
            if (item) techCounts[item.trim()] = (techCounts[item.trim()] || 0) + 1;
          });
        }
        if (eng.public_policies && Array.isArray(eng.public_policies)) {
          eng.public_policies.forEach((item: string) => {
            if (item) policiesCounts[item.trim()] = (policiesCounts[item.trim()] || 0) + 1;
          });
        }
      });

      let engAcumulado = 0;
      setEngagementTimelineData(months.map(m => {
        engAcumulado += engGrouped[m];
        return { name: m, "Engajamentos": engAcumulado };
      }));

      const formatGroup = (countsObj: Record<string, number>) => {
        return Object.entries(countsObj)
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count); 
      };

      const dynamicPillars = [
        { category: 'Áreas de Atuação', items: formatGroup(interestsCounts) },
        { category: 'Tecnologias', items: formatGroup(techCounts) },
        { category: 'Políticas Transversais', items: formatGroup(policiesCounts) }
      ].filter(pillar => pillar.items.length > 0); 

      setPillarsData(dynamicPillars);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-cyan-600 animate-spin" />
        <p className="text-slate-600 font-medium tracking-wide text-sm animate-pulse">
          Autenticando...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold text-slate-800 tracking-wider uppercase">Acesso Negado</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-[#0F172A] p-6 pt-28 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="border-b border-slate-200 pb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight mb-2">
            Painel de Indicadores
          </h1>
          <p className="text-slate-500 text-lg font-light tracking-wide">
            Inteligência operacional e métricas da comunidade <span className="text-cyan-600 font-medium">OTDSP</span>
          </p>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Total de Membros" value={stats.totalUsers} icon={Users} bgColor="bg-cyan-50" iconColor="text-cyan-600" />
          <KpiCard title="Membros Ativos" value={stats.activeUsers} icon={Activity} bgColor="bg-emerald-50" iconColor="text-emerald-600" />
          <KpiCard title="Engajamentos" value={stats.totalEngagements} icon={Target} bgColor="bg-amber-50" iconColor="text-amber-600" />
          <KpiCard title="Efetivados" value={stats.completedEngagements} icon={CheckCircle2} bgColor="bg-purple-50" iconColor="text-purple-600" />
        </div>

        {/* BLOCO 1 */}
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

        {/* MAPA */}
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

        {/* BLOCO 2 */}
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

        {/* PILARES */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {pillarsData.map((pillar, idx) => (
            <MiniPilarCard 
              key={idx}
              title={pillar.category} 
              data={pillar.items} 
            />
          ))}
        </div>

      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, bgColor, iconColor }: { title: string, value: number | string, icon: any, bgColor: string, iconColor: string }) {
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
      <h3 className="text-base font-bold text-slate-800 mb-6 tracking-tight border-b border-slate-100 pb-3">
        {title}
      </h3>
      <div className="space-y-4 flex-1">
        {data.map((item, i) => {
          const widthPercentage = (item.count / maxCount) * 100;

          return (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-medium">{item.label}</span>
                <span className="text-slate-900 font-bold font-mono">
                  {item.count} {item.count === 1 ? 'engajamento' : 'engajamentos'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-cyan-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${widthPercentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}