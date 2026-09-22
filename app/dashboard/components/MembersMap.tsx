'use client';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Globe2, Maximize2, Minimize2 } from 'lucide-react';
import { getGeoMarkerColor } from '../utils/presentation';

const LEAFLET_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export type GeoCityData = {
  name: string;
  count: number;
  coordinates: [number, number];
  members?: string[];
};

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
  ({ data, title = 'Distribuição de Membros', className = '' }, ref) => {
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
          mapInstanceRef.current?.invalidateSize();
        },
      }),
      []
    );

    // Inicializa o Leaflet apenas uma vez durante a vida do componente.
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

        const map = L.map(mapRef.current, {
          preferCanvas: false,
          zoomControl: true,
        }).setView([-15.7801, -47.9292], 4);

        L.tileLayer(LEAFLET_TILE_URL, {
          maxZoom: 20,
          crossOrigin: true,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
        markersLayerRef.current = markersLayer;
        setIsMapReady(true);

        requestAnimationFrame(() => {
          map.invalidateSize();
        });
      });

      return () => {
        cancelled = true;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        leafletRef.current = null;
      };
    }, []);

    // Atualiza somente os marcadores quando os filtros/dados mudam.
    useEffect(() => {
      if (!isMapReady) return;

      const L = leafletRef.current;
      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;

      if (!L || !map || !markersLayer) return;

      markersLayer.clearLayers();

      if (!data.length) {
        map.setView([-15.7801, -47.9292], 4);
        return;
      }

      const bounds: [number, number][] = [];

      data.forEach((city) => {
        const [lng, lat] = city.coordinates;
        const markerColor = getGeoMarkerColor(city.count);
        const members = normalizeMembers(city.members);

        const marker = L.circleMarker([lat, lng], {
          radius: Math.min(6 + city.count * 1.5, 25),
          fillColor: markerColor,
          color: '#ffffff',
          weight: 1.5,
          fillOpacity: 0.75,
          opacity: 1,
          interactive: true,
          bubblingMouseEvents: false,
        }).addTo(markersLayer);

        const popupContent = document.createElement('div');
        popupContent.style.fontFamily = 'Inter, ui-sans-serif, system-ui, sans-serif';
        popupContent.style.width = '240px';
        popupContent.style.maxWidth = '240px';
        popupContent.style.color = '#0f172a';

        const safeCityName = escapeHtml(city.name);
        const memberWord = city.count === 1 ? 'membro ativo' : 'membros ativos';

        const membersHtml = members.length
          ? members
              .map(
                (member) => `
                  <div
                    style="
                      padding: 7px 8px;
                      border-bottom: 1px solid #f1f5f9;
                      font-size: 12px;
                      line-height: 1.35;
                      color: #334155;
                    "
                  >
                    ${escapeHtml(member)}
                  </div>
                `
              )
              .join('')
          : `
              <div
                style="
                  padding: 8px;
                  font-size: 12px;
                  color: #94a3b8;
                  font-style: italic;
                "
              >
                Nenhum nome disponível.
              </div>
            `;

        popupContent.innerHTML = `
          <div style="padding: 2px 0 0;">
            <div
              style="
                font-size: 15px;
                line-height: 1.25;
                font-weight: 700;
                color: #0f172a;
                padding-right: 18px;
              "
            >
              ${safeCityName}
            </div>

            <div
              style="
                margin-top: 4px;
                font-size: 12px;
                color: #64748b;
              "
            >
              ${city.count} ${memberWord}
            </div>

            <div
              style="
                margin-top: 10px;
                padding-top: 9px;
                border-top: 1px solid #e2e8f0;
              "
            >
              <div
                class="otdsp-members-scroll"
                style="
                  max-height: 145px;
                  overflow-y: auto;
                  overscroll-behavior: contain;
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
                  background: #ffffff;
                "
              >
                ${membersHtml}
              </div>
            </div>
          </div>
        `;

        // Impede que scroll/cliques dentro da lista movimentem ou deem zoom no mapa.
        L.DomEvent.disableScrollPropagation(popupContent);
        L.DomEvent.disableClickPropagation(popupContent);

        marker.bindPopup(popupContent, {
          closeButton: true,
          autoPan: true,
          keepInView: true,
          minWidth: 250,
          maxWidth: 280,
          className: 'otdsp-members-popup',
        });

        marker.on('click', () => {
          marker.openPopup();
        });

        marker.on('mouseover', () => {
          marker.setStyle({
            fillOpacity: 1,
            weight: 2.5,
          });

          const element = marker.getElement?.();
          if (element) element.style.cursor = 'pointer';
        });

        marker.on('mouseout', () => {
          marker.setStyle({
            fillOpacity: 0.75,
            weight: 1.5,
          });
        });

        bounds.push([lat, lng]);
      });

      if (bounds.length === 1) {
        map.setView(bounds[0], 9);
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, {
          padding: [40, 40],
          maxZoom: 9,
        });
      }

      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    }, [data, isMapReady]);

    // Cuida exclusivamente do modo de tela cheia do mapa.
    useEffect(() => {
      const handleFullscreenChange = () => {
        const isFullscreen = document.fullscreenElement === mapContainerRef.current;
        setIsMapFullscreen(isFullscreen);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            mapInstanceRef.current?.invalidateSize();
          });
        });
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
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
        className={`avoid-break bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col ${className}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <Globe2 className="text-amber-600 w-6 h-6" />
          <h2 className="text-lg font-bold tracking-tight text-slate-800">
            {title}
          </h2>
        </div>

        <div
          ref={mapContainerRef}
          className={`
            relative w-full overflow-hidden bg-slate-100
            ${
              isMapFullscreen
                ? 'h-screen bg-white'
                : 'h-[450px] rounded-xl border border-slate-200'
            }
          `}
        >
          <div ref={mapRef} className="w-full h-full" />

          {!data.length && isMapReady && (
            <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center">
              <div className="rounded-lg border border-slate-200 bg-white/95 px-4 py-2 text-sm font-medium text-slate-500 shadow-sm">
                Nenhuma localização disponível para os filtros atuais.
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={toggleMapFullscreen}
            className="
              absolute top-3 right-3 z-[1000]
              flex items-center justify-center
              w-10 h-10
              bg-white hover:bg-slate-50
              border border-slate-200
              rounded-lg shadow-md
              text-slate-700
              transition-colors
            "
            title={isMapFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            aria-label={
              isMapFullscreen ? 'Sair da tela cheia' : 'Abrir mapa em tela cheia'
            }
          >
            {isMapFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    );
  }
);

MembersMap.displayName = 'MembersMap';

export default MembersMap;