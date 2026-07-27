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
import {
  buildCityFrequency,
  buildFilterOptions
} from './utils/dataTransforms';

export function useEvidence() {
  const { isAuthorized, isAuthLoading } = useAdminAuth();

  const [isLoadingData, setIsLoadingData] = useState(true);

  const [geocodeCache, setGeocodeCache] = useState<
    Record<string, [number, number]>
  >({});

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
      verticals: [],
      horizontals: [],
      transversals: []
    });

  const [filters, setFilters] = useState<EvidenceFilters>({
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
      if (!isAuthLoading) {
        setIsLoadingData(false);
      }

      return;
    }

    let isMounted = true;

    const fetchRawData = async () => {
      setIsLoadingData(true);

      try {
        const [authRes, profileRes, engagementRes] =
          await Promise.all([
            supabase
              .from('user_auth')
              .select(`
                id,
                email,
                is_active,
                date_joined,
                role,
                cpf,
                phone
              `),

            supabase
              .from('user_profile')
              .select(`
                id,
                full_name,
                municipality,
                referral_source,
                institution_organization,
                organization_type,
                job_title,
                relationship_with_otdsp
              `),

            supabase
              .from('engagements')
              .select(`
                id,
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
          throw new Error(
            `Erro em user_auth: ${authRes.error.message}`
          );
        }

        if (profileRes.error) {
          throw new Error(
            `Erro em user_profile: ${profileRes.error.message}`
          );
        }

        if (engagementRes.error) {
          throw new Error(
            `Erro em engagements: ${engagementRes.error.message}`
          );
        }

        const safeAuth = (authRes.data ?? []) as UserAuth[];
        const safeProfiles =
          (profileRes.data ?? []) as UserProfile[];
        const safeEngagements =
          (engagementRes.data ?? []) as Engagement[];

        console.log('Resultado da consulta:', {
          users: safeAuth.length,
          profiles: safeProfiles.length,
          engagements: safeEngagements.length,
          participants: safeEngagements.reduce(
            (total, engagement) =>
              total +
              (engagement.engagement_participants?.length ?? 0),
            0
          )
        });

        const profilesById = new Map(
          safeProfiles.map((profile) => [
            profile.id,
            profile
          ])
        );

        const authById = new Map(
          safeAuth.map((user) => [user.id, user])
        );

        const participantsWithoutUser =
          safeEngagements.flatMap((engagement) =>
            (engagement.engagement_participants ?? [])
              .filter((participant) => {
                if (
                  participant.user_id &&
                  authById.has(participant.user_id)
                ) {
                  return false;
                }

                return true;
              })
              .map((participant) => ({
                userId: participant.user_id,
              }))
          );

        const usersWithoutProfile = safeAuth
          .filter((user) => !profilesById.has(user.id))
          .map((user) => ({
            id: user.id,
            email: user.email
          }));

        const cityFrequency =
          buildCityFrequency(safeProfiles);

        const nextFilterOptions = buildFilterOptions(
          safeProfiles,
          safeEngagements
        );

        const topCities = Object.entries(cityFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 30)
          .map(([city]) => city);

        const newGeoData =
          await fetchCityCoordinates(topCities);

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
          engagements: safeEngagements
        });
      } catch (error) {
        console.error(
          'Erro ao carregar os dados de evidências:',
          error
        );

        if (isMounted) {
          setRawData({
            auth: [],
            profiles: [],
            engagements: []
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    fetchRawData();

    return () => {
      isMounted = false;
    };
  }, [isAuthorized, isAuthLoading]);

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
    isLoading: isAuthLoading || isLoadingData,
    isAuthorized,
    filters,
    filterOptions,
    handleFilterChange,
    derivedData
  };
}