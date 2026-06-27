"use client";

import { useState } from "react";
import { Child } from "@/lib/types";
import { toDateInput } from "@/lib/utils";
import Modal from "./Modal";

interface Props {
  record: Child;
  onSave: (data: {
    name: string;
    dateOfBirth: string;
    weight?: number | null;
  }) => Promise<void>;
  onClose: () => void;
}

const inputClass =
  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";
const labelClass = "block text-xs font-semibold text-slate-500 mb-1";

export default function EditRecordForm({ record, onSave, onClose }: Props) {
  const [name, setName] = useState(record.name);
  const [dob, setDob] = useState(
    record.dateOfBirth ? toDateInput(record.dateOfBirth) : ""
  );
  const [weight, setWeight] = useState(
    record.weight != null ? String(record.weight) : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !dob) {
      setError("Please fill in name and date of birth");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        dateOfBirth: dob,
        weight: weight ? parseFloat(weight) : null,
      });
      onClose();
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Edit Record" onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
        {error && (
          <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className={labelClass}>
            Record Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>
            Date of Birth <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Weight (kg) — optional</label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g., 18"
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
