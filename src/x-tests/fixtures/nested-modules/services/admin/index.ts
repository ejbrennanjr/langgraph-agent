import type { UserId } from '../../models/user';
import type { Permission } from '../../models/permissions/role';

export async function getAdminPermissions(userId: UserId): Promise<Permission[]> {
  return [];
}