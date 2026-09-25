"use client";

import React, { useMemo, useRef, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  CartesianGrid,
} from "recharts";

import type { MunicipalityChartRow } from "../types";

/* =========================================================
 * CORES
 * Mesmas utilizadas pelo DurationChart
 * ======================================================= */

const SERIES_COLORS = {
  Vertical: "#10b981",
  Horizontal: "#1f77b4",
  Transversal: "#ff7f0e",
};

/* =========================================================
 * TIPOS
 * ======================================================= */

type TooltipProps = {
  active?: boolean;
  payload?: any[];
};

/* =========================================================
 * HELPERS
 * ======================================================= */

function formatHours(value?: number) {
  const hours = Number(value ?? 0);

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: Number.isInteger(hours) ? 0 : 1,
    maximumFractionDigits: 2,
  }).format(hours);
}

function getParticipantKey(
  participant: MunicipalityChartRow["participants"][number],
  index: number
) {
  if (participant.email?.trim()) {
    return participant.email.trim().toLowerCase();
  }

  return `${participant.name}-${participant.role}-${index}`;
}

/* =========================================================
 * TOOLTIP CUSTOMIZADO
 *
 * Visual inspirado diretamente no DurationChart
 * ======================================================= */

function MunicipalityCustomTooltip({
  active,
  payload,
}: TooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0]?.payload as MunicipalityChartRow;

  if (!data) return null;

  /*
   * Mantém participantes únicos.
   *
   * Prioriza o e-mail quando disponível.
   * Para registros sem e-mail utiliza nome/função.
   */
  const uniqueParticipants = Array.from(
    new Map(
      (data.participants ?? []).map(
        (participant, index) => [
          getParticipantKey(participant, index),
          participant,
        ]
      )
    ).values()
  );

  const dimensionItems = [
    {
      key: "Vertical",
      label: "Vertical",
      value: Number(data.verticalHours ?? 0),
      color: SERIES_COLORS.Vertical,
    },
    {
      key: "Horizontal",
      label: "Horizontal",
      value: Number(data.horizontalHours ?? 0),
      color: SERIES_COLORS.Horizontal,
    },
    {
      key: "Transversal",
      label: "Transversal",
      value: Number(data.transversalHours ?? 0),
      color: SERIES_COLORS.Transversal,
    },
  ].filter((item) => item.value > 0);

  return (
    <div
      className="
        min-w-[290px]
        max-w-[340px]
        overflow-hidden
        rounded-2xl
        border border-slate-100
        bg-white/95
        text-slate-900
        shadow-xl
        backdrop-blur-md

        animate-in
        fade-in-0
        zoom-in-95
        duration-200
      "
    >
      {/* =================================================
       * CABEÇALHO
       * Município + quantidade de engajamentos
       * =============================================== */}
      <div className="px-4 pt-3.5">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
              Município
            </p>

            <p className="mt-0.5 truncate text-sm font-bold text-slate-800">
              {data.municipality}
            </p>
          </div>

          <div
            className="
              shrink-0
              rounded-full
              bg-slate-50
              px-2.5
              py-1.5
              text-[10px]
              font-semibold
              text-slate-500
            "
          >
            {data.engagementCount ?? 0}{" "}
            {(data.engagementCount ?? 0) === 1
              ? "engajamento"
              : "engajamentos"}
          </div>
        </div>
      </div>

      {/* =================================================
       * TOTAL DE HORAS
       * =============================================== */}
      <div className="px-4 pt-3.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
          Total de horas
        </p>

        <p className="mt-1 text-[26px] font-bold leading-none tracking-tight text-slate-950">
          {formatHours(data.totalHours)}
          <span className="ml-1 text-xs font-semibold text-slate-400">
            h
          </span>
        </p>
      </div>

      {/* =================================================
       * DIMENSÕES
       * =============================================== */}
      {dimensionItems.length > 0 && (
        <div className="px-4 pb-3.5 pt-4">
          <div className="space-y-2.5">
            {dimensionItems.map((item) => (
              <div
                key={item.key}
                className="
                  flex
                  items-center
                  justify-between
                  gap-5
                  text-xs
                "
              >
                <div className="flex items-center gap-2 font-medium text-slate-600">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />

                  <span>{item.label}</span>
                </div>

                <span className="font-bold text-slate-950">
                  {formatHours(item.value)}
                  <span className="ml-0.5 text-[10px] font-medium text-slate-400">
                    h
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================
       * PARTICIPANTES
       * =============================================== */}
      {uniqueParticipants.length > 0 && (
        <>
          <div className="mx-4 border-t border-slate-100" />

          <div className="px-4 pb-2 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Participantes
            </p>
          </div>

          <div
            className="
              max-h-[190px]
              overflow-y-auto
              overscroll-contain
              px-2
              pb-2

              [scrollbar-width:thin]

              [&::-webkit-scrollbar]:w-1
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-slate-200
              hover:[&::-webkit-scrollbar-thumb]:bg-slate-300
            "
          >
            {uniqueParticipants.map(
              (participant, index) => (
                <div
                  key={getParticipantKey(
                    participant,
                    index
                  )}
                  className="
                    rounded-xl
                    px-3
                    py-2
                    transition-all
                    duration-200

                    hover:bg-slate-50
                  "
                >
                  <p className="truncate text-[12px] font-semibold text-slate-700">
                    {participant.name}
                  </p>

                  {participant.role && (
                    <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">
                      {participant.role}
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
 * GRÁFICO
 * ======================================================= */

export default function MunicipalityChart({
  data,
}: {
  data: MunicipalityChartRow[];
}) {
  /*
   * Mantém os 12 municípios com maior total
   * de horas.
   */
  const chartData = useMemo(
    () =>
      [...data]
        .sort(
          (a, b) =>
            Number(b.totalHours ?? 0) -
            Number(a.totalHours ?? 0)
        )
        .slice(0, 12),
    [data]
  );

  /* =======================================================
   * Determina quais dimensões possuem dados
   * ===================================================== */

  const activeDimensions = useMemo(() => {
    const active = new Set<string>();

    if (
      chartData.some(
        (item) =>
          Number(item.horizontalHours ?? 0) > 0
      )
    ) {
      active.add("Horizontal");
    }

    if (
      chartData.some(
        (item) =>
          Number(item.verticalHours ?? 0) > 0
      )
    ) {
      active.add("Vertical");
    }

    if (
      chartData.some(
        (item) =>
          Number(item.transversalHours ?? 0) > 0
      )
    ) {
      active.add("Transversal");
    }

    return active;
  }, [chartData]);

  /* =======================================================
   * Tooltip por clique
   * ===================================================== */

  const [tooltipVisible, setTooltipVisible] =
    useState(false);

  const chartContainerRef =
    useRef<HTMLDivElement>(null);

  const handleBarClick = () => {
    setTooltipVisible(true);

    requestAnimationFrame(() => {
      chartContainerRef.current?.focus();
    });
  };

  const handleBlur = (
    event: React.FocusEvent<HTMLDivElement>
  ) => {
    const nextFocusedElement =
      event.relatedTarget as Node | null;

    if (
      !nextFocusedElement ||
      !event.currentTarget.contains(
        nextFocusedElement
      )
    ) {
      setTooltipVisible(false);
    }
  };

  /* =======================================================
   * LEGENDA CUSTOMIZADA
   *
   * Mesmo padrão visual do DurationChart
   * ===================================================== */

  const renderCustomLegend = (props: any) => {
    const { payload } = props;

    if (!payload) return null;

    const filteredPayload = payload.filter(
      (entry: any) =>
        activeDimensions.has(entry.value)
    );

    return (
      <div
        className="
          mb-6
          flex
          h-10
          items-center
          justify-end
          gap-4
          text-xs
          font-medium
          text-slate-500
        "
      >
        {filteredPayload.map(
          (entry: any, index: number) => (
            <div
              key={`item-${index}`}
              className="
                flex
                items-center
                gap-1.5
                transition-opacity
                duration-200
                hover:opacity-70
              "
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor: entry.color,
                }}
              />

              <span className="font-medium text-slate-600">
                {entry.value}
              </span>
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div
      ref={chartContainerRef}
      tabIndex={-1}
      onBlur={handleBlur}
      onMouseLeave={() =>
        setTooltipVisible(false)
      }
      className="h-[360px] w-full outline-none"
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={chartData}
          barGap={4}
          barCategoryGap="24%"
          margin={{
            top: 10,
            right: 10,
            left: -25,
            bottom: 10,
          }}
        >
          {/* =============================================
           * GRID
           * Igual ao DurationChart
           * =========================================== */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />

          {/* =============================================
           * MUNICÍPIOS
           * =========================================== */}
          <XAxis
            dataKey="municipality"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={60}
            tickMargin={8}
          />

          {/* =============================================
           * HORAS
           * =========================================== */}
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals
            tickFormatter={(value) =>
              `${formatHours(Number(value))}h`
            }
          />

          {/* =============================================
           * TOOLTIP
           * =========================================== */}
          <Tooltip
            content={
              <MunicipalityCustomTooltip />
            }
            trigger="click"
            active={tooltipVisible}
            cursor={{
              fill: "#f8fafc",
              opacity: 0.6,
            }}
            wrapperStyle={{
              pointerEvents: "auto",
              zIndex: 50,
              outline: "none",
            }}
            allowEscapeViewBox={{
              x: true,
              y: true,
            }}
            offset={12}
            isAnimationActive
            animationDuration={180}
          />

          {/* =============================================
           * LEGENDA
           * =========================================== */}
          <Legend
            content={renderCustomLegend}
            verticalAlign="top"
            align="right"
          />

          {/* =============================================
           * HORIZONTAL
           *
           * Mesma cor do DurationChart
           * =========================================== */}
          {activeDimensions.has(
            "Horizontal"
          ) && (
            <Bar
              dataKey="horizontalHours"
              name="Horizontal"
              fill={
                SERIES_COLORS.Horizontal
              }
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              onClick={handleBarClick}
              isAnimationActive
              animationBegin={0}
              animationDuration={650}
              animationEasing="ease-out"
            />
          )}

          {/* =============================================
           * VERTICAL
           * =========================================== */}
          {activeDimensions.has(
            "Vertical"
          ) && (
            <Bar
              dataKey="verticalHours"
              name="Vertical"
              fill={SERIES_COLORS.Vertical}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              onClick={handleBarClick}
              isAnimationActive
              animationBegin={80}
              animationDuration={650}
              animationEasing="ease-out"
            />
          )}

          {/* =============================================
           * TRANSVERSAL
           * =========================================== */}
          {activeDimensions.has(
            "Transversal"
          ) && (
            <Bar
              dataKey="transversalHours"
              name="Transversal"
              fill={
                SERIES_COLORS.Transversal
              }
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              onClick={handleBarClick}
              isAnimationActive
              animationBegin={160}
              animationDuration={650}
              animationEasing="ease-out"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}