import mongoose, { Schema, Document } from "mongoose";

export interface IObservation extends Document {
  childId: mongoose.Types.ObjectId;
  content: string;
  observedAt: Date;
  createdAt: Date;
}

const ObservationSchema = new Schema<IObservation>(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: "Child",
      required: [true, "Please provide childId"],
    },
    content: {
      type: String,
      required: [true, "Please provide observation content"],
      trim: true,
    },
    observedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ObservationSchema.index({ childId: 1, observedAt: -1 });

export default mongoose.models.Observation ||
  mongoose.model<IObservation>("Observation", ObservationSchema);
