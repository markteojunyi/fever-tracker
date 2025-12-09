// ============================================
// FILE: app/components/AddMedicationForm.tsx
// Form to add a new medication
// ============================================

'use client';

import { useState } from 'react';
import { MedicationDefinition } from '@/lib/types';

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
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [dosageUnit, setDosageUnit] = useState<'pills/tablets' | 'ml'>('ml');
  const [frequency, setFrequency] = useState('6');
  const [maxDosesPerDay, setMaxDosesPerDay] = useState('4');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !dosage || !frequency || !maxDosesPerDay) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (!res.ok) throw new Error('Failed to add medication');

      const newMedication = await res.json();
      onMedicationAdded(newMedication);
      alert('✅ Medication added successfully!');
      onClose();
    } catch (err) {
      alert('❌ Error adding medication');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-black">Add Medication</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-black">
              Medication Name: <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Paracetamol, Ibuprofen"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2 text-black">
                Dosage: <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g., 250"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-semibold mb-2 text-black">Unit:</label>
              <select
                value={dosageUnit}
                onChange={(e) => setDosageUnit(e.target.value as 'pills/tablets' | 'ml')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pills/tablets"></option>
                <option value="ml">ml</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2 text-black">
                Frequency (hours): <span className="text-red-600">*</span>
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="4">Every 4 hours</option>
                <option value="6">Every 6 hours</option>
                <option value="8">Every 8 hours</option>
                <option value="12">Every 12 hours</option>
                <option value="24">Every 24 hours</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2 text-black">
                Max Doses/Day: <span className="text-red-600">*</span>
              </label>
              <select
                value={maxDosesPerDay}
                onChange={(e) => setMaxDosesPerDay(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2 text-black">
                Start Date: <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2 text-black">End Date (optional):</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Adding...' : 'Add Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}