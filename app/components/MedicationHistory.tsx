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
}

export default function MedicationHistory({ logs, medications }: MedicationHistoryProps) {
    const [isClient, setIsClient] = useState(false);
    
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

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-bold mb-3">Recent Medication Doses</h3>
      <div className="space-y-2">
        {sortedLogs.map((log) => {
          const med = medications.find((m) => m.id === log.medicationDefinitionId);
          return (
            <div key={log.id} className="flex justify-between items-center p-2 bg-gray-200 rounded">
              <div>
                <p className="font-semibold">{med?.name}</p>
                <p className="text-sm text-gray-800">
                {isClient ? formatDateTime(log.administeredAt) : '---'}
                </p>
                <p className="text-xs text-gray-700">Given by: {log.administeredBy}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">
                  {log.dosageAdministered} {log.dosageUnit}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
