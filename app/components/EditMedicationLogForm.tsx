"use client";

import { useState } from "react";
import { MedicationLog } from "@/lib/types";
import { toDateTimeLocal, fromDateTimeLocal } from "@/lib/utils";
import Modal from "./Modal";

interface Props {
  log: MedicationLog;
  medicationName: string;
  onSave: (data: {
    administeredAt: string;
    dosageAdministered: number;
    dosageUnit: "pills" | "ml";
    administeredBy: string;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
}

const inputClass =
  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";
const labelClass = "block text-xs font-semibold text-slate-500 mb-1";

export default function EditMedicationLogForm({
  log,
  medicationName,
  onSave,
  onClose,
}: Props) {
  const [when, setWhen] = useState(toDateTimeLocal(log.administeredAt));
  const [dosage, setDosage] = useState(String(log.dosageAdministered));
  const [dosageUnit, setDosageUnit] = useState<"pills" | "ml">(log.dosageUnit);
  const [administeredBy, setAdministeredBy] = useState(log.administeredBy);
  const [notes, setNotes] = useState(log.notes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!dosage || !administeredBy.trim() || !when) {
      setError("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        administeredAt: fromDateTimeLocal(when),
        dosageAdministered: parseFloat(dosage),
        dosageUnit,
        administeredBy: administeredBy.trim(),
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
    <Modal title="Edit Medication Dose" onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
        {error && (
          <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className={labelClass}>Medication</label>
          <p className="text-sm font-semibold text-slate-700 px-3 py-2 bg-slate-50 rounded-lg">
            {medicationName}
          </p>
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

        <div>
          <label className={labelClass}>
            Given by <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={administeredBy}
            onChange={(e) => setAdministeredBy(e.target.value)}
            placeholder="e.g., Mom, Dad"
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
            placeholder="e.g., given with food"
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
