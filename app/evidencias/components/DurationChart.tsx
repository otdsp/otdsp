"use client";

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  CartesianGrid
} from 'recharts';

type Point = { label: string; value: number };
type Series = { dimension: string; color: string; data: Point[] };

export default function DurationChart({ series }: { series: Series[] }) {
  const merged = useMemo(() => {
    const labels = new Set<string>();
    series.forEach(s => s.data.forEach(d => labels.add(d.label)));
    const allLabels = Array.from(labels).sort();

    return allLabels.map(label => {
      const entry: Record<string, string | number> = { label };
      series.forEach(s => {
        const found = s.data.find(d => d.label === label);
        entry[s.dimension] = found ? found.value : 0;
      });
      return entry;
    });
  }, [series]);

  return (
    <div style={{ width: '100%', height: 360 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={merged} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />
          {series.map(s => (
            <Bar key={s.dimension} dataKey={s.dimension} fill={s.color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
