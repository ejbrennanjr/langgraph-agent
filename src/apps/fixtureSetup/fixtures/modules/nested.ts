import { Fixture } from "@/apps/fixtureSetup/types/Fixture";

/**
 * Generates module fixtures demonstrating nested module structures and various export patterns.
 * Files are organized in a proper directory hierarchy to test module resolution and imports.
 */
export async function generateNestedModules(): Promise<Fixture[]> {
  return [
    // Root level index
    {
      filename: "index.ts",
      content: `
        export * from './models';
        export * from './services';
        export * as stringUtils from './utils/strings';
        export { default as rootConfig } from './config';
      `,
    },

    // Root level config
    {
      filename: "config.ts",
      content: `
        export default {
          apiUrl: 'https://api.example.com',
          timeout: 5000
        };
      `,
    },

    // Models directory
    {
      filename: "models/user.ts",
      content: `
        export interface User {
          id: string;
          email: string;
          profile: UserProfile;
        }

        export interface UserProfile {
          firstName: string;
          lastName: string;
          avatar?: string;
        }

        export type UserId = string;
      `,
    },
    {
      filename: "models/index.ts",
      content: `
        export * from './user';
        export * from './permissions';
        export type { UserProfile as Profile } from './user';
      `,
    },
    {
      filename: "models/permissions/role.ts",
      content: `
        export type Role = 'admin' | 'user' | 'guest';

        export interface Permission {
          name: string;
          allowed: boolean;
        }
      `,
    },
    {
      filename: "models/permissions/index.ts",
      content: `
        export * from './role';
        export { type Permission as AccessPermission } from './role';
      `,
    },

    // Services directory
    {
      filename: "services/user/userService.ts",
      content: `
        import type { User, UserId } from '../../models/user';
        import type { Role } from '../../models/permissions/role';
        import config from '../../config';

        export class UserService {
          private apiUrl = config.apiUrl;

          async getUser(id: UserId): Promise<User | null> {
            return null;
          }

          async getUserRole(id: UserId): Promise<Role> {
            return 'user';
          }
        }

        export function createUserService(): UserService {
          return new UserService();
        }
      `,
    },
    {
      filename: "services/user/index.ts",
      content: `
        export * from './userService';
        export { createUserService as initializeUserService } from './userService';
      `,
    },
    {
      filename: "services/index.ts",
      content: `
        export * from './user';
        export * as adminServices from './admin';
      `,
    },
    {
      filename: "services/admin/index.ts",
      content: `
        import type { UserId } from '../../models/user';
        import type { Permission } from '../../models/permissions/role';

        export async function getAdminPermissions(userId: UserId): Promise<Permission[]> {
          return [];
        }
      `,
    },

    // Utils directory
    {
      filename: "utils/strings.ts",
      content: `
        export function capitalize(str: string): string {
          return str.charAt(0).toUpperCase() + str.slice(1);
        }

        export function lowercase(str: string): string {
          return str.toLowerCase();
        }
      `,
    },
    {
      filename: "utils/validation/index.ts",
      content: `
        export function isEmail(email: string): boolean {
          return email.includes('@');
        }

        export function isStrongPassword(password: string): boolean {
          return password.length >= 8;
        }
      `,
    },
  ];
}
