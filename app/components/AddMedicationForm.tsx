"use client";

import { useState } from "react";
import { MedicationDefinition } from "@/lib/types";
import { toDateInput } from "@/lib/utils";
import { updateMedication } from "@/lib/services/feverApi";
import Modal from "./Modal";

interface AddMedicationFormProps {
  childId: string;
  /** When provided, the form edits this medication instead of creating one. */
  medication?: MedicationDefinition;
  onMedicationAdded: (medication: MedicationDefinition) => void;
  onClose: () => void;
}

export default function AddMedicationForm({
  childId,
  medication,
  onMedicationAdded,
  onClose,
}: AddMedicationFormProps) {
  const isEditing = !!medication;
  const [name, setName] = useState(medication?.name ?? "");
  const [dosage, setDosage] = useState(
    medication ? String(medication.dosage) : ""
  );
  const [dosageUnit, setDosageUnit] = useState<"pills" | "ml">(
    medication?.dosageUnit ?? "ml"
  );
  const [frequency, setFrequency] = useState(
    medication ? String(medication.frequency) : "6"
  );
  const [maxDosesPerDay, setMaxDosesPerDay] = useState(
    medication ? String(medication.maxDosesPerDay) : "4"
  );
  const [startDate, setStartDate] = useState(
    medication?.startDate
      ? toDateInput(medication.startDate)
      : new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    medication?.endDate ? toDateInput(medication.endDate) : ""
  );
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

    const payload = {
      name,
      dosage: parseFloat(dosage),
      dosageUnit,
      frequency: parseInt(frequency),
      maxDosesPerDay: parseInt(maxDosesPerDay),
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
    };

    try {
      let saved: MedicationDefinition;
      if (isEditing) {
        saved = await updateMedication(medication._id!, payload);
      } else {
        const res = await fetch("/api/medications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ childId, ...payload, isActive: true }),
        });
        if (!res.ok) throw new Error("Failed to add medication");
        saved = await res.json();
      }

      onMedicationAdded(saved);
      onClose();
    } catch (err) {
      setError(
        isEditing
          ? "Failed to save changes. Please try again."
          : "Failed to add medication. Please try again."
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const labelClass = "block text-xs font-semibold text-slate-500 mb-1";

  return (
    <Modal
      title={isEditing ? "Edit Medication" : "Add Medication"}
      onClose={onClose}
    >
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
            {isSubmitting
              ? isEditing
                ? "Saving..."
                : "Adding..."
              : isEditing
                ? "Save Changes"
                : "Add Medication"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
