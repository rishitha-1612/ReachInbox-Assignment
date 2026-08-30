"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
  user?: {
    name: string;
    email: string;
  } | null;
  onLogout?: () => void;
}

export function Header({
  title,
  onMenuClick,
  user,
  onLogout,
}: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>

        <h1 className="text-lg font-semibold tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden text-right sm:block">
            <p className="max-w-48 truncate text-sm font-medium">
              {user.name}
            </p>
            <p className="max-w-48 truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        )}

        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {user?.name?.charAt(0).toUpperCase() ?? "R"}
        </div>

        {onLogout && (
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
          >
            Sign out
          </Button>
        )}
      </div>
    </header>
  );
}
