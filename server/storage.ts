import { users, type User, type InsertUser, UserRole, FirebaseUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Métodos para gestión de usuarios desde Firebase
  getUsers(): Promise<FirebaseUser[]>;
  getUserById(userId: string): Promise<FirebaseUser | null>;
  updateUserRole(userId: string, role: UserRole): Promise<FirebaseUser>;
  toggleUserStatus(userId: string, disabled: boolean): Promise<FirebaseUser>;
  deleteUser(userId: string): Promise<void>;
  hasUsers(): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private firebaseUsers: Map<string, FirebaseUser>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.firebaseUsers = new Map();
    this.currentId = 1;
    
    // Añadir usuarios de prueba para desarrollo
    this.firebaseUsers.set("u20InPS27iMb50V9kzjKScKSx4j1", {
      id: "u20InPS27iMb50V9kzjKScKSx4j1",
      username: "Usuario Admin",
      email: "admin@ejemplo.com",
      role: UserRole.ADMIN,
      createdAt: new Date().toISOString()
    });
    
    // Segundo usuario con rol normal
    this.firebaseUsers.set("user123456", {
      id: "user123456",
      username: "Usuario Regular",
      email: "usuario@ejemplo.com",
      role: UserRole.USER,
      createdAt: new Date().toISOString()
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    // Asegurarnos de que role e isAdmin siempre tienen valores
    const role = insertUser.role || UserRole.USER;
    const isAdmin = insertUser.isAdmin !== undefined ? insertUser.isAdmin : false;
    
    const user: User = { 
      ...insertUser, 
      id,
      role,
      isAdmin
    };
    
    this.users.set(id, user);
    return user;
  }
  
  // Implementación de métodos para gestión de usuarios Firebase
  
  async getUsers(): Promise<FirebaseUser[]> {
    return Array.from(this.firebaseUsers.values());
  }
  
  async getUserById(userId: string): Promise<FirebaseUser | null> {
    const user = this.firebaseUsers.get(userId);
    return user || null;
  }
  
  async updateUserRole(userId: string, role: UserRole): Promise<FirebaseUser> {
    const user = this.firebaseUsers.get(userId);
    if (!user) {
      throw new Error(`Usuario ${userId} no encontrado`);
    }
    
    const updatedUser: FirebaseUser = {
      ...user,
      role
    };
    
    this.firebaseUsers.set(userId, updatedUser);
    return updatedUser;
  }
  
  async toggleUserStatus(userId: string, disabled: boolean): Promise<FirebaseUser> {
    const user = this.firebaseUsers.get(userId);
    if (!user) {
      throw new Error(`Usuario ${userId} no encontrado`);
    }
    
    const updatedUser: FirebaseUser = {
      ...user,
      disabled
    };
    
    this.firebaseUsers.set(userId, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(userId: string): Promise<void> {
    if (!this.firebaseUsers.has(userId)) {
      throw new Error(`Usuario ${userId} no encontrado`);
    }
    
    this.firebaseUsers.delete(userId);
  }
  
  async hasUsers(): Promise<boolean> {
    return this.firebaseUsers.size > 0;
  }
}

export const storage = new MemStorage();
