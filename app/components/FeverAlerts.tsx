import type { TemperatureTrend } from "@/lib/types";

interface Props {
  trend: TemperatureTrend;
  unit: "C" | "F";
}

export default function FeverAlerts({ trend, unit }: Props) {
  return (
    <>
      {trend.currentTemp > 39 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-3">
          <p className="text-rose-700 font-bold text-sm">High Fever Alert</p>
          <p className="text-rose-600 text-xs mt-0.5">
            Temperature is {trend.currentTemp.toFixed(1)}°{unit}. Consider
            contacting a doctor.
          </p>
        </div>
      )}

      {trend.trend === "worsening" && trend.currentTemp <= 39 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
          <p className="text-amber-700 font-bold text-sm">Fever Worsening</p>
          <p className="text-amber-600 text-xs mt-0.5">
            Temperature is trending upward. Monitor closely.
          </p>
        </div>
      )}
    </>
  );
}
