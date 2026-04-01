// ─── Strategy Pattern ─────────────────────────────────────────────────────────
// Before: calculateTrend contained a single hardcoded algorithm — compare the
//         first reading against the most recent one, with a fixed ±0.3° delta
//         threshold. There was no way to swap the algorithm without editing this
//         file.
// After:  a TrendStrategy interface defines the contract. FirstLastDeltaStrategy
//         encapsulates the original algorithm. calculateTrend accepts any
//         TrendStrategy, defaulting to FirstLastDeltaStrategy. A new algorithm
//         (e.g. rolling-average-based) can be introduced by implementing the
//         interface and passing it in — callers and this file stay untouched.
// ─────────────────────────────────────────────────────────────────────────────

import { TemperatureReading, TemperatureTrend } from "./types";

// ── Strategy interface ────────────────────────────────────────────────────────
export interface TrendStrategy {
  evaluate(sorted: TemperatureReading[]): {
    trend: "improving" | "worsening" | "stable";
    trendDirection: "up" | "down" | "flat";
  };
}

// ── Concrete strategy: compare first reading against most recent ──────────────
export class FirstLastDeltaStrategy implements TrendStrategy {
  constructor(private readonly threshold = 0.3) {}

  evaluate(sorted: TemperatureReading[]): {
    trend: "improving" | "worsening" | "stable";
    trendDirection: "up" | "down" | "flat";
  } {
    const first = sorted[0].temperature;
    const current = sorted[sorted.length - 1].temperature;

    let trendDirection: "up" | "down" | "flat" = "flat";
    if (current > first + this.threshold) trendDirection = "up";
    if (current < first - this.threshold) trendDirection = "down";

    const trend: "improving" | "worsening" | "stable" =
      trendDirection === "down"
        ? "improving"
        : trendDirection === "up"
          ? "worsening"
          : "stable";

    return { trend, trendDirection };
  }
}

// Shared default — avoids allocating a new instance on every calculateTrend call
const defaultStrategy = new FirstLastDeltaStrategy();

// ── Public API ────────────────────────────────────────────────────────────────
export function calculateTrend(
  readings: TemperatureReading[],
  strategy: TrendStrategy = defaultStrategy
): TemperatureTrend {
  if (readings.length === 0) {
    return {
      currentTemp: 0,
      peakTemp: 0,
      lowestTemp: 0,
      trend: "stable",
      trendDirection: "flat",
      avgTempLast24h: 0,
      readings: [],
    };
  }

  const sorted = [...readings].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const currentTemp = sorted[sorted.length - 1].temperature;
  const peakTemp = Math.max(...sorted.map((r) => r.temperature));
  const lowestTemp = Math.min(...sorted.map((r) => r.temperature));

  const { trend, trendDirection } = strategy.evaluate(sorted);

  const last24h = sorted.filter(
    (r) => Date.now() - new Date(r.timestamp).getTime() <= 24 * 60 * 60 * 1000
  );
  const avgTempLast24h =
    last24h.length > 0
      ? last24h.reduce((sum, r) => sum + r.temperature, 0) / last24h.length
      : 0;

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
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Check overdose risk
 */
export function checkOverdoseRisk(
  logsToday: number,
  maxDosesPerDay: number
): "safe" | "warning" | "dangerous" {
  const percentage = (logsToday / maxDosesPerDay) * 100;
  if (percentage >= 100) return "dangerous";
  if (percentage >= 75) return "warning";
  return "safe";
}
