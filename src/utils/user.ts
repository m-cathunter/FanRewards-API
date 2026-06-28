import { User } from '../entities/User';

/** User shape that is safe to return over the API (never includes the hash). */
export interface PublicUser {
  id: string;
  email: string;
  displayName: string | null;
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    totalPoints: user.totalPoints,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
