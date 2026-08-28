export interface AuthenticatedUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}