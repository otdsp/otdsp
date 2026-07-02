'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { UserAuth, UserProfile, Engagement, EvidenceFilters } from './types';
import { useAdminAuth } from './useAdminAuth';
import { fetchCityCoordinates } from './services/geocoding';
import { processDerivedData } from './utils/evidenceProcessor';

export function useEvidence() {
  const { isAuthorized, isAuthLoading } = useAdminAuth();
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [geocodeCache, setGeocodeCache] = useState<Record<string, [number, number]>>({});
  
  const [rawData, setRawData] = useState<{ auth: UserAuth[]; profiles: UserProfile[]; engagements: Engagement[] }>({ 
  auth: [], profiles: [], engagements: [] 
});

  const [filterOptions, setFilterOptions] = useState<{ verticals: string[]; horizontals: string[]; transversals: string[] }>({ 
    verticals: [], horizontals: [], transversals: [] 
  });
  
  const [filters, setFilters] = useState<EvidenceFilters>({
    startDate: '2026-04-01',
    endDate: '',
    vertical: { enabled: false, values: [] },
    horizontal: { enabled: false, values: [] },
    transversal: { enabled: false, values: [] }
  });

  useEffect(() => {
    // Só busca os dados se a autorização já passou
    if (!isAuthorized) return;

    const fetchRawData = async () => {
      setIsLoadingData(true);
      
      const [authRes, profileRes, engRes] = await Promise.all([
        supabase.from('user_auth').select('id, email, is_active, date_joined'),
        supabase.from('user_profile').select('id, user_id, full_name, municipality, referral_source, institution_organization, organization_type, job_title'),
        supabase.from('engagements').select('id, created_by, status, horizontal, vertical, transversal, planned_activities, estimated_duration, created_at, event_date, engagement_participants(user_email)')
      ]);

      const safeAuth: UserAuth[] = authRes.data || [];
      const safeProfiles: UserProfile[] = profileRes.data || [];
      const safeEng: Engagement[] = engRes.data || [];

      const uniqueVerticals = new Set<string>();
      const uniqueHorizontals = new Set<string>();
      const uniqueTransversals = new Set<string>();
      const cityFreq: Record<string, number> = {};

      safeProfiles.forEach((p) => {
        if (p.municipality) {
          const city = p.municipality.trim().charAt(0).toUpperCase() + p.municipality.trim().slice(1);
          cityFreq[city] = (cityFreq[city] || 0) + 1;
        }
      });
      safeEng.forEach((e) => {
        if (Array.isArray(e.vertical)) {
          e.vertical.forEach((value) => {
            const normalized = value?.trim();
            if (normalized) uniqueVerticals.add(normalized);
          });
        }
        if (Array.isArray(e.horizontal)) {
          e.horizontal.forEach((value) => {
            const normalized = value?.trim();
            if (normalized) uniqueHorizontals.add(normalized);
          });
        }
        if (Array.isArray(e.transversal)) {
          e.transversal.forEach((value) => {
            const normalized = value?.trim();
            if (normalized) uniqueTransversals.add(normalized);
          });
        }
      });

      setFilterOptions({
        verticals: Array.from(uniqueVerticals).sort(),
        horizontals: Array.from(uniqueHorizontals).sort(),
        transversals: Array.from(uniqueTransversals).sort()
      });
      
      // Busca as coordenadas
      const topCities = Object.entries(cityFreq).sort((a, b) => b[1] - a[1]).slice(0, 30).map(x => x[0]);
      const newGeoData = await fetchCityCoordinates(topCities);

      setGeocodeCache(prev => ({ ...prev, ...newGeoData }));
      
      setRawData({ auth: safeAuth, profiles: safeProfiles, engagements: safeEng });
      
      setIsLoadingData(false);
    };

    fetchRawData();
  }, [isAuthorized]);

  // Olha como o useMemo fica limpo!
  const derivedData = useMemo(() => {
    return processDerivedData(rawData, filters, geocodeCache);
  }, [rawData, filters, geocodeCache]);

  const handleFilterChange = (filterKey: string, newValue: any) => {
    setFilters((prev) => ({ ...prev, [filterKey]: newValue }));
  };

  return {
    isLoading: isAuthLoading || isLoadingData,
    isAuthorized,
    filters,
    filterOptions,
    handleFilterChange,
    derivedData
  };
}