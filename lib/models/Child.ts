// ============================================
// FILE: lib/models/Child.ts
// ============================================

import mongoose, { Schema, Document } from "mongoose";

export interface IChild extends Document {
  userId: string;
  name: string;
  dateOfBirth: Date;
  weight?: number;
  createdAt: Date;
}

const ChildSchema = new Schema<IChild>(
  {
    userId: {
      type: String,
      required: [true, "Please provide userId"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Please provide date of birth"],
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

ChildSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Child ||
  mongoose.model<IChild>("Child", ChildSchema);
