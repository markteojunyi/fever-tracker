"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { TemperatureReading } from "@/lib/types";
import { useState } from "react";

interface TemperatureGraphProps {
  readings: TemperatureReading[];
  unit: "C" | "F";
  onDeleteReading: (id: string) => void;
}

const CustomTick: React.FC<{
  x?: number;
  y?: number;
  payload?: { value: string | number | Date };
}> = ({ x, y, payload }) => {
  const date = new Date(payload?.value || 0);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <text x={x} y={y} dy={16} textAnchor="middle" fill="#94a3b8" fontSize={11}>
      <tspan x={x} dy="10">{dateStr}</tspan>
      <tspan x={x} dy="15">{timeStr}</tspan>
    </text>
  );
};

export default function TemperatureGraph({ readings, unit, onDeleteReading }: TemperatureGraphProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (readings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 mb-4 text-center">
        <div className="text-4xl mb-3">🌡️</div>
        <p className="text-slate-600 font-medium text-sm">No readings yet</p>
        <p className="text-slate-400 text-xs mt-1">
          Log the first temperature above to start tracking
        </p>
      </div>
    );
  }

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const chartData = sorted.map((r) => ({
    fullTime: r.timestamp,
    temperature: r.temperature,
  }));

  const normalMax = unit === "C" ? 37.5 : 99.5;
  const feverThreshold = unit === "C" ? 39 : 102.2;

  const getDotColor = (temp: number) => {
    if (temp > feverThreshold) return "#f43f5e";
    if (temp > normalMax) return "#f97316";
    return "#22c55e";
  };

  const CustomDot = (props: { cx?: number; cy?: number; payload?: { temperature: number } }) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined || !payload) return null;
    return <circle cx={cx} cy={cy} r={7} fill={getDotColor(payload.temperature)} stroke="#fff" strokeWidth={2} />;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Temperature Trend (Last 24h)
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="fullTime" tick={<CustomTick />} height={80} />
          <YAxis
            domain={[35, 41]}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            label={{ value: `°${unit}`, angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }}
          />
          {/* Normal zone — green */}
          <ReferenceArea y1={35} y2={normalMax} fill="#dcfce7" fillOpacity={0.5} ifOverflow="hidden" />
          {/* Mild fever zone — amber */}
          <ReferenceArea y1={normalMax} y2={feverThreshold} fill="#fef9c3" fillOpacity={0.6} ifOverflow="hidden" />
          {/* High fever zone — rose */}
          <ReferenceArea y1={feverThreshold} y2={41} fill="#ffe4e6" fillOpacity={0.6} ifOverflow="hidden" />
          <Tooltip
            formatter={(value) => [`${value}°${unit}`, "Temperature"]}
            labelFormatter={(label) => {
              const d = new Date(label);
              return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
            }}
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#6366f1"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 6, fill: "#4f46e5" }}
            name="Temperature"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3 flex gap-4 text-xs text-slate-500 mb-4">
        <span>🟢 Normal &lt;{normalMax}°{unit}</span>
        <span>🟠 Mild {normalMax}–{feverThreshold}°{unit}</span>
        <span>🔴 High &gt;{feverThreshold}°{unit}</span>
      </div>

      {/* Readings list with delete */}
      <div className="border-t border-slate-100 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          All Readings
        </p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {[...sorted].reverse().map((r) => {
            const isConfirming = confirmingId === r._id;
            const dotColor = getDotColor(r.temperature);
            return (
              <div
                key={r._id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    {r.temperature.toFixed(1)}°{unit}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                    {new Date(r.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {r.notes && (
                    <span className="text-xs text-slate-400 italic">— {r.notes}</span>
                  )}
                </div>
                {isConfirming ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => { onDeleteReading(r._id!); setConfirmingId(null); }}
                      className="px-2 py-0.5 bg-rose-600 text-white text-xs rounded-lg font-semibold"
                      style={{ color: "#ffffff" }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-lg font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingId(r._id!)}
                    className="text-rose-400 hover:text-rose-600 transition-colors text-base"
                    title="Delete reading"
                  >
                    🗑
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
