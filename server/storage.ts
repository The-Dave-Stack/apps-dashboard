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
  
  async hasUsers(): Promise<boolean> {
    return this.firebaseUsers.size > 0;
  }
}

export const storage = new MemStorage();
