import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  title: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ ownerId: 1, createdAt: -1 });

export const Project = mongoose.model<IProject>("Project", ProjectSchema);
