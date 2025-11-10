// ============================================
// FILE: lib/models/Child.ts
// ============================================

import mongoose, { Schema, Document } from 'mongoose';

export interface IChild extends Document {
  name: string;
  dateOfBirth: Date;
  weight?: number;
  createdAt: Date;
}

const ChildSchema = new Schema<IChild>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Please provide date of birth'],
    },
    weight: {
      type: Number,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Child || mongoose.model<IChild>('Child', ChildSchema);