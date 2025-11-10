// ============================================
// FILE: lib/models/MedicationReminder.ts
// ============================================

import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicationReminder extends Document {
  medicationDefinitionId: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  scheduledTime: Date;
  isCompleted: boolean;
  completedAt?: Date;
  reminderSentAt?: Date;
  createdAt: Date;
}

const MedicationReminderSchema = new Schema<IMedicationReminder>(
  {
    medicationDefinitionId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicationDefinition',
      required: [true, 'Please provide medicationDefinitionId'],
    },
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: [true, 'Please provide childId'],
    },
    scheduledTime: {
      type: Date,
      required: [true, 'Please provide scheduled time'],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

MedicationReminderSchema.index({ childId: 1 });
MedicationReminderSchema.index({ medicationDefinitionId: 1 });
MedicationReminderSchema.index({ scheduledTime: 1 });
MedicationReminderSchema.index({ isCompleted: 1 });
MedicationReminderSchema.index({ childId: 1, isCompleted: 1 });

export default mongoose.models.MedicationReminder ||
  mongoose.model<IMedicationReminder>('MedicationReminder', MedicationReminderSchema);