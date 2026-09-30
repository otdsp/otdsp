'use client';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Globe2, Maximize2, Minimize2 } from 'lucide-react';
import type { DashboardGeoPoint } from '../utils/evidenceProcessor';

const LEAFLET_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const getGeoMarkerColor = (count: number) => {
  if (count > 50) return '#b91c1c';
  if (count > 20) return '#dc2626';
  if (count > 5) return '#f97316';
  return '#eab308';
};

export type GeoCityData = DashboardGeoPoint;

export type MembersMapHandle = {
  prepareForExport: () => void;
};

type MembersMapProps = {
  data: GeoCityData[];
  title?: string;
  className?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const normalizeMembers = (members: string[] | undefined) => {
  if (!members?.length) return [];
  return members
    .map((name) => name?.trim())
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
};

const MembersMap = forwardRef<MembersMapHandle, MembersMapProps>(
  ({ data, title = 'Rede Territorial OTDSP', className = '' }, ref) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersLayerRef = useRef<any>(null);
    const leafletRef = useRef<any>(null);

    const [isMapReady, setIsMapReady] = useState(false);
    const [isMapFullscreen, setIsMapFullscreen] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        prepareForExport: () => {
          mapInstanceRef.current?.closePopup?.();
          mapInstanceRef.current?.invalidateSize();
        },
      }),
      []
    );

    useEffect(() => {
      let cancelled = false;

      import('leaflet').then((L) => {
        if (cancelled || !mapRef.current) return;

        leafletRef.current = L;

        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (!document.getElementById('otdsp-members-map-styles')) {
          const style = document.createElement('style');
          style.id = 'otdsp-members-map-styles';
          style.textContent = `
            .otdsp-members-popup .leaflet-popup-content-wrapper {
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
            }
            .otdsp-members-popup .leaflet-popup-content {
              margin: 11px 12px;
            }
            .otdsp-members-popup .leaflet-popup-tip {
              box-shadow: none;
            }
          `;
          document.head.appendChild(style);
        }

        const map = L.map(mapRef.current, {
          preferCanvas: false,
          zoomControl: true,
          scrollWheelZoom: false,
        }).setView([-22.2, -48.5], 6);

        L.tileLayer(LEAFLET_TILE_URL, {
          maxZoom: 20,
          crossOrigin: true,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
        markersLayerRef.current = markersLayer;
        setIsMapReady(true);

        requestAnimationFrame(() => map.invalidateSize());
      });

      return () => {
        cancelled = true;
        if (mapInstanceRef.current) mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        leafletRef.current = null;
      };
    }, []);

    useEffect(() => {
      if (!isMapReady) return;

      const L = leafletRef.current;
      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;
      if (!L || !map || !markersLayer) return;

      markersLayer.clearLayers();

      if (!data.length) {
        map.setView([-22.2, -48.5], 6);
        return;
      }

      const bounds: [number, number][] = [];

      data.forEach((city) => {
        const [lng, lat] = city.coordinates;
        const members = normalizeMembers(city.members);
        const markerColor = getGeoMarkerColor(city.count);

        const marker = L.circleMarker([lat, lng], {
          radius: Math.min(7 + Math.sqrt(Math.max(city.count, 1)) * 2.2, 25),
          fillColor: markerColor,
          color: '#ffffff',
          weight: 1.5,
          fillOpacity: 0.78,
          opacity: 1,
          interactive: true,
          bubblingMouseEvents: false,
        }).addTo(markersLayer);

        const safeCityName = escapeHtml(city.name);
        const participantsLabel = city.count === 1 ? 'participante' : 'participantes';
        const engagementsLabel = city.engagementCount === 1 ? 'engajamento' : 'engajamentos';
        const institutionsLabel = city.institutionCount === 1 ? 'instituição' : 'instituições';

        const membersHtml = members.length
          ? members
              .map(
                (member) => `
                  <div style="padding:5px 6px;border-bottom:1px solid #f1f5f9;font-size:11px;line-height:1.3;color:#475569;">
                    ${escapeHtml(member)}
                  </div>
                `
              )
              .join('')
          : '<div style="padding:6px;font-size:11px;color:#94a3b8;font-style:italic;">Nenhum nome disponível.</div>';

        const popupContent = document.createElement('div');
        popupContent.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';
        popupContent.style.width = '215px';
        popupContent.style.maxWidth = '215px';
        popupContent.style.color = '#0f172a';

        popupContent.innerHTML = `
          <div>
            <div style="font-size:14px;line-height:1.2;font-weight:800;color:#0f172a;padding-right:14px;">
              ${safeCityName}
            </div>

            <div style="margin-top:6px;font-size:11px;line-height:1.55;color:#64748b;">
              <strong style="color:#334155;">${city.count}</strong> ${participantsLabel}
              <span style="color:#cbd5e1;"> · </span>
              <strong style="color:#334155;">${city.engagementCount}</strong> ${engagementsLabel}
              <br />
              <strong style="color:#334155;">${city.institutionCount}</strong> ${institutionsLabel}
              <span style="color:#cbd5e1;"> · </span>
              <strong style="color:#334155;">${city.totalHours.toLocaleString('pt-BR', {
                maximumFractionDigits: 1,
              })}h</strong> de carga
            </div>

            ${
              members.length
                ? `
                  <div style="margin-top:8px;padding-top:7px;border-top:1px solid #e2e8f0;">
                    <div style="margin-bottom:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8;">Participantes</div>
                    <div class="otdsp-members-scroll" style="max-height:105px;overflow-y:auto;overscroll-behavior:contain;">
                      ${membersHtml}
                    </div>
                  </div>
                `
                : ''
            }
          </div>
        `;

        L.DomEvent.disableScrollPropagation(popupContent);
        L.DomEvent.disableClickPropagation(popupContent);

        marker.bindPopup(popupContent, {
          closeButton: true,
          autoPan: true,
          keepInView: true,
          minWidth: 225,
          maxWidth: 245,
          className: 'otdsp-members-popup',
        });

        marker.on('click', () => marker.openPopup());
        marker.on('mouseover', () => {
          marker.setStyle({ fillOpacity: 1, weight: 2.5 });
          const element = marker.getElement?.();
          if (element) element.style.cursor = 'pointer';
        });
        marker.on('mouseout', () => {
          marker.setStyle({ fillOpacity: 0.78, weight: 1.5 });
        });

        bounds.push([lat, lng]);
      });

      if (bounds.length === 1) {
        map.setView(bounds[0], 9);
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
      }

      requestAnimationFrame(() => map.invalidateSize());
    }, [data, isMapReady]);

    useEffect(() => {
      const handleFullscreenChange = () => {
        const isFullscreen = document.fullscreenElement === mapContainerRef.current;
        setIsMapFullscreen(isFullscreen);

        if (isFullscreen) {
          mapInstanceRef.current?.scrollWheelZoom.enable();
        } else {
          mapInstanceRef.current?.scrollWheelZoom.disable();
        }

        requestAnimationFrame(() => {
          requestAnimationFrame(() => mapInstanceRef.current?.invalidateSize());
        });
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleMapFullscreen = async () => {
      if (!mapContainerRef.current) return;

      try {
        if (!document.fullscreenElement) {
          await mapContainerRef.current.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (error) {
        console.error('Erro ao alternar tela cheia do mapa:', error);
      }
    };

    return (
      <div
        className={`avoid-break flex flex-col rounded-2xl border border-slate-200 bg-white p-6 ${className}`}
      >
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-3">
              <Globe2 className="h-6 w-6 text-amber-600" />
              <h2 className="text-lg font-bold tracking-tight text-slate-800">{title}</h2>
            </div>
            <p className="mt-1 pl-9 text-xs text-slate-500">
              Explore participantes, engajamentos e instituições conectados por município.
            </p>
          </div>
          <div className="text-xs font-medium text-slate-500">
            {data.length} {data.length === 1 ? 'município no mapa' : 'municípios no mapa'}
          </div>
        </div>

        <div
          ref={mapContainerRef}
          className={`relative z-0 isolate w-full overflow-hidden bg-slate-100 ${
            isMapFullscreen ? 'h-screen bg-white' : 'h-[520px] rounded-xl border border-slate-200'
          }`}
        >
          <div ref={mapRef} className="h-full w-full" />

          {!data.length && isMapReady && (
            <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
              <div className="rounded-lg border border-slate-200 bg-white/95 px-4 py-2 text-sm font-medium text-slate-500">
                Nenhuma localização disponível para os filtros atuais.
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={toggleMapFullscreen}
            className="absolute right-3 top-3 z-[500] flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
            title={isMapFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            aria-label={isMapFullscreen ? 'Sair da tela cheia' : 'Abrir mapa em tela cheia'}
          >
            {isMapFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    );
  }
);

MembersMap.displayName = 'MembersMap';

export default MembersMap;