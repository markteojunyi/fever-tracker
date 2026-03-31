"use client";

import { TemperatureTrend } from "@/lib/types";

interface StatusCardProps {
  trend: TemperatureTrend;
  unit: "C" | "F";
}

export default function StatusCard({ trend, unit }: StatusCardProps) {
  const isFever = trend.currentTemp > 37.5;
  const isWorsening = trend.trend === "worsening";
  const isImproving = trend.trend === "improving";

  const cardBg = isFever
    ? "bg-rose-50 border-rose-200"
    : "bg-emerald-50 border-emerald-200";

  const trendColor = isImproving
    ? "text-emerald-600"
    : isWorsening
      ? "text-rose-600"
      : "text-amber-600";

  const trendIcon =
    trend.trendDirection === "down"
      ? "↓"
      : trend.trendDirection === "up"
        ? "↑"
        : "→";

  const trendLabel =
    trend.trend.charAt(0).toUpperCase() + trend.trend.slice(1);

  return (
    <div className={`border rounded-xl p-5 mb-4 ${cardBg}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Current Temperature
          </p>
          <p className="text-5xl font-bold text-slate-800">
            {trend.currentTemp.toFixed(1)}°{unit}
          </p>
          <span
            className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isFever
                ? "bg-rose-100 text-rose-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {isFever ? "Fever" : "Normal"}
          </span>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${trendColor}`}>
            {trendIcon} {trendLabel}
          </p>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-slate-500">
              Peak:{" "}
              <span className="font-semibold text-slate-700">
                {trend.peakTemp.toFixed(1)}°{unit}
              </span>
            </p>
            <p className="text-xs text-slate-500">
              Low:{" "}
              <span className="font-semibold text-slate-700">
                {trend.lowestTemp.toFixed(1)}°{unit}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
