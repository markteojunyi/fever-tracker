"use client";

import { useState } from "react";
import { MedicationDefinition } from "@/lib/types";

interface AddMedicationFormProps {
  childId: string;
  onMedicationAdded: (medication: MedicationDefinition) => void;
  onClose: () => void;
}

export default function AddMedicationForm({
  childId,
  onMedicationAdded,
  onClose,
}: AddMedicationFormProps) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [dosageUnit, setDosageUnit] = useState<"pills" | "ml">("ml");
  const [frequency, setFrequency] = useState("6");
  const [maxDosesPerDay, setMaxDosesPerDay] = useState("4");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !dosage || !frequency || !maxDosesPerDay) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          name,
          dosage: parseFloat(dosage),
          dosageUnit,
          frequency: parseInt(frequency),
          maxDosesPerDay: parseInt(maxDosesPerDay),
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : undefined,
          isActive: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to add medication");

      const newMedication = await res.json();
      onMedicationAdded(newMedication);
      onClose();
    } catch (err) {
      setError("Failed to add medication. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const labelClass = "block text-xs font-semibold text-slate-500 mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center px-6 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Add Medication</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>
              Medication Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Paracetamol, Ibuprofen"
              className={inputClass}
              required
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className={labelClass}>
                Dosage <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g., 250"
                className={inputClass}
                required
              />
            </div>
            <div className="w-24">
              <label className={labelClass}>Unit</label>
              <select
                value={dosageUnit}
                onChange={(e) => setDosageUnit(e.target.value as "pills" | "ml")}
                className={inputClass}
              >
                <option value="pills">pills</option>
                <option value="ml">ml</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className={labelClass}>
                Frequency <span className="text-rose-500">*</span>
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className={inputClass}
              >
                <option value="4">Every 4 hours</option>
                <option value="6">Every 6 hours</option>
                <option value="8">Every 8 hours</option>
                <option value="12">Every 12 hours</option>
                <option value="24">Every 24 hours</option>
              </select>
            </div>
            <div className="flex-1">
              <label className={labelClass}>
                Max/Day <span className="text-rose-500">*</span>
              </label>
              <select
                value={maxDosesPerDay}
                onChange={(e) => setMaxDosesPerDay(e.target.value)}
                className={inputClass}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className={labelClass}>
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div className="flex-1">
              <label className={labelClass}>End Date (optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
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
              {isSubmitting ? "Adding..." : "Add Medication"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
