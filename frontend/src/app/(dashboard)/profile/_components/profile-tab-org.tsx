"use client";

import type { AuthUser } from "@/hooks/use-auth";

import { ProfileIdentityCard } from "./ProfileIdentityCard";
import { ProfilePermissionsCard } from "./ProfilePermissionsCard";

export function ProfileTabOrg({ user }: { user: AuthUser }) {
  return (
    <div className="space-y-4">
      <ProfileIdentityCard user={user} />
      <ProfilePermissionsCard permissions={user.permissions ?? []} />
    </div>
  );
}
