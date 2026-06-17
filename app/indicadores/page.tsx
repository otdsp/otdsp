'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Users, Activity, Target, Handshake, Globe2, BarChart3, ShieldAlert, Loader2, 
  PieChart as PieIcon, Briefcase, Filter, Calendar as CalendarIcon, MapPin, Tag, Download, X
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import { useIndicadores } from './useIndicadores';
import { FilterSelect } from './components/FilterSelect';
import { KpiCard } from './components/KpiCard';
import { CustomOrgTooltip } from './components/CustomOrgTooltip';
import { MiniPilarCard } from './components/MiniPilarCard';

// NOVO: Importando a função de PDF
import { exportToPDF } from './utils/exportPdf'; 

const PIE_COLORS = ['#0891b2', '#059669', '#d97706', '#7c3aed', '#db2777', '#475569'];
const ORG_COLORS = ['#4f46e5', '#ea580c', '#0284c7', '#16a34a', '#9333ea', '#64748b'];

const LEAFLET_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

export default function IndicadoresStaff() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  const {
    isLoading,
    isAuthorized,
    filters,
    filterOptions,
    handleFilterChange,
    derivedData
  } = useIndicadores();

  const { stats, timelineData, engagementTimelineData, referralData, organizationData, geoData, pillarsData } = derivedData;

  // NOVO: Estados para controle do Modal de Exportação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!isAuthorized || geoData.length === 0 || !mapRef.current) return;
    import('leaflet').then((L) => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link'); link.id = 'leaflet-css'; link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
      }
      if (!mapInstance.current) {
        if (mapRef.current) mapInstance.current = L.map(mapRef.current).setView([-15.7801, -47.9292], 4);
        L.tileLayer(LEAFLET_TILE_URL, { maxZoom: 20 }).addTo(mapInstance.current);
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

  // NOVO: Função para lidar com o clique final de exportar
  const handleExport = async () => {
    setIsExporting(true);
    await exportToPDF('pdf-content', eventName);
    setIsExporting(false);
    setIsModalOpen(false);
    setEventName('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-cyan-600 animate-spin" />
        <p className="text-slate-600 font-medium tracking-wide text-sm animate-pulse">Sincronizando cascata reativa de indicadores...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ShieldAlert className="w-16 h-16 text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-[#0F172A] p-6 pt-28 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight mb-2">Painel de Indicadores</h1>
            <p className="text-slate-500 text-lg font-light tracking-wide">Inteligência operacional e métricas da comunidade <span className="text-cyan-600 font-medium">OTDSP</span></p>
          </div>
          
          {/* NOVO: Botão de acionar o Modal de Exportação */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </header>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 lg:items-center relative z-20">
          <div className="flex items-center gap-2 lg:border-r border-slate-100 pr-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="font-semibold text-slate-700 text-sm tracking-wide uppercase">Filtros</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 flex-1">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">Data Inicial</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-4 w-4 text-cyan-600" />
                </div>
                <input 
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover:bg-slate-100 transition-colors cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-1">Data Final</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-4 w-4 text-cyan-600" />
                </div>
                <input 
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 hover:bg-slate-100 transition-colors cursor-pointer"
                />
              </div>
            </div>

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

        {/* NOVO: Wrapper do PDF. Tudo dentro desta div será printado */}
        <div id="pdf-content" className="space-y-8 bg-slate-50 p-2">
          
          {/* NOVO: Cabeçalho Oculto (Só aparece no PDF) */}
          <div id="pdf-header" style={{ display: 'none' }} className="mb-6 pb-4 border-b border-slate-200">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">OTDSP - Relatório de Indicadores Gerenciais</h1>
            <p className="text-slate-600 text-lg mt-2">Evento / Contexto: <strong className="text-cyan-700">{eventName || 'Geral'}</strong></p>
            <p className="text-slate-500 mt-1">Período consultado: {filters.startDate ? new Date(filters.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início'} até {filters.endDate ? new Date(filters.endDate + 'T23:59:59').toLocaleDateString('pt-BR') : 'Hoje'}</p>
          </div>

          {/* Cards de Métricas */}
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
              <h2 className="text-lg font-bold tracking-tight text-slate-800">Distribuição de Membros</h2>
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

      {/* NOVO: Modal de Exportação Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Download className="w-5 h-5 text-cyan-600" />
                Exportar Relatório PDF
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nome do Evento / Contexto</label>
                <input 
                  type="text" 
                  placeholder="Ex: Workshop Caninos 2026"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2">
                  Isso será impresso no cabeçalho do PDF e formará o nome do arquivo final.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                disabled={isExporting}
              >
                Cancelar
              </button>
              <button 
                onClick={handleExport}
                disabled={!eventName.trim() || isExporting}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isExporting ? 'Gerando PDF...' : 'Baixar Arquivo'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}