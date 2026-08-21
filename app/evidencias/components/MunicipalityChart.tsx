"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Legend,
} from "recharts";

import type { MunicipalityChartRow } from "../types";

type TooltipProps = {
  active?: boolean;
  payload?: any[];
};

function MunicipalityTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload as MunicipalityChartRow;

  if (!data) return null;

  // Garante participantes únicos pelo e-mail
  const uniqueParticipants = Array.from(
    new Map(
      (data.participants ?? []).map((participant) => [
        participant.email,
        participant,
      ])
    ).values()
  );

  const participantCount = uniqueParticipants.length;

  return (
    <div
      className="
        w-[230px]
        rounded-lg
        border border-slate-200
        bg-white
        shadow-lg
      "
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2">
        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
          {data.municipality}
        </p>

        <span className="shrink-0 text-[10px] font-medium text-slate-500">
          {participantCount}{" "}
          {participantCount === 1 ? "participante" : "participantes"}
        </span>
      </div>

      {/* Lista */}
      <div
        className="
          max-h-[160px]
          overflow-y-auto
          overscroll-contain

          [scrollbar-width:thin]

          [&::-webkit-scrollbar]:w-1
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-slate-300
        "
      >
        {uniqueParticipants.length > 0 ? (
          uniqueParticipants.map((participant) => (
            <div
              key={participant.email}
              className="
                border-b border-slate-50
                px-3 py-1.5
                last:border-b-0
                hover:bg-slate-50
              "
            >
              <p className="truncate text-[11px] font-medium leading-tight text-slate-700">
                {participant.name}
              </p>

              {participant.role && (
                <p className="mt-0.5 truncate text-[9px] leading-tight text-slate-400">
                  {participant.role}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="px-3 py-4 text-center text-[10px] text-slate-400">
            Nenhum participante
          </p>
        )}
      </div>
    </div>
  );
}

export default function MunicipalityChart({
  data,
}: {
  data: MunicipalityChartRow[];
}) {
  const chartData = useMemo(() => data.slice(0, 12), [data]);

  const [tooltipVisible, setTooltipVisible] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const handleBarClick = () => {
    setTooltipVisible(true);

    // Dá foco ao container para permitir fechar com onBlur
    requestAnimationFrame(() => {
      chartContainerRef.current?.focus();
    });
  };

  const handleBlur = (
    event: React.FocusEvent<HTMLDivElement>
  ) => {
    /*
     * Só fecha se o novo elemento em foco
     * estiver realmente fora do gráfico.
     */
    const nextFocusedElement = event.relatedTarget as Node | null;

    if (
      !nextFocusedElement ||
      !event.currentTarget.contains(nextFocusedElement)
    ) {
      setTooltipVisible(false);
    }
  };

  return (
    <div
      ref={chartContainerRef}
      tabIndex={-1}
      onBlur={handleBlur}
      onMouseLeave={() => setTooltipVisible(false)}
      className="h-[390px] w-full outline-none"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 8,
            right: 10,
            left: -25,
            bottom: 40,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />

          <XAxis
            dataKey="municipality"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            angle={-30}
            textAnchor="end"
            interval={0}
            height={55}
          />

          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />

          <Tooltip
            content={<MunicipalityTooltip />}
            trigger="click"
            active={tooltipVisible}
            wrapperStyle={{
              pointerEvents: "auto",
              zIndex: 50,
            }}
            allowEscapeViewBox={{
              x: true,
              y: true,
            }}
            isAnimationActive={false}
            cursor={{
              fill: "#f8fafc",
              opacity: 0.8,
            }}
          />

          <Legend
            verticalAlign="top"
            align="right"
            height={24}
            iconType="circle"
            iconSize={7}
            wrapperStyle={{
              fontSize: 10,
              color: "#64748b",
              fontWeight: 500,
              paddingTop: 2,
            }}
          />

          <Bar
            dataKey="verticalCount"
            stackId="a"
            name="Vertical"
            fill="#10b981"
            barSize={20}
            onClick={handleBarClick}
          />

          <Bar
            dataKey="horizontalCount"
            stackId="a"
            name="Horizontal"
            fill="#0ea5e9"
            barSize={20}
            onClick={handleBarClick}
          />

          <Bar
            dataKey="transversalCount"
            stackId="a"
            name="Transversal"
            fill="#e9910e"
            barSize={20}
            onClick={handleBarClick}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}