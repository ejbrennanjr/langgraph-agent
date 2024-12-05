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