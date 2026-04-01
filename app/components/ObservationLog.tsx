"use client";

import { useState } from "react";
import { Observation } from "@/lib/types";

interface Props {
  observations: Observation[];
  onAdd: (content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ObservationLog({ observations, onAdd, onDelete }: Props) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onAdd(content.trim());
      setContent("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Entry form */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="e.g., Child looks drowsy, cough getting worse, had a small meal…"
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          <button
            type="submit"
            disabled={saving || !content.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm disabled:opacity-50 transition-colors"
            style={{ color: "#ffffff" }}
          >
            {saving ? "Saving…" : "Log Observation"}
          </button>
        </form>
      </div>

      {/* History */}
      {observations.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          <p className="text-2xl mb-1">📝</p>
          <p>No observations yet. Note anything that seems relevant.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {observations.map((obs) => (
            <div
              key={obs._id}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 border-l-4 border-l-violet-300"
            >
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm text-slate-700 leading-relaxed flex-1">{obs.content}</p>

                {confirmingDelete === obs._id ? (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={async () => {
                        await onDelete(obs._id!);
                        setConfirmingDelete(null);
                      }}
                      className="text-xs px-2 py-1 bg-rose-500 text-white rounded-lg font-semibold"
                      style={{ color: "#ffffff" }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmingDelete(null)}
                      className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingDelete(obs._id!)}
                    className="text-slate-300 hover:text-rose-400 transition-colors shrink-0 mt-0.5"
                    title="Delete observation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{formatTime(obs.observedAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
