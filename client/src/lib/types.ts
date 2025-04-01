// App data structure
export interface AppData {
  id?: string;
  name: string;
  icon: string;
  url: string;
  description?: string;
}

// Category data structure
export interface CategoryData {
  id: string;
  name: string;
  apps: AppData[];
}

// User roles
export enum UserRole {
  USER = "user",
  ADMIN = "admin"
}

// User data structure
export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
}
