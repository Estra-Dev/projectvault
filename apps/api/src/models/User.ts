import mongoose, { Schema, type Model } from "mongoose";

interface UserFields {
  digitAuthUserId: string;
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  digitAuthCreatedAt?: Date;
}

const userSchema = new Schema<UserFields>(
  {
    digitAuthUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    applicationId: {
      type: String,
      required: true,
    },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    digitAuthCreatedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const User: Model<UserFields> =
  (mongoose.models.User as Model<UserFields> | undefined) ??
  mongoose.model<UserFields>("User", userSchema);
