import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { FirebaseUser, UserRole, updateUserRoleSchema } from "@shared/schema";

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

  // Obtener todos los usuarios
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  });

  // Obtener un usuario específico
  app.get('/api/users/:userId', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({ error: 'Error al obtener usuario' });
    }
  });

  // Actualizar el rol de un usuario
  app.patch('/api/users/:userId/role', async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const { role } = req.body;
      
      // Validar datos usando Zod
      const validationResult = updateUserRoleSchema.safeParse({
        userId,
        role
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          details: validationResult.error.format()
        });
      }
      
      // Verificar que el usuario existe
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      // Actualizar el rol
      const updatedUser = await storage.updateUserRole(userId, role as UserRole);
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error al actualizar rol de usuario:', error);
      res.status(500).json({ error: 'Error al actualizar rol de usuario' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
