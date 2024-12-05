import { Fixture } from "@/apps/fixtureSetup/types/Fixture";

/**
 * Generates basic module fixtures demonstrating fundamental import/export patterns.
 */
export async function generateBasicModules(): Promise<Fixture[]> {
  return [
    {
      filename: "types.ts",
      content: `
        export interface User {
          id: string;
          name: string;
        }

        export type UserRole = 'admin' | 'user';

        export default interface AuthConfig {
          tokenExpiry: number;
          secret: string;
        }
      `,
    },
    {
      filename: "utils.ts",
      content: `
        export function formatDate(date: Date): string {
          return date.toISOString();
        }

        export const API_URL = 'https://api.example.com';

        export class Logger {
          static log(message: string) {
            console.log(\`[LOG]: \${message}\`);
          }
        }
      `,
    },
    {
      filename: "userService.ts",
      content: `
        import type { User } from './types';
        import AuthConfig from './types';
        import { API_URL, Logger } from './utils';

        export class UserService {
          constructor(private config: AuthConfig) {}

          async getUser(id: string): Promise<User> {
            Logger.log(\`Fetching user \${id}\`);
            return {
              id,
              name: 'John Doe'
            };
          }
        }
      `,
    },
  ];
}
