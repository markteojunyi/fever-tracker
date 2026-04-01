"use client";

import { Child } from "@/lib/types";
import { useState, useRef, useEffect } from "react";

interface ChildSelectorProps {
  children: Child[];
  selectedChildId: string;
  onSelectChild: (childId: string) => void;
  onDeleteRecord: (id: string) => void;
  onRenameRecord: (id: string, newName: string) => void;
}

export default function ChildSelector({
  children,
  selectedChildId,
  onSelectChild,
  onDeleteRecord,
  onRenameRecord,
}: ChildSelectorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const selected = children.find((c) => c._id === selectedChildId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
        setConfirmingDelete(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);

  const handleOpenMenu = () => {
    setPopoverOpen((prev) => !prev);
    setConfirmingDelete(false);
  };

  const handleRenameClick = () => {
    setRenameValue(selected?.name || "");
    setRenaming(true);
    setPopoverOpen(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameValue.trim() && selectedChildId) {
      onRenameRecord(selectedChildId, renameValue.trim());
    }
    setRenaming(false);
  };

  const handleConfirmDelete = () => {
    onDeleteRecord(selectedChildId);
    setPopoverOpen(false);
    setConfirmingDelete(false);
  };

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {children.map((child) => {
        const isSelected = child._id === selectedChildId;
        return (
          <div
            key={child._id}
            className="relative"
            ref={isSelected ? popoverRef : undefined}
          >
            {isSelected && renaming ? (
              <form
                onSubmit={handleRenameSubmit}
                className="flex items-center gap-1"
              >
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="px-3 py-1 text-sm border border-indigo-400 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 w-40"
                  onBlur={() => setRenaming(false)}
                />
                <button
                  type="submit"
                  className="text-xs text-indigo-600 font-semibold px-2"
                >
                  Save
                </button>
              </form>
            ) : (
              <div
                className={`flex items-center gap-1 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white pl-4 pr-2 py-1.5"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 px-4 py-1.5"
                }`}
              >
                <button
                  onClick={() => onSelectChild(child._id!)}
                  className="leading-none"
                  style={isSelected ? { color: "#ffffff" } : undefined}
                >
                  {child.name}
                </button>

                {isSelected && (
                  <button
                    onClick={handleOpenMenu}
                    className="ml-1 w-5 h-5 flex items-center justify-center rounded-full hover:bg-indigo-500 transition-colors text-white text-xs leading-none"
                    title="Options"
                  >
                    ⋯
                  </button>
                )}
              </div>
            )}

            {isSelected && popoverOpen && (
              <div className="absolute top-full left-0 mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-lg py-1 min-w-36">
                {confirmingDelete ? (
                  <div className="px-3 py-2">
                    <p className="text-xs text-slate-600 mb-2 font-medium">
                      Delete this record?
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={handleConfirmDelete}
                        className="flex-1 px-2 py-1 bg-rose-600 text-white text-xs rounded-lg font-semibold"
                        style={{ color: "#ffffff" }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(false)}
                        className="flex-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setConfirmingDelete(true)}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      Delete record
                    </button>
                    <button
                      onClick={handleRenameClick}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Rename
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
