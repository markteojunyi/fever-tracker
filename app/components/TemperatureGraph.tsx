"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TemperatureReading } from "@/lib/types";

interface TemperatureGraphProps {
  readings: TemperatureReading[];
  unit: "C" | "F";
}

const CustomTick: React.FC<{
  x?: number;
  y?: number;
  payload?: { value: string | number | Date };
}> = ({ x, y, payload }) => {
  const date = new Date(payload?.value || 0);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <text x={x} y={y} dy={16} textAnchor="middle" fill="#94a3b8" fontSize={11}>
      <tspan x={x} dy="10">
        {dateStr}
      </tspan>
      <tspan x={x} dy="15">
        {timeStr}
      </tspan>
    </text>
  );
};

export default function TemperatureGraph({
  readings,
  unit,
}: TemperatureGraphProps) {
  if (readings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-4 text-center text-slate-400 text-sm">
        No temperature readings yet
      </div>
    );
  }

  const chartData = readings
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    .map((r) => ({
      fullTime: r.timestamp,
      temperature: r.temperature,
    }));

  const normalMax = unit === "C" ? 37.5 : 99.5;
  const feverThreshold = unit === "C" ? 39 : 102.2;

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
            label={{
              value: `°${unit}`,
              angle: -90,
              position: "insideLeft",
              fill: "#94a3b8",
              fontSize: 11,
            }}
          />
          <Tooltip
            formatter={(value) => [`${value}°${unit}`, "Temperature"]}
            labelFormatter={(label) => {
              const d = new Date(label);
              return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
            }}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: "#6366f1", r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#4f46e5" }}
            name="Temperature"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-3 flex gap-4 text-xs text-slate-500">
        <span>🟢 Normal &lt;{normalMax}°{unit}</span>
        <span>🟠 Mild {normalMax}–{feverThreshold}°{unit}</span>
        <span>🔴 High &gt;{feverThreshold}°{unit}</span>
      </div>
    </div>
  );
}
