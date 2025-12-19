// ============================================
// FILE: app/components/ChildSelector.tsx
// Simple dropdown to select which child to track
// ============================================

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
    <div className="mb-4">
      <label className="block text-sm font-semibold mb-2">Select Child:</label>
      <select
        value={selectedChildId}
        onChange={(e) => onSelectChild(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {children.map((child) => (
          <option key={child._id} value={child._id}>
            {child.name}
          </option>
        ))}
      </select>
    </div>
  );
}
