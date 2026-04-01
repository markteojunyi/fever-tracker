"use client";

import React, { useState, useEffect, useRef } from "react";
import { MedicationDefinition, MedicationLog } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { checkOverdoseRisk } from "@/lib/utils";

interface MedicationEntryProps {
  childId: string;
  medications: MedicationDefinition[];
  logsToday: MedicationLog[];
  onAddLog: (log: MedicationLog) => void;
}

export default function MedicationEntry({
  childId,
  medications,
  logsToday,
  onAddLog,
}: MedicationEntryProps) {
  const [selectedMedId, setSelectedMedId] = useState("");
  const [dosage, setDosage] = useState("");
  const [administeredBy, setAdministeredBy] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current && medications.length > 0 && medications[0]._id) {
      setSelectedMedId(medications[0]._id);
      hasInitialized.current = true;
      return;
    }
    if (medications.length > 0 && selectedMedId) {
      const exists = medications.find((m) => m._id === selectedMedId);
      if (!exists && medications[0]._id) setSelectedMedId(medications[0]._id);
    }
  }, [medications, selectedMedId]);

  if (medications.length === 0) return null;

  const selectedMed = medications.find((m) => m._id === selectedMedId);
  if (!selectedMed) return null;

  const logsForMedToday = logsToday.filter(
    (l) => l.medicationDefinitionId === selectedMedId
  );
  const overdoseRisk = checkOverdoseRisk(
    logsForMedToday.length,
    selectedMed.maxDosesPerDay
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!dosage || !administeredBy) {
      setError("Please fill in all fields");
      return;
    }

    if (overdoseRisk === "dangerous") return;

    setIsSubmitting(true);

    const newLog: MedicationLog = {
      id: uuidv4(),
      medicationDefinitionId: selectedMedId,
      childId,
      administeredAt: new Date().toISOString(),
      dosageAdministered: parseFloat(dosage),
      dosageUnit: selectedMed.dosageUnit,
      administeredBy,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddLog(newLog);
    setDosage("");
    setAdministeredBy("");
    setNotes("");
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4"
    >
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        Log Medication
      </h3>

      {error && (
        <div className="mb-3 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div className="mb-3">
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          Medication
        </label>
        <select
          value={selectedMedId}
          onChange={(e) => setSelectedMedId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {medications.map((med) => (
            <option key={med._id} value={med._id}>
              {med.name} ({med.dosage} {med.dosageUnit})
            </option>
          ))}
        </select>
      </div>

      <div
        className={`mb-3 p-3 rounded-lg border text-sm ${
          overdoseRisk === "dangerous"
            ? "bg-rose-50 border-rose-200"
            : overdoseRisk === "warning"
              ? "bg-amber-50 border-amber-200"
              : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="flex justify-between text-slate-600">
          <span>Every {selectedMed.frequency}h</span>
          <span>Max {selectedMed.maxDosesPerDay}/day</span>
          <span>
            Given today:{" "}
            <strong>
              {logsForMedToday.length}/{selectedMed.maxDosesPerDay}
            </strong>
            {overdoseRisk === "dangerous" && (
              <span className="ml-1 text-rose-600 font-bold">— MAX REACHED</span>
            )}
            {overdoseRisk === "warning" && (
              <span className="ml-1 text-amber-600 font-bold">— Near limit</span>
            )}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Dosage ({selectedMed.dosageUnit})
          </label>
          <input
            type="number"
            step="0.1"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder={`e.g., ${selectedMed.dosage}`}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Given by
          </label>
          <input
            type="text"
            value={administeredBy}
            onChange={(e) => setAdministeredBy(e.target.value)}
            placeholder="e.g., Mom, Dad"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
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
          placeholder="e.g., given with food, child was sleeping"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || overdoseRisk === "dangerous"}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg text-sm disabled:opacity-50 transition-colors"
        style={{ color: "#ffffff" }}
      >
        {isSubmitting ? "Logging..." : "Log Medication"}
      </button>
    </form>
  );
}
