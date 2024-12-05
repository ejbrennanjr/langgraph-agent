import type { User } from './types';
import AuthConfig from './types';
import { API_URL, Logger } from './utils';

export class UserService {
  constructor(private config: AuthConfig) {}

  async getUser(id: string): Promise<User> {
    Logger.log(`Fetching user ${id}`);
    return {
      id,
      name: 'John Doe'
    };
  }
}