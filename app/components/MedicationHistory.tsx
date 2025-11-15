// ============================================
// FILE: app/components/MedicationHistory.tsx
// Shows recent medication doses
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { MedicationLog, MedicationDefinition } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

interface MedicationHistoryProps {
  logs: MedicationLog[];
  medications: MedicationDefinition[];
  onDeleteLog: (logId: string) => void;
}

export default function MedicationHistory({ logs, medications, onDeleteLog }: MedicationHistoryProps) {
  const [isClient, setIsClient] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (logs.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow mb-4 text-center text-gray-500">
        No medication logs yet
      </div>
    );
  }

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.administeredAt).getTime() - new Date(a.administeredAt).getTime()
  );

  const handleDelete = async (logId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this medication log?');
    if (!confirmed) return;

    setDeletingId(logId);
    onDeleteLog(logId);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-bold mb-3">Recent Medication Doses</h3>
      <div className="space-y-2">
        {sortedLogs.map((log) => {
          const med = medications.find((m) => m._id === log.medicationDefinitionId);
          const isDeleting = deletingId === log._id;
          
          return (
            <div key={log._id} className="flex justify-between items-center p-2 bg-gray-200 rounded">
              <div className="flex-1">
                <p className="font-semibold">{med?.name}</p>
                <p className="text-sm text-gray-800">
                  {isClient ? formatDateTime(log.administeredAt) : '---'}
                </p>
                <p className="text-xs text-gray-700">Given by: {log.administeredBy}</p>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-bold">
                    {log.dosageAdministered} {log.dosageUnit}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(log._id!)}
                  disabled={isDeleting}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:bg-gray-400 text-sm font-semibold"
                >
                  {isDeleting ? '...' : '🗑️'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}