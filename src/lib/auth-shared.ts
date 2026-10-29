import type { Role, User } from "@/db/schema";

const RANK: Record<Role, number> = { journalist: 1, editor: 2, admin: 3 };

export function hasRole(user: Pick<User, "role">, min: Role) {
  return RANK[user.role] >= RANK[min];
}
