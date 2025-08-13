export interface User {
  id?: string;
  email?: string;
  handle?: string;
  displayName?: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  role?: string;
  verified?: boolean;
}
