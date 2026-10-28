import mongoose, { Schema, Document, Types } from "mongoose";

export interface INote extends Document {
  title: string;
  content: string;
  ownerId: string;
  projectId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

NoteSchema.index({ ownerId: 1, createdAt: -1 });
NoteSchema.index({ ownerId: 1, projectId: 1, createdAt: -1 });

export const Note = mongoose.model<INote>("Note", NoteSchema);
