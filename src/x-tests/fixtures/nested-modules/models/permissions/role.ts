export type Role = 'admin' | 'user' | 'guest';

export interface Permission {
  name: string;
  allowed: boolean;
}