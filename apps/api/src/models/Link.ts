import mongoose, { Schema, Document } from "mongoose";

export interface ILink extends Document {
  title: string;
  url: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const LinkSchema = new Schema<ILink>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
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

LinkSchema.index({ ownerId: 1, createdAt: -1 });

export const Link = mongoose.model<ILink>("Link", LinkSchema);
