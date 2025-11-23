// ============================================
// FILE: app/components/MedicationEntry.tsx
// Form to log medication dose
// ============================================

'use client';

import React from 'react';
import { MedicationDefinition, MedicationLog } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { checkOverdoseRisk } from '@/lib/utils';
import { useState, useEffect } from 'react';

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
  const [selectedMedId, setSelectedMedId] = useState('');

  // Add this useEffect to set the first medication when medications load
  useEffect(() => {
    if (medications.length > 0 && !selectedMedId && medications[0]._id) {
      setSelectedMedId(medications[0]._id);
    }
  }, [medications, selectedMedId]);

  const [dosage, setDosage] = useState('');
  const [administeredBy, setAdministeredBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* if (medications.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-4 text-center text-gray-500">
        No active medications. Add a medication first.
      </div>
    );
  } */

  if (medications.length === 0) {
    return null;
  }

  const selectedMed = medications.find((m) => m._id === selectedMedId);
  if (!selectedMed) return null;

  const logsForMedToday = logsToday.filter((l) => l.medicationDefinitionId === selectedMedId);
  const overdoseRisk = checkOverdoseRisk(logsForMedToday.length, selectedMed.maxDosesPerDay);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!dosage || !administeredBy) {
      alert('Please fill all fields');
      return;
    }

    if (overdoseRisk === 'dangerous') {
      alert(`⚠️ WARNING: Maximum doses (${selectedMed.maxDosesPerDay}) already given today!`);
      return;
    }

    if (overdoseRisk === 'warning') {
      const confirmed = window.confirm(
        `⚠️ Warning: You're close to max doses (${logsForMedToday.length}/${selectedMed.maxDosesPerDay}). Continue?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);

    const newLog: MedicationLog = {
      id: uuidv4(),
      medicationDefinitionId: selectedMedId,
      childId,
      administeredAt: new Date().toISOString(),
      dosageAdministered: parseFloat(dosage),
      dosageUnit: selectedMed.dosageUnit,
      administeredBy,
      createdAt: new Date().toISOString(),
    };

    onAddLog(newLog);

    // Reset form
    setDosage('');
    setAdministeredBy('');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-bold mb-3">Log Medication</h3>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Medication:</label>
        <select
          value={selectedMedId}
          onChange={(e) => setSelectedMedId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {medications.map((med) => (
            <option key={med._id} value={med._id}>
              {med.name} ({med.dosage} {med.dosageUnit})
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200 text-sm">
        <p>
          <strong>Frequency:</strong> Every {selectedMed.frequency} hours
        </p>
        <p>
          <strong>Max per day:</strong> {selectedMed.maxDosesPerDay} doses
        </p>
        <p>
          <strong>Given today:</strong> {logsForMedToday.length}/{selectedMed.maxDosesPerDay}{' '}
          {overdoseRisk === 'dangerous' && <span className="text-red-600 font-bold">❌ MAX REACHED</span>}
          {overdoseRisk === 'warning' && <span className="text-orange-600 font-bold">⚠️ WARNING</span>}
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Dosage ({selectedMed.dosageUnit}):</label>
        <input
          type="number"
          step="0.1"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder={`e.g., ${selectedMed.dosage}`}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Notes:</label>
        <input
          type="text"
          value={administeredBy}
          onChange={(e) => setAdministeredBy(e.target.value)}
          placeholder="e.g., Given by Mom/Dad/NaiNai or any other notes"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || overdoseRisk === 'dangerous'}
        className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
      >
        {isSubmitting ? 'Logging...' : 'Log Medication'}
      </button>
    </form>
  );
}
