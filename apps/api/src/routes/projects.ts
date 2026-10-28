import express from "express";
import { requireAuth, getAuth } from "@digit-auth/node";
import mongoose from "mongoose";
import { Project } from "../models/Project.js";

function sanitizeProject(project: any) {
  if (!project) return project;
  const { _id, title, description, createdAt, updatedAt } = project;
  const id = _id?.toString?.() ?? project.id;
  return {
    _id: id,
    id,
    title,
    description: description ?? null,
    createdAt,
    updatedAt,
  };
}

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export function createProjectsRouter(digitAuth: any) {
  const router = express.Router();

  router.get("/", requireAuth(digitAuth), async (req, res) => {
    try {
      const auth = getAuth(req);

      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const projects = await Project.find({ ownerId: auth.user.id })
        .sort({ createdAt: -1 })
        .lean();

      const sanitized = projects.map((p: any) => sanitizeProject(p));
      return res.status(200).json({ projects: sanitized });
    } catch (error) {
      console.error("Error fetching projects");
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/", requireAuth(digitAuth), async (req, res) => {
    try {
      const auth = getAuth(req);

      if (!auth) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { title, description } = req.body ?? {};

      if (typeof title !== "string" || title.trim().length === 0) {
        return res.status(400).json({ error: "Title is required" });
      }

      if (title.trim().length > 200) {
        return res.status(400).json({ error: "Title must be 200 characters or less" });
      }

      if (description !== undefined && description !== null && typeof description !== "string") {
        return res.status(400).json({ error: "Description must be a string" });
      }

      if (typeof description === "string" && description.trim().length > 1000) {
        return res.status(400).json({ error: "Description must be 1000 characters or less" });
      }

      const projectData: any = {
        title: title.trim(),
        ownerId: auth.user.id,
      };

      if (typeof description === "string" && description.trim().length > 0) {
        projectData.description = description.trim();
      } else if (description === null) {
        // treat null as no description
      }

      const project = await Project.create(projectData);
      const sanitized = sanitizeProject(project.toObject ? project.toObject() : project);

      return res.status(201).json({ project: sanitized });
    } catch (error) {
      console.error("Error creating project");
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
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const project = await Project.findOne({ _id: id, ownerId: auth.user.id }).lean();
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      return res.status(200).json({ project: sanitizeProject(project) });
    } catch (error) {
      console.error("Error fetching project");
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
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const { title, description } = req.body ?? {};
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

      const project = await Project.findOneAndUpdate(
        { _id: id, ownerId: auth.user.id },
        update,
        { new: true, runValidators: true }
      ).lean();

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      return res.status(200).json({ project: sanitizeProject(project) });
    } catch (error) {
      console.error("Error updating project");
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
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const project = await Project.findOneAndDelete({ _id: id, ownerId: auth.user.id }).lean();
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting project");
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
