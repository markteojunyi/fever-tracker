// ============================================
// FILE: app/components/TemperatureGraph.tsx
// Chart showing temperature over time
// ============================================

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TemperatureReading } from '@/lib/types';

interface TemperatureGraphProps {
  readings: TemperatureReading[];
  unit: 'C' | 'F';
}

// Custom tick renderer for multi-line labels
const CustomTick: React.FC<any> = ({ x, y, payload }) => {
  const date = new Date(payload.value);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <text x={x} y={y} dy={16} textAnchor="middle" fill="#666" fontSize={12}>
      <tspan x={x} dy="10">{dateStr}</tspan>
      <tspan x={x} dy="15">{timeStr}</tspan>
    </text>
  );
};

export default function TemperatureGraph({ readings, unit }: TemperatureGraphProps) {
  if (readings.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-4 text-center text-gray-500">
        No temperature readings yet
      </div>
    );
  }

  // Format data for chart (keep raw timestamp for axis)
  const chartData = readings
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((r) => ({
      fullTime: r.timestamp,       // raw timestamp for axis
      temperature: r.temperature,
    }));

  // Define reference lines
  const normalMax = unit === 'C' ? 37.5 : 99.5;
  const feverThreshold = unit === 'C' ? 39 : 102.2;

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-bold mb-3">Temperature Trend (Last 24h)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="fullTime"
            tick={<CustomTick />}
            height={80}
          />
          <YAxis
            domain={[35, 41]}
            label={{ value: `°${unit}`, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value) => [`${value}°${unit}`, 'Temperature']}
            labelFormatter={(label) => {
              const d = new Date(label);
              const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              return `${dateStr} ${timeStr}`;
            }}
            labelStyle={{ color: '#000' }}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#3b82f6"
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Temperature"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-3 text-xs text-gray-600 space-y-1">
        <p>🟢 Normal: &lt; {normalMax}°{unit}</p>
        <p>🟠 Mild Fever: {normalMax} - {feverThreshold}°{unit}</p>
        <p>🔴 High Fever: &gt; {feverThreshold}°{unit}</p>
      </div>
    </div>
  );
}
