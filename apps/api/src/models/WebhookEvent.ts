import mongoose, { Schema } from "mongoose";

const webhookEventSchema = new Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

export const WebhookEvent =
  mongoose.models.WebhookEvent ??
  mongoose.model("WebhookEvent", webhookEventSchema);
