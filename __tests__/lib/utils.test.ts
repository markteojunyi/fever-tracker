import { describe, it, expect } from "vitest";
import {
  calculateTrend,
  checkOverdoseRisk,
  formatDateTime,
  FirstLastDeltaStrategy,
  type TrendStrategy,
} from "@/lib/utils";
import type { TemperatureReading } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReading(
  temperature: number,
  minutesAgo: number,
  id = Math.random().toString()
): TemperatureReading {
  return {
    _id: id,
    childId: "child-1",
    temperature,
    temperatureUnit: "C",
    timestamp: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };
}

// ─── calculateTrend ───────────────────────────────────────────────────────────

describe("calculateTrend", () => {
  it("returns zero/stable defaults when there are no readings", () => {
    const result = calculateTrend([]);
    expect(result.currentTemp).toBe(0);
    expect(result.peakTemp).toBe(0);
    expect(result.lowestTemp).toBe(0);
    expect(result.trend).toBe("stable");
    expect(result.trendDirection).toBe("flat");
    expect(result.avgTempLast24h).toBe(0);
    expect(result.readings).toHaveLength(0);
  });

  it("handles a single reading", () => {
    const result = calculateTrend([makeReading(38.0, 10)]);
    expect(result.currentTemp).toBe(38.0);
    expect(result.peakTemp).toBe(38.0);
    expect(result.lowestTemp).toBe(38.0);
    expect(result.trend).toBe("stable");
  });

  it("returns the most recent reading as currentTemp", () => {
    const readings = [
      makeReading(37.5, 60), // oldest
      makeReading(38.2, 30),
      makeReading(39.1, 5),  // most recent
    ];
    const result = calculateTrend(readings);
    expect(result.currentTemp).toBe(39.1);
  });

  it("correctly identifies peak and lowest temperatures", () => {
    const readings = [
      makeReading(36.8, 120),
      makeReading(39.5, 60),
      makeReading(37.2, 10),
    ];
    const result = calculateTrend(readings);
    expect(result.peakTemp).toBe(39.5);
    expect(result.lowestTemp).toBe(36.8);
  });

  it("sorts readings by timestamp before calculating", () => {
    // Pass readings in reverse chronological order
    const readings = [
      makeReading(39.0, 5),   // most recent but passed first
      makeReading(37.0, 120), // oldest but passed last
    ];
    const result = calculateTrend(readings);
    expect(result.currentTemp).toBe(39.0);
  });

  it("trend is 'worsening' when temp rises more than 0.3°", () => {
    const readings = [
      makeReading(37.0, 60),
      makeReading(37.5, 10),
    ];
    expect(calculateTrend(readings).trend).toBe("worsening");
    expect(calculateTrend(readings).trendDirection).toBe("up");
  });

  it("trend is 'improving' when temp drops more than 0.3°", () => {
    const readings = [
      makeReading(39.0, 60),
      makeReading(38.5, 10),
    ];
    expect(calculateTrend(readings).trend).toBe("improving");
    expect(calculateTrend(readings).trendDirection).toBe("down");
  });

  it("trend is 'stable' when delta is within ±0.3°", () => {
    const readings = [
      makeReading(38.0, 60),
      makeReading(38.2, 10), // +0.2, below threshold
    ];
    expect(calculateTrend(readings).trend).toBe("stable");
    expect(calculateTrend(readings).trendDirection).toBe("flat");
  });

  it("calculates avgTempLast24h only from readings within 24 hours", () => {
    const readings = [
      makeReading(40.0, 25 * 60), // 25 hours ago — excluded
      makeReading(38.0, 60),       // 1 hour ago — included
      makeReading(39.0, 30),       // 30 min ago — included
    ];
    const result = calculateTrend(readings);
    expect(result.avgTempLast24h).toBeCloseTo((38.0 + 39.0) / 2, 5);
  });

  it("avgTempLast24h is 0 when all readings are older than 24 hours", () => {
    const readings = [
      makeReading(38.5, 25 * 60),
      makeReading(39.0, 26 * 60),
    ];
    expect(calculateTrend(readings).avgTempLast24h).toBe(0);
  });

  it("maps readings output correctly", () => {
    const r = makeReading(38.5, 10);
    const result = calculateTrend([r]);
    expect(result.readings[0]).toEqual({
      timestamp: r.timestamp,
      temperature: 38.5,
      unit: "C",
    });
  });

  it("accepts a custom TrendStrategy", () => {
    // A strategy that always returns "improving"
    const alwaysImproving: TrendStrategy = {
      evaluate: () => ({ trend: "improving", trendDirection: "down" }),
    };
    const readings = [makeReading(37.0, 60), makeReading(39.0, 10)];
    const result = calculateTrend(readings, alwaysImproving);
    expect(result.trend).toBe("improving");
    expect(result.trendDirection).toBe("down");
  });
});

// ─── FirstLastDeltaStrategy ───────────────────────────────────────────────────

describe("FirstLastDeltaStrategy", () => {
  const strategy = new FirstLastDeltaStrategy();

  it("returns 'worsening'/up when last > first by more than threshold", () => {
    const sorted = [makeReading(37.0, 60), makeReading(37.4, 10)];
    const { trend, trendDirection } = strategy.evaluate(sorted);
    expect(trend).toBe("worsening");
    expect(trendDirection).toBe("up");
  });

  it("returns 'improving'/down when last < first by more than threshold", () => {
    const sorted = [makeReading(39.0, 60), makeReading(38.6, 10)];
    const { trend, trendDirection } = strategy.evaluate(sorted);
    expect(trend).toBe("improving");
    expect(trendDirection).toBe("down");
  });

  it("returns 'stable'/flat when delta is exactly at threshold boundary", () => {
    const sorted = [makeReading(38.0, 60), makeReading(38.3, 10)]; // +0.3, not > 0.3
    const { trend, trendDirection } = strategy.evaluate(sorted);
    expect(trend).toBe("stable");
    expect(trendDirection).toBe("flat");
  });

  it("respects a custom threshold passed to constructor", () => {
    const strictStrategy = new FirstLastDeltaStrategy(0.1);
    const sorted = [makeReading(38.0, 60), makeReading(38.2, 10)]; // +0.2 > 0.1
    expect(strictStrategy.evaluate(sorted).trend).toBe("worsening");
  });
});

// ─── checkOverdoseRisk ────────────────────────────────────────────────────────

describe("checkOverdoseRisk", () => {
  it("returns 'safe' when well below 75%", () => {
    expect(checkOverdoseRisk(1, 4)).toBe("safe"); // 25%
  });

  it("returns 'warning' at exactly 75%", () => {
    expect(checkOverdoseRisk(3, 4)).toBe("warning"); // 75%
  });

  it("returns 'warning' between 75% and 99%", () => {
    expect(checkOverdoseRisk(3, 4)).toBe("warning");  // 75%
    expect(checkOverdoseRisk(80, 100)).toBe("warning"); // 80%
    expect(checkOverdoseRisk(99, 100)).toBe("warning"); // 99%
  });

  it("returns 'dangerous' at exactly 100%", () => {
    expect(checkOverdoseRisk(4, 4)).toBe("dangerous"); // 100%
  });

  it("returns 'dangerous' when over the max", () => {
    expect(checkOverdoseRisk(5, 4)).toBe("dangerous"); // 125%
  });

  it("returns 'safe' at 74%", () => {
    // 74/100 = 74%
    expect(checkOverdoseRisk(74, 100)).toBe("safe");
  });
});

// ─── formatDateTime ───────────────────────────────────────────────────────────

describe("formatDateTime", () => {
  it("returns a non-empty string for a valid ISO date", () => {
    const result = formatDateTime("2025-01-16T10:57:00.000Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes the month abbreviation", () => {
    // Jan 16 in any locale en-US format should include "Jan"
    const result = formatDateTime("2025-01-16T10:57:00.000Z");
    expect(result).toMatch(/Jan/);
  });

  it("includes the day number", () => {
    const result = formatDateTime("2025-01-16T10:57:00.000Z");
    expect(result).toMatch(/16/);
  });
});
