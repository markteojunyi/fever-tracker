"use client";

import { useState } from "react";
import { Observation } from "@/lib/types";
import { toDateTimeLocal, fromDateTimeLocal } from "@/lib/utils";
import Modal from "./Modal";

interface Props {
  observation: Observation;
  onSave: (data: { content: string; observedAt: string }) => Promise<void>;
  onClose: () => void;
}

const inputClass =
  "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";
const labelClass = "block text-xs font-semibold text-slate-500 mb-1";

export default function EditObservationForm({
  observation,
  onSave,
  onClose,
}: Props) {
  const [content, setContent] = useState(observation.content);
  const [when, setWhen] = useState(toDateTimeLocal(observation.observedAt));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!content.trim() || !when) {
      setError("Please fill in the observation and time");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        content: content.trim(),
        observedAt: fromDateTimeLocal(when),
      });
      onClose();
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Edit Observation" onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
        {error && (
          <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className={labelClass}>
            Observation <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
            required
          />
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
