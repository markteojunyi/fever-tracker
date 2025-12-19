// ============================================
// FILE: lib/models/MedicationLog.ts
// ============================================

import mongoose, { Schema, Document } from "mongoose";

export interface IMedicationLog extends Document {
  medicationDefinitionId: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  administeredAt: Date;
  dosageAdministered: number;
  dosageUnit: "pills" | "ml";
  administeredBy: string;
  createdAt: Date;
}

const MedicationLogSchema = new Schema<IMedicationLog>(
  {
    medicationDefinitionId: {
      type: Schema.Types.ObjectId,
      ref: "MedicationDefinition",
      required: [true, "Please provide medicationDefinitionId"],
    },
    childId: {
      type: Schema.Types.ObjectId,
      ref: "Child",
      required: [true, "Please provide childId"],
    },
    administeredAt: {
      type: Date,
      required: [true, "Please provide administration time"],
    },
    dosageAdministered: {
      type: Number,
      required: [true, "Please provide dosage"],
    },
    dosageUnit: {
      type: String,
      enum: ["pills", "ml"],
      required: true,
    },
    administeredBy: {
      type: String,
      required: [true, "Please provide who administered"],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

MedicationLogSchema.index({ childId: 1 });
MedicationLogSchema.index({ medicationDefinitionId: 1 });
MedicationLogSchema.index({ administeredAt: 1 });
MedicationLogSchema.index({ childId: 1, administeredAt: 1 });

export default mongoose.models.MedicationLog ||
  mongoose.model<IMedicationLog>("MedicationLog", MedicationLogSchema);
