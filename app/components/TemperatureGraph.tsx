// ============================================
// FILE: app/components/TemperatureGraph.tsx
// Chart showing temperature over time
// ============================================

'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TemperatureReading } from '@/lib/types';

interface TemperatureGraphProps {
  readings: TemperatureReading[];
  unit: 'C' | 'F';
}

export default function TemperatureGraph({ readings, unit }: TemperatureGraphProps) {
  if (readings.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-4 text-center text-gray-500">
        No temperature readings yet
      </div>
    );
  }

  // Format data for chart
  const chartData = readings
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((r) => ({
      timestamp: new Date(r.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      temperature: r.temperature,
      fullTime: r.timestamp,
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
          <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
          <YAxis domain={[35, 41]} label={{ value: `°${unit}`, angle: -90, position: 'insideLeft' }} />
          <Tooltip
            formatter={(value) => [`${value}°${unit}`, 'Temperature']}
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