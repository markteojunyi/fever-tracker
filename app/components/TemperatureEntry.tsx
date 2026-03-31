"use client";

import { useState } from "react";
import { TemperatureReading } from "@/lib/types";

interface TemperatureEntryProps {
  childId: string;
  onAddTemperature: (reading: TemperatureReading) => void;
}

export default function TemperatureEntry({
  childId,
  onAddTemperature,
}: TemperatureEntryProps) {
  const [temperature, setTemperature] = useState("");
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!temperature) {
      setError("Please enter a temperature");
      return;
    }

    const temp = parseFloat(temperature);
    if (isNaN(temp) || temp < 35 || temp > 43) {
      setError("Please enter a valid temperature (35–43°C or 95–107°F)");
      return;
    }

    setIsSubmitting(true);

    const newReading: Omit<TemperatureReading, "_id"> = {
      childId,
      temperature: temp,
      temperatureUnit: unit,
      timestamp: new Date().toISOString(),
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddTemperature(newReading);
    setTemperature("");
    setNotes("");
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4"
    >
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        Log Temperature
      </h3>

      {error && (
        <div className="mb-3 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Temperature
          </label>
          <input
            type="number"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder="e.g., 38.5"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="w-20">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Unit
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as "C" | "F")}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="C">°C</option>
            <option value="F">°F</option>
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          Notes (optional)
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., after bath, child sleeping"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm disabled:opacity-50 transition-colors"
        style={{ color: "#ffffff" }}
      >
        {isSubmitting ? "Logging..." : "Log Temperature"}
      </button>
    </form>
  );
}
