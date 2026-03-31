"use client";

import { useLayoutEffect, useState } from "react";
import { MedicationLog, MedicationDefinition } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface MedicationHistoryProps {
  logs: MedicationLog[];
  medications: MedicationDefinition[];
  onDeleteLog: (logId: string) => void;
}

export default function MedicationHistory({
  logs,
  medications,
  onDeleteLog,
}: MedicationHistoryProps) {
  const [isClient, setIsClient] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    setIsClient(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-4 text-center text-slate-400 text-sm">
        No medication logs yet
      </div>
    );
  }

  const sortedLogs = [...logs].sort(
    (a, b) =>
      new Date(b.administeredAt).getTime() - new Date(a.administeredAt).getTime()
  );

  const handleDeleteClick = (logId: string) => {
    setConfirmingId(logId);
  };

  const handleConfirmDelete = (logId: string) => {
    setDeletingId(logId);
    setConfirmingId(null);
    onDeleteLog(logId);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">
        Recent Medication Doses
      </h3>
      <div className="space-y-2">
        {sortedLogs.map((log) => {
          const med = medications.find(
            (m) => m._id === log.medicationDefinitionId
          );
          const isDeleting = deletingId === log._id;
          const isConfirming = confirmingId === log._id;

          return (
            <div
              key={log._id}
              className="flex justify-between items-center p-3 rounded-lg border-l-4 border-indigo-300 bg-slate-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  {med?.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isClient ? formatDateTime(log.administeredAt) : "—"}
                </p>
                <p className="text-xs text-slate-400">by {log.administeredBy}</p>
              </div>
              <div className="flex items-center gap-3 ml-2">
                <span className="text-sm font-bold text-slate-700">
                  {log.dosageAdministered} {log.dosageUnit}
                </span>
                {isConfirming ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleConfirmDelete(log._id!)}
                      className="px-2 py-1 bg-rose-600 text-white text-xs rounded-lg font-semibold"
                      style={{ color: "#ffffff" }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDeleteClick(log._id!)}
                    disabled={isDeleting}
                    className="text-slate-300 hover:text-rose-500 transition-colors text-lg disabled:opacity-40"
                    title="Delete"
                  >
                    {isDeleting ? "…" : "🗑"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
