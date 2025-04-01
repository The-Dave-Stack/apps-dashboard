import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

// App schema
export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  url: text("url").notNull(),
  description: text("description"),
  categoryId: integer("category_id").notNull()
});

// Category schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

// Firebase schema (for reference, not used in database)
export const firebaseSchema = pgTable("firebase_schemas", {
  id: serial("id").primaryKey(),
  data: jsonb("data"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isAdmin: true,
});

export const insertAppSchema = createInsertSchema(apps).pick({
  name: true,
  icon: true,
  url: true,
  description: true,
  categoryId: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertApp = z.infer<typeof insertAppSchema>;
export type App = typeof apps.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Firebase data types for client reference
export type FirebaseApp = {
  id: string;
  name: string;
  icon: string;
  url: string;
  description?: string;
};

export type FirebaseCategory = {
  id: string;
  name: string;
  apps: FirebaseApp[];
};
