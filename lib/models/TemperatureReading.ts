// ============================================
// FILE: lib/models/TemperatureReading.ts
// ============================================

import mongoose, { Schema, Document } from 'mongoose';

export interface ITemperatureReading extends Document {
  childId: mongoose.Types.ObjectId;
  temperature: number;
  temperatureUnit: 'C' | 'F';
  timestamp: Date;
  notes?: string;
  createdAt: Date;
}

const TemperatureReadingSchema = new Schema<ITemperatureReading>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: [true, 'Please provide childId'],
    },
    temperature: {
      type: Number,
      required: [true, 'Please provide temperature'],
      min: [35, 'Temperature too low'],
      max: [43, 'Temperature too high'],
    },
    temperatureUnit: {
      type: String,
      enum: ['C', 'F'],
      required: true,
    },
    timestamp: {
      type: Date,
      required: [true, 'Please provide timestamp'],
    },
    notes: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

TemperatureReadingSchema.index({ childId: 1 });
TemperatureReadingSchema.index({ timestamp: 1 });
TemperatureReadingSchema.index({ childId: 1, timestamp: 1 });

export default mongoose.models.TemperatureReading ||
  mongoose.model<ITemperatureReading>('TemperatureReading', TemperatureReadingSchema);
