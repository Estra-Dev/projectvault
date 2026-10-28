import express from "express";
import { requireAuth, getAuth } from "@digit-auth/node";
import mongoose from "mongoose";
import { Link } from "../models/Link.js";

function sanitizeLink(link: any) {
  if (!link) return link;
  const { _id, title, url, description, createdAt, updatedAt } = link;
  const id = _id?.toString?.() ?? link.id;
  return {
    _id: id,
    id,
    title,
    url,
    description: description ?? null,
    createdAt,
    updatedAt,
  };
}

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function createLinksRouter(digitAuth: any) {
  const router = express.Router();

  router.get("/", requireAuth(digitAuth), async (req, res) => {
    try {
      const auth = getAuth(req);

      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const links = await Link.find({ ownerId: auth.user.id })
        .sort({ createdAt: -1 })
        .lean();

      const sanitized = links.map((l: any) => sanitizeLink(l));
      return res.status(200).json({ links: sanitized });
    } catch (error) {
      console.error("Error fetching links");
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/", requireAuth(digitAuth), async (req, res) => {
    try {
      const auth = getAuth(req);

      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { title, url, description } = req.body ?? {};

      if (typeof title !== "string" || title.trim().length === 0) {
        return res.status(400).json({ error: "Title is required" });
      }
      if (title.trim().length > 200) {
        return res.status(400).json({ error: "Title must be 200 characters or less" });
      }

      if (typeof url !== "string" || url.trim().length === 0) {
        return res.status(400).json({ error: "URL is required" });
      }
      if (url.trim().length > 2048) {
        return res.status(400).json({ error: "URL must be 2048 characters or less" });
      }
      const trimmedUrl = url.trim();
      if (!isValidHttpUrl(trimmedUrl)) {
        return res.status(400).json({ error: "URL must be a valid http or https URL" });
      }

      if (description !== undefined && description !== null && typeof description !== "string") {
        return res.status(400).json({ error: "Description must be a string" });
      }
      if (typeof description === "string" && description.trim().length > 1000) {
        return res.status(400).json({ error: "Description must be 1000 characters or less" });
      }

      const linkData: any = {
        title: title.trim(),
        url: trimmedUrl,
        ownerId: auth.user.id,
      };

      if (typeof description === "string" && description.trim().length > 0) {
        linkData.description = description.trim();
      }

      const link = await Link.create(linkData);
      const sanitized = sanitizeLink(link.toObject ? link.toObject() : link);

      return res.status(201).json({ link: sanitized });
    } catch (error) {
      console.error("Error creating link");
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/:id", requireAuth(digitAuth), async (req, res) => {
    try {
      const auth = getAuth(req);

      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id || !isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid link ID" });
      }

      const link = await Link.findOne({ _id: id, ownerId: auth.user.id }).lean();
      if (!link) {
        return res.status(404).json({ error: "Link not found" });
      }

      return res.status(200).json({ link: sanitizeLink(link) });
    } catch (error) {
      console.error("Error fetching link");
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.put("/:id", requireAuth(digitAuth), async (req, res) => {
    try {
      const auth = getAuth(req);

      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id || !isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid link ID" });
      }

      const { title, url, description } = req.body ?? {};
      const update: any = {};

      if (title !== undefined) {
        if (typeof title !== "string" || title.trim().length === 0) {
          return res.status(400).json({ error: "Title is required" });
        }
        if (title.trim().length > 200) {
          return res.status(400).json({ error: "Title must be 200 characters or less" });
        }
        update.title = title.trim();
      }

      if (url !== undefined) {
        if (typeof url !== "string" || url.trim().length === 0) {
          return res.status(400).json({ error: "URL is required" });
        }
        if (url.trim().length > 2048) {
          return res.status(400).json({ error: "URL must be 2048 characters or less" });
        }
        const trimmedUrl = url.trim();
        if (!isValidHttpUrl(trimmedUrl)) {
          return res.status(400).json({ error: "URL must be a valid http or https URL" });
        }
        update.url = trimmedUrl;
      }

      if (description !== undefined) {
        if (description === null) {
          update.description = undefined;
        } else if (typeof description !== "string") {
          return res.status(400).json({ error: "Description must be a string" });
        } else {
          if (description.trim().length > 1000) {
            return res.status(400).json({ error: "Description must be 1000 characters or less" });
          }
          if (description.trim().length === 0) {
            update.description = undefined;
          } else {
            update.description = description.trim();
          }
        }
      }

      if (Object.keys(update).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const link = await Link.findOneAndUpdate(
        { _id: id, ownerId: auth.user.id },
        update,
        { new: true, runValidators: true }
      ).lean();

      if (!link) {
        return res.status(404).json({ error: "Link not found" });
      }

      return res.status(200).json({ link: sanitizeLink(link) });
    } catch (error) {
      console.error("Error updating link");
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.delete("/:id", requireAuth(digitAuth), async (req, res) => {
    try {
      const auth = getAuth(req);

      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id || !isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid link ID" });
      }

      const link = await Link.findOneAndDelete({ _id: id, ownerId: auth.user.id }).lean();
      if (!link) {
        return res.status(404).json({ error: "Link not found" });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting link");
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
