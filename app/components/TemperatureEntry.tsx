// ============================================
// FILE: app/components/TemperatureEntry.tsx
// Form to log a temperature reading
// ============================================

'use client';

import { useState } from 'react';
import { TemperatureReading } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface TemperatureEntryProps {
  childId: string;
  onAddTemperature: (reading: TemperatureReading) => void;
}

export default function TemperatureEntry({ childId, onAddTemperature }: TemperatureEntryProps) {
  const [temperature, setTemperature] = useState('');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!temperature) {
      alert('Please enter a temperature');
      return;
    }

    const temp = parseFloat(temperature);
    if (isNaN(temp) || temp < 35 || temp > 43) {
      alert('Please enter a valid temperature (35-43°C or 95-107°F)');
      return;
    }

    setIsSubmitting(true);

    const newReading: Omit<TemperatureReading, '_id'> = {
      childId,
      temperature: temp,
      temperatureUnit: unit,
      timestamp: new Date().toISOString(),
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    onAddTemperature(newReading);

    // Reset form
    setTemperature('');
    setNotes('');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-bold mb-3">Log Temperature</h3>

      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-semibold mb-1">Temperature:</label>
          <input
            type="number"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder="e.g., 38.5"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-20">
          <label className="block text-sm font-semibold mb-1">Unit:</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as 'C' | 'F')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="C">°C</option>
            <option value="F">°F</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Notes (optional):</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., after bath, child sleeping"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isSubmitting ? 'Logging...' : 'Log Temperature'}
      </button>
    </form>
  );
}