// ============================================
// FILE: lib/models/MedicationDefinition.ts
// ============================================

import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicationDefinition extends Document {
  childId: mongoose.Types.ObjectId;
  name: string;
  dosage: number;
  dosageUnit: 'mg' | 'ml';
  frequency: number;
  maxDosesPerDay: number;
  maxTotalDailyDosage?: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
}

const MedicationDefinitionSchema = new Schema<IMedicationDefinition>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: [true, 'Please provide childId'],
    },
    name: {
      type: String,
      required: [true, 'Please provide medication name'],
      trim: true,
    },
    dosage: {
      type: Number,
      required: [true, 'Please provide dosage'],
    },
    dosageUnit: {
      type: String,
      enum: ['mg', 'ml'],
      required: true,
    },
    frequency: {
      type: Number,
      required: [true, 'Please provide frequency in hours'],
    },
    maxDosesPerDay: {
      type: Number,
      required: [true, 'Please provide max doses per day'],
    },
    maxTotalDailyDosage: {
      type: Number,
      default: null,
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide start date'],
    },
    endDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

MedicationDefinitionSchema.index({ childId: 1 });
MedicationDefinitionSchema.index({ isActive: 1 });
MedicationDefinitionSchema.index({ childId: 1, isActive: 1 });

export default mongoose.models.MedicationDefinition ||
  mongoose.model<IMedicationDefinition>('MedicationDefinition', MedicationDefinitionSchema);