"use client";

import { Child } from "@/lib/types";

interface ChildSelectorProps {
  children: Child[];
  selectedChildId: string;
  onSelectChild: (childId: string) => void;
}

export default function ChildSelector({
  children,
  selectedChildId,
  onSelectChild,
}: ChildSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {children.map((child) => (
        <button
          key={child._id}
          onClick={() => onSelectChild(child._id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            child._id === selectedChildId
              ? "bg-indigo-600 text-white"
              : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
          }`}
        >
          {child.name}
        </button>
      ))}
    </div>
  );
}
