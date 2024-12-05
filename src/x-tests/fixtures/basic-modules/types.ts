export interface User {
  id: string;
  name: string;
}

export type UserRole = 'admin' | 'user';

export default interface AuthConfig {
  tokenExpiry: number;
  secret: string;
}