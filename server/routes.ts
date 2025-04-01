import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for server-side functionality
  // Note: Most of the app functionality is handled directly through Firebase on the client
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Example endpoint to get server info
  app.get('/api/server-info', (req, res) => {
    res.json({
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      serverTime: new Date().toISOString(),
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
