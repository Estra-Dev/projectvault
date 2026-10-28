import express from "express";
import { requireAuth, getAuth } from "@digit-auth/node";
import mongoose from "mongoose";
import { Note } from "../models/Note.js";
import { Project } from "../models/Project.js";

function sanitizeNote(note: any) {
  if (!note) return note;
  const { _id, title, content, ownerId, projectId, createdAt, updatedAt } = note;
  const id = _id?.toString?.() ?? note.id;
  let projectIdStr: string | null = null;
  if (projectId) {
    if (typeof projectId === "object" && projectId._id) {
      projectIdStr = projectId._id.toString();
    } else {
      projectIdStr = projectId.toString?.() ?? projectId;
    }
  }
  return {
    _id: id,
    id,
    title,
    content,
    projectId: projectIdStr,
    createdAt,
    updatedAt,
  };
}

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export function createNotesRouter(digitAuth: any) {
  const router = express.Router();

  router.get("/", requireAuth(digitAuth), async (req, res) => {
    try {
      const auth = getAuth(req);

      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const notes = await Note.find({ ownerId: auth.user.id })
        .sort({ createdAt: -1 })
        .lean();

      const sanitized = notes.map((n: any) => sanitizeNote(n));
      return res.status(200).json({ notes: sanitized });
    } catch (error) {
      console.error("Error fetching notes");
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/", requireAuth(digitAuth), async (req, res) => {
    try {
      const auth = getAuth(req);

      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { title, content, projectId } = req.body ?? {};

      if (typeof title !== "string" || title.trim().length === 0) {
        return res.status(400).json({ error: "Title is required" });
      }
      if (title.trim().length > 200) {
        return res.status(400).json({ error: "Title must be 200 characters or less" });
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ error: "Content is required" });
      }
      if (content.trim().length > 5000) {
        return res.status(400).json({ error: "Content must be 5000 characters or less" });
      }

      const noteData: any = {
        title: title.trim(),
        content: content.trim(),
        ownerId: auth.user.id,
        projectId: null,
      };

      if (projectId !== undefined && projectId !== null && projectId !== "") {
        if (typeof projectId !== "string" || !isValidObjectId(projectId)) {
          return res.status(400).json({ error: "Invalid project ID" });
        }
        const project = await Project.findOne({ _id: projectId, ownerId: auth.user.id }).lean();
        if (!project) {
          return res.status(404).json({ error: "Project not found" });
        }
        noteData.projectId = projectId;
      }

      const note = await Note.create(noteData);
      const sanitized = sanitizeNote(note.toObject ? note.toObject() : note);

      return res.status(201).json({ note: sanitized });
    } catch (error) {
      console.error("Error creating note");
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
        return res.status(400).json({ error: "Invalid note ID" });
      }

      const note = await Note.findOne({ _id: id, ownerId: auth.user.id }).lean();
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      return res.status(200).json({ note: sanitizeNote(note) });
    } catch (error) {
      console.error("Error fetching note");
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
        return res.status(400).json({ error: "Invalid note ID" });
      }

      const { title, content, projectId } = req.body ?? {};
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

      if (content !== undefined) {
        if (typeof content !== "string" || content.trim().length === 0) {
          return res.status(400).json({ error: "Content is required" });
        }
        if (content.trim().length > 5000) {
          return res.status(400).json({ error: "Content must be 5000 characters or less" });
        }
        update.content = content.trim();
      }

      if (projectId !== undefined) {
        if (projectId === null || projectId === "") {
          update.projectId = null;
        } else if (typeof projectId === "string") {
          if (!isValidObjectId(projectId)) {
            return res.status(400).json({ error: "Invalid project ID" });
          }
          const project = await Project.findOne({ _id: projectId, ownerId: auth.user.id }).lean();
          if (!project) {
            return res.status(404).json({ error: "Project not found" });
          }
          update.projectId = projectId;
        } else {
          return res.status(400).json({ error: "Invalid project ID" });
        }
      }

      if (Object.keys(update).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const note = await Note.findOneAndUpdate(
        { _id: id, ownerId: auth.user.id },
        update,
        { new: true, runValidators: true }
      ).lean();

      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      return res.status(200).json({ note: sanitizeNote(note) });
    } catch (error) {
      console.error("Error updating note");
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
        return res.status(400).json({ error: "Invalid note ID" });
      }

      const note = await Note.findOneAndDelete({ _id: id, ownerId: auth.user.id }).lean();
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting note");
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
