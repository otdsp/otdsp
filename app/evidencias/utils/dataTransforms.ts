import type { Engagement, UserProfile, EvidenceFilterOptions } from '../types';

export function buildFilterOptions(profiles: UserProfile[], engagements: Engagement[]): EvidenceFilterOptions {
  const uniqueVerticals = new Set<string>();
  const uniqueHorizontals = new Set<string>();
  const uniqueTransversals = new Set<string>();

  profiles.forEach((profile) => {
    if (profile.municipality) {
      void profile.municipality;
    }
  });

  engagements.forEach((engagement) => {
    if (Array.isArray(engagement.vertical)) {
      engagement.vertical.forEach((value) => {
        const normalized = value?.trim();
        if (normalized) uniqueVerticals.add(normalized);
      });
    }
    if (Array.isArray(engagement.horizontal)) {
      engagement.horizontal.forEach((value) => {
        const normalized = value?.trim();
        if (normalized) uniqueHorizontals.add(normalized);
      });
    }
    if (Array.isArray(engagement.transversal)) {
      engagement.transversal.forEach((value) => {
        const normalized = value?.trim();
        if (normalized) uniqueTransversals.add(normalized);
      });
    }
  });

  return {
    verticals: Array.from(uniqueVerticals).sort(),
    horizontals: Array.from(uniqueHorizontals).sort(),
    transversals: Array.from(uniqueTransversals).sort(),
  };
}

export function buildCityFrequency(profiles: UserProfile[]): Record<string, number> {
  const cityFreq: Record<string, number> = {};

  profiles.forEach((profile) => {
    if (profile.municipality) {
      const city = profile.municipality.trim().charAt(0).toUpperCase() + profile.municipality.trim().slice(1);
      cityFreq[city] = (cityFreq[city] || 0) + 1;
    }
  });

  return cityFreq;
}
