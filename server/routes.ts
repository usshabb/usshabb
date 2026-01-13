
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === API ROUTES ===

  // List folders
  app.get(api.folders.list.path, async (req, res) => {
    const folders = await storage.getFolders();
    res.json(folders);
  });

  // Get single folder
  app.get(api.folders.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const folder = await storage.getFolder(id);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }
    res.json(folder);
  });

  // Create folder
  app.post(api.folders.create.path, async (req, res) => {
    try {
      const input = api.folders.create.input.parse(req.body);
      // Basic duplicate check handled by DB constraint, but could check here too
      const folder = await storage.createFolder(input);
      res.status(201).json(folder);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      // Handle unique constraint error (Postgres error 23505)
      if ((err as any).code === '23505') {
        return res.status(400).json({ message: "A folder with this name already exists" });
      }
      throw err;
    }
  });

  // Update folder
  app.put(api.folders.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.folders.update.input.parse(req.body);
      const updated = await storage.updateFolder(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      // Handle not found logic if storage throws
      res.status(404).json({ message: "Folder not found" });
    }
  });

  // Delete folder
  app.delete(api.folders.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteFolder(id);
    res.status(204).end();
  });

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const folders = await storage.getFolders();
    if (folders.length === 0) {
      console.log("Seeding database with initial folders...");
      await storage.createFolder({ name: "Projects", x: 20, y: 20 });
      await storage.createFolder({ name: "Documents", x: 20, y: 120 });
      await storage.createFolder({ name: "Photos", x: 20, y: 220 });
      console.log("Seeding complete.");
    }
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}
