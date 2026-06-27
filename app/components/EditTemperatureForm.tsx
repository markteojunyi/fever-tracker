"use client";

import { useState } from "react";
import { TemperatureReading } from "@/lib/types";
import { toDateTimeLocal, fromDateTimeLocal } from "@/lib/utils";
import Modal from "./Modal";

interface Props {
  reading: TemperatureReading;
  onSave: (data: {
    temperature: number;
    temperatureUnit: "C" | "F";
    timestamp: string;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
}

const inputClass =
  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";
const labelClass = "block text-xs font-semibold text-slate-500 mb-1";

export default function EditTemperatureForm({
  reading,
  onSave,
  onClose,
}: Props) {
  const [temperature, setTemperature] = useState(String(reading.temperature));
  const [unit, setUnit] = useState<"C" | "F">(reading.temperatureUnit);
  const [when, setWhen] = useState(toDateTimeLocal(reading.timestamp));
  const [notes, setNotes] = useState(reading.notes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const temp = parseFloat(temperature);
    if (isNaN(temp) || temp < 35 || temp > 43) {
      setError("Please enter a valid temperature (35–43°C or 95–107°F)");
      return;
    }
    if (!when) {
      setError("Please enter a date and time");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        temperature: temp,
        temperatureUnit: unit,
        timestamp: fromDateTimeLocal(when),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Edit Temperature Reading" onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
        {error && (
          <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <label className={labelClass}>
              Temperature <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div className="w-20">
            <label className={labelClass}>Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as "C" | "F")}
              className={inputClass}
            >
              <option value="C">°C</option>
              <option value="F">°F</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Date &amp; Time <span className="text-rose-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., after bath, child sleeping"
            className={inputClass}
          />
        </div>

        <div className="flex gap-2 pt-2 pb-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm disabled:opacity-50 transition-colors"
            style={{ color: "#ffffff" }}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
