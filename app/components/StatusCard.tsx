// ============================================
// FILE: app/components/StatusCard.tsx
// Shows current temperature and trend
// ============================================

'use client';

import { TemperatureTrend } from '@/lib/types';

interface StatusCardProps {
  trend: TemperatureTrend;
  unit: 'C' | 'F';
}

export default function StatusCard({ trend, unit }: StatusCardProps) {
  const getTrendColor = () => {
    if (trend.trend === 'improving') return 'bg-green-50 border-green-200';
    if (trend.trend === 'worsening') return 'bg-red-50 border-red-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getTrendIcon = () => {
    if (trend.trendDirection === 'down') return '↓';
    if (trend.trendDirection === 'up') return '↑';
    return '→';
  };

  const getTrendTextColor = () => {
    if (trend.trend === 'improving') return 'text-green-700';
    if (trend.trend === 'worsening') return 'text-red-700';
    return 'text-yellow-700';
  };

  const isFever = trend.currentTemp > 37.5;

  return (
    <div className={`${getTrendColor()} border-2 rounded-lg p-4 mb-4`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-600">Current Temperature</p>
          <p className="text-4xl font-bold">{trend.currentTemp.toFixed(1)}°{unit}</p>
          {isFever && <p className="text-sm text-red-600 font-semibold">🔴 FEVER</p>}
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${getTrendTextColor()}`}>
            {getTrendIcon()} {trend.trend.charAt(0).toUpperCase() + trend.trend.slice(1)}
          </p>
          <p className="text-sm text-gray-600 mt-2">Peak: {trend.peakTemp.toFixed(1)}°{unit}</p>
          <p className="text-sm text-gray-600">Low: {trend.lowestTemp.toFixed(1)}°{unit}</p>
        </div>
      </div>
    </div>
  );
}