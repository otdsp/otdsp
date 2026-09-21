'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  UserAuth,
  UserProfile,
  Engagement,
  EvidenceFilters,
  EvidenceFilterOptions
} from './types';
import { useAdminAuth } from './useAdminAuth';
import { fetchCityCoordinates } from './services/geocoding';
import { processDerivedData } from './utils/evidenceProcessor';
import { buildCityFrequency, buildFilterOptions } from './utils/dataTransforms';

export function useEvidence() {
  const { isAuthorized, isAuthLoading } = useAdminAuth();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [geocodeCache, setGeocodeCache] = useState<Record<string, [number, number]>>({});

  const [rawData, setRawData] = useState<{
    auth: UserAuth[];
    profiles: UserProfile[];
    engagements: Engagement[];
  }>({
    auth: [],
    profiles: [],
    engagements: []
  });

  const [filterOptions, setFilterOptions] =
    useState<EvidenceFilterOptions>({
      engagements: [],
      verticals: [],
      horizontals: [],
      transversals: []
    });

  const [filters, setFilters] = useState<EvidenceFilters>({
    engagementSearch: '',
    startDate: '2026-04-01',
    endDate: '',
    vertical: {
      enabled: false,
      values: []
    },
    horizontal: {
      enabled: false,
      values: []
    },
    transversal: {
      enabled: false,
      values: []
    }
  });

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    let isMounted = true;

    const fetchRawData = async () => {
      setIsLoadingData(true);

      try {
        const [authRes, profileRes, engRes] =
          await Promise.all([
            supabase
              .from('user_auth')
              .select(
                'id, email, is_active, date_joined, role, cpf, phone'
              ),

            supabase
              .from('user_profile')
              .select(
                'id, full_name, municipality, referral_source, institution_organization, organization_type, job_title, relationship_with_otdsp'
              ),

            supabase
              .from('engagements')
              .select(`
                id,
                title,
                created_by,
                status,
                horizontal,
                vertical,
                transversal,
                planned_activities,
                estimated_duration,
                created_at,
                event_date,
                engagement_participants (
                  user_id
                )
              `)
          ]);

        if (authRes.error) {
          throw authRes.error;
        }

        if (profileRes.error) {
          throw profileRes.error;
        }

        if (engRes.error) {
          throw engRes.error;
        }

        const safeAuth = (authRes.data ?? []) as UserAuth[];
        const safeProfiles = (profileRes.data ?? []) as UserProfile[];
        const safeEng = (engRes.data ?? []) as Engagement[];

        const cityFreq = buildCityFrequency(safeProfiles);
        const nextFilterOptions = buildFilterOptions(safeProfiles, safeEng);
        const topCities = Object.entries(cityFreq).sort((a, b) => b[1] - a[1]).map(([city]) => city);
        const newGeoData = await fetchCityCoordinates(topCities);

        if (!isMounted) {
          return;
        }

        setFilterOptions(nextFilterOptions);

        setGeocodeCache((previous) => ({
          ...previous,
          ...newGeoData
        }));

        setRawData({
          auth: safeAuth,
          profiles: safeProfiles,
          engagements: safeEng
        });
      } catch (error) {
        console.error(
          'Erro ao carregar dados de evidências:',
          error
        );
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    void fetchRawData();

    return () => {
      isMounted = false;
    };
  }, [isAuthorized]);

  const derivedData = useMemo(() => {
    return processDerivedData(
      rawData,
      filters,
      geocodeCache
    );
  }, [rawData, filters, geocodeCache]);

  const handleFilterChange = (
    filterKey: string,
    newValue: unknown
  ) => {
    setFilters((previous) => ({
      ...previous,
      [filterKey]: newValue
    }));
  };

  return {
    isLoading: isAuthLoading || (isAuthorized && isLoadingData),
    isAuthorized,
    filters,
    filterOptions,
    handleFilterChange,
    derivedData
  };
}