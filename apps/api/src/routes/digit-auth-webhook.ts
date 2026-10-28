import express from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { WebhookEvent } from "../models/WebhookEvent.js";
import { User } from "../models/User.js";

const router = express.Router();
const MAX_TIMESTAMP_AGE_SECONDS = 5 * 60;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

router.post(
  "/",
  express.raw({ type: "application/json", limit: "1mb" }),
  async (req, res) => {
    const secret = process.env.DIGIT_AUTH_WEBHOOK_SECRET;

    if (!secret) {
      return res.status(500).json({
        error: "Webhook receiver is not configured",
      });
    }

    const signature = req.header("digitauth-signature");
    const timestamp = req.header("digitauth-timestamp");

    if (!signature || !timestamp || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({
        error: "Missing or invalid webhook headers or body",
      });
    }

    if (!/^\d{10}$/.test(timestamp)) {
      return res.status(400).json({ error: "Invalid webhook timestamp" });
    }

    const timestampSeconds = Number(timestamp);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (Math.abs(nowSeconds - timestampSeconds) > MAX_TIMESTAMP_AGE_SECONDS) {
      return res.status(401).json({
        error: "Webhook timestamp has expired",
      });
    }

    const match = /^sha256=([a-f0-9]{64})$/i.exec(signature);

    if (!match) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const expectedSignature = createHmac("sha256", secret)
      .update(`${timestamp}.`)
      .update(req.body)
      .digest();

    const receivedSignature = Buffer.from(match[1]!, "hex");

    if (!timingSafeEqual(expectedSignature, receivedSignature)) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    let payload: unknown;

    try {
      payload = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.status(400).json({ error: "Invalid JSON payload" });
    }

    if (
      !isRecord(payload) ||
      typeof payload.id !== "string" ||
      !payload.id.trim() ||
      typeof payload.type !== "string" ||
      !payload.type.trim()
    ) {
      return res.status(400).json({
        error: "Invalid webhook event payload",
      });
    }

    const eventId = payload.id;
    const eventType = payload.type;
    const data = isRecord(payload.data) ? payload.data : null;

    try {
      let duplicate = false;

      try {
        await WebhookEvent.create({
          eventId,
          eventType,
          payload,
        });
      } catch (error: unknown) {
        if (isRecord(error) && error.code === 11000) {
          duplicate = true;
        } else {
          throw error;
        }
      }

      if (data && typeof data.id === "string" && data.id.trim()) {
        const digitAuthUserId = data.id;
        const isUserCreated = eventType === "user.created";
        const updates: Record<string, unknown> = {};

        if (typeof data.applicationId === "string") {
          updates.applicationId = data.applicationId;
        }

        if (typeof data.firstName === "string") {
          updates.firstName = data.firstName;
        }

        if (typeof data.lastName === "string") {
          updates.lastName = data.lastName;
        }

        if (typeof data.email === "string" && data.email.trim()) {
          updates.email = data.email.trim().toLowerCase();
        }

        if (typeof data.emailVerified === "boolean") {
          updates.emailVerified = data.emailVerified;
        }

        if (typeof data.createdAt === "string") {
          const digitAuthCreatedAt = new Date(data.createdAt);

          if (!Number.isNaN(digitAuthCreatedAt.getTime())) {
            updates.digitAuthCreatedAt = digitAuthCreatedAt;
          }
        }

        if (
          isUserCreated &&
          typeof updates.applicationId === "string" &&
          typeof updates.email === "string"
        ) {
          await User.findOneAndUpdate(
            { digitAuthUserId },
            {
              $set: updates,
              $setOnInsert: { digitAuthUserId },
            },
            {
              upsert: true,
              new: true,
              runValidators: true,
              setDefaultsOnInsert: true,
            },
          );
        } else if (Object.keys(updates).length > 0) {
          await User.updateOne(
            { digitAuthUserId },
            { $set: updates },
            { runValidators: true },
          );
        }
      }

      return res.status(200).json({
        received: true,
        ...(duplicate ? { duplicate: true } : {}),
      });
    } catch (error: unknown) {
      console.error(
        "Failed to process DigitAuth webhook:",
        error instanceof Error ? error.message : "Unknown error",
      );

      return res.status(500).json({
        error: "Failed to process webhook",
      });
    }
  },
);

export default router;
