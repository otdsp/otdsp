'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type {
  Engagement,
  EvidenceFilterOptions,
  EvidenceFilters,
  UserAuth,
  UserProfile,
} from './types';
import { processDerivedData } from './utils/evidenceProcessor';

type RawEvidenceData = {
  auth: UserAuth[];
  profiles: UserProfile[];
  engagements: Engagement[];
};

const INITIAL_FILTERS: EvidenceFilters = {
  engagementSearch: '',
  startDate: '2026-04-01',
  endDate: '',
  vertical: { enabled: false, values: [] },
  horizontal: { enabled: false, values: [] },
  transversal: { enabled: false, values: [] },
};

const EMPTY_FILTER_OPTIONS: EvidenceFilterOptions = {
  engagements: [],
  verticals: [],
  horizontals: [],
  transversals: [],
};

function useDashboardAuth() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const authenticate = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.replace('/login');
          return;
        }

        if (isMounted) setIsAuthorized(true);
      } catch (error) {
        console.error('Erro na autenticação:', error);
        router.replace('/login');
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    };

    void authenticate();
    return () => {
      isMounted = false;
    };
  }, [router]);

  return { isAuthorized, isAuthLoading };
}

function buildFilterOptions(engagements: Engagement[]): EvidenceFilterOptions {
  const uniqueEngagements = new Set<string>();
  const uniqueVerticals = new Set<string>();
  const uniqueHorizontals = new Set<string>();
  const uniqueTransversals = new Set<string>();

  engagements.forEach((engagement) => {
    const title = engagement.title?.trim();
    if (title) uniqueEngagements.add(title);

    engagement.vertical?.forEach((value) => {
      const normalized = value?.trim();
      if (normalized) uniqueVerticals.add(normalized);
    });

    engagement.horizontal?.forEach((value) => {
      const normalized = value?.trim();
      if (normalized) uniqueHorizontals.add(normalized);
    });

    engagement.transversal?.forEach((value) => {
      const normalized = value?.trim();
      if (normalized) uniqueTransversals.add(normalized);
    });
  });

  return {
    engagements: Array.from(uniqueEngagements).sort(),
    verticals: Array.from(uniqueVerticals).sort(),
    horizontals: Array.from(uniqueHorizontals).sort(),
    transversals: Array.from(uniqueTransversals).sort(),
  };
}

function buildCities(profiles: UserProfile[]) {
  return Array.from(
    new Set(
      profiles
        .map((profile) => profile.municipality?.trim().replace(/\s+/g, ' '))
        .filter((value): value is string => Boolean(value))
    )
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

async function fetchCityCoordinates(
  cities: string[]
): Promise<Record<string, [number, number]>> {
  const entries = await Promise.all(
    cities.map(async (city) => {
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            city
          )}&count=1&format=json&language=pt&countryCode=BR`
        );

        if (!response.ok) return null;
        const json = await response.json();
        const firstResult = json.results?.[0];
        if (!firstResult) return null;

        const normalizedCity = city.charAt(0).toUpperCase() + city.slice(1);
        return [
          normalizedCity,
          [firstResult.longitude, firstResult.latitude] as [number, number],
        ] as const;
      } catch (error) {
        console.error(`Erro ao buscar coordenadas de ${city}:`, error);
        return null;
      }
    })
  );

  return Object.fromEntries(
    entries.filter(
      (entry): entry is readonly [string, [number, number]] => entry !== null
    )
  );
}

export function useEvidence() {
  const { isAuthorized, isAuthLoading } = useDashboardAuth();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [geocodeCache, setGeocodeCache] = useState<Record<string, [number, number]>>(
    {}
  );
  const [rawData, setRawData] = useState<RawEvidenceData>({
    auth: [],
    profiles: [],
    engagements: [],
  });
  const [filterOptions, setFilterOptions] =
    useState<EvidenceFilterOptions>(EMPTY_FILTER_OPTIONS);
  const [filters, setFilters] = useState<EvidenceFilters>(INITIAL_FILTERS);

  useEffect(() => {
    if (!isAuthorized) return;

    let isMounted = true;

    const fetchRawData = async () => {
      setIsLoadingData(true);

      try {
        const [authRes, profileRes, engagementRes] = await Promise.all([
          // O dashboard não precisa de CPF nem telefone.
          supabase.from('user_auth').select('id, email'),
          supabase
            .from('user_profile')
            .select(
              'id, full_name, municipality, institution_organization, organization_type, job_title'
            ),
          supabase.from('engagements').select(`
            id,
            title,
            created_by,
            status,
            location,
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
          `),
        ]);

        if (authRes.error) throw authRes.error;
        if (profileRes.error) throw profileRes.error;
        if (engagementRes.error) throw engagementRes.error;

        const safeAuth = (authRes.data ?? []) as UserAuth[];
        const safeProfiles = (profileRes.data ?? []) as UserProfile[];
        const safeEngagements = (engagementRes.data ?? []) as Engagement[];
        const cities = buildCities(safeProfiles);
        const newGeoData = await fetchCityCoordinates(cities);

        if (!isMounted) return;

        setFilterOptions(buildFilterOptions(safeEngagements));
        setGeocodeCache((previous) => ({ ...previous, ...newGeoData }));
        setRawData({
          auth: safeAuth,
          profiles: safeProfiles,
          engagements: safeEngagements,
        });
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    };

    void fetchRawData();
    return () => {
      isMounted = false;
    };
  }, [isAuthorized]);

  const derivedData = useMemo(
    () => processDerivedData(rawData, filters, geocodeCache),
    [rawData, filters, geocodeCache]
  );

  const handleFilterChange = <K extends keyof EvidenceFilters>(
    filterKey: K,
    newValue: EvidenceFilters[K]
  ) => {
    setFilters((previous) => ({
      ...previous,
      [filterKey]: newValue,
    }));
  };

  return {
    isLoading: isAuthLoading || (isAuthorized && isLoadingData),
    isAuthorized,
    filters,
    filterOptions,
    handleFilterChange,
    derivedData,
  };
}