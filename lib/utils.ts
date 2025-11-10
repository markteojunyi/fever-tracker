import { TemperatureReading, TemperatureTrend } from './types';

/**
 * Calculate temperature trend from readings
 */
export function calculateTrend(readings: TemperatureReading[]): TemperatureTrend {
  if (readings.length === 0) {
    return {
      currentTemp: 0,
      peakTemp: 0,
      lowestTemp: 0,
      trend: 'stable',
      trendDirection: 'flat',
      avgTempLast24h: 0,
      readings: [],
    };
  }

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const currentTemp = sorted[sorted.length - 1].temperature;
  const peakTemp = Math.max(...sorted.map((r) => r.temperature));
  const lowestTemp = Math.min(...sorted.map((r) => r.temperature));

  // Determine trend: compare last reading with first reading
  const firstTemp = sorted[0].temperature;
  let trendDirection: 'up' | 'down' | 'flat' = 'flat';
  if (currentTemp > firstTemp + 0.3) trendDirection = 'up';
  if (currentTemp < firstTemp - 0.3) trendDirection = 'down';

  const trend = trendDirection === 'down' ? 'improving' : trendDirection === 'up' ? 'worsening' : 'stable';

  // Average temp last 24h
  const last24h = sorted.filter((r) => {
    const age = Date.now() - new Date(r.timestamp).getTime();
    return age <= 24 * 60 * 60 * 1000;
  });

  const avgTempLast24h =
    last24h.length > 0 ? last24h.reduce((sum, r) => sum + r.temperature, 0) / last24h.length : 0;

  return {
    currentTemp,
    peakTemp,
    lowestTemp,
    trend,
    trendDirection,
    avgTempLast24h,
    readings: sorted.map((r) => ({
      timestamp: r.timestamp,
      temperature: r.temperature,
      unit: r.temperatureUnit,
    })),
  };
}

/**
 * Format date/time for display
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check overdose risk
 */
export function checkOverdoseRisk(
  logsToday: number,
  maxDosesPerDay: number
): 'safe' | 'warning' | 'dangerous' {
  const percentage = (logsToday / maxDosesPerDay) * 100;
  if (percentage >= 100) return 'dangerous';
  if (percentage >= 75) return 'warning';
  return 'safe';
}