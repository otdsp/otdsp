import type { DurationChartSeries, EvidenceFilters, PillarMetric } from '../types';

export interface MiniPillarBarViewModel extends PillarMetric {
  widthPercentage: number;
}

export interface DurationChartRow {
  label: string;
  [dimension: string]: string | number;
}

export function buildActiveFiltersSummary(filters: EvidenceFilters): string {
  const parts = [
    `Vertical: ${filters.vertical.enabled ? (filters.vertical.values.length ? filters.vertical.values.join(', ') : 'Nenhum item selecionado') : 'Desativado'}`,
    `Horizontal: ${filters.horizontal.enabled ? (filters.horizontal.values.length ? filters.horizontal.values.join(', ') : 'Nenhum item selecionado') : 'Desativado'}`,
    `Transversal: ${filters.transversal.enabled ? (filters.transversal.values.length ? filters.transversal.values.join(', ') : 'Nenhum item selecionado') : 'Desativado'}`,
  ];

  return parts.join(' • ');
}

export function getGeoMarkerColor(count: number): string {
  if (count > 50) return '#b91c1c';
  if (count > 20) return '#dc2626';
  if (count > 5) return '#f97316';
  return '#eab308';
}

export function buildMiniPillarBars(items: PillarMetric[]): MiniPillarBarViewModel[] {
  const maxCount = items.reduce((highest, item) => Math.max(highest, item.count), 1);

  return items.map((item) => ({
    ...item,
    widthPercentage: maxCount > 0 ? (item.count / maxCount) * 100 : 0,
  }));
}

export function buildDurationChartRows(series: DurationChartSeries[]): DurationChartRow[] {
  const labels = new Set<string>();
  series.forEach((item) => item.data.forEach((point) => labels.add(point.label)));

  const orderedLabels = Array.from(labels).sort();

  return orderedLabels.map((label) => {
    const row: DurationChartRow = { label };

    series.forEach((item) => {
      const match = item.data.find((point) => point.label === label);
      row[item.dimension] = match ? match.value : 0;
    });

    return row;
  });
}

export function getActiveDurationDimensions(series: DurationChartSeries[], rows: DurationChartRow[]): string[] {
  const activeSet = new Set<string>();

  rows.forEach((row) => {
    series.forEach((item) => {
      const value = row[item.dimension];
      if (typeof value === 'number' && value > 0) {
        activeSet.add(item.dimension);
      }
    });
  });

  return Array.from(activeSet);
}
