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