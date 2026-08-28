"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({
  title,
  onMenuClick,
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
        {/* User controls will be connected to Google OAuth */}
        <div className="size-8 rounded-full bg-muted" />
      </div>
    </header>
  );
}