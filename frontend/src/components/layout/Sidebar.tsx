"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock3,
  FileCheck2,
  MailPlus,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    label: "Compose",
    href: "/dashboard/compose",
    icon: MailPlus,
  },
  {
    label: "Scheduled",
    href: "/dashboard/scheduled",
    icon: Clock3,
  },
  {
    label: "Sent",
    href: "/dashboard/sent",
    icon: Send,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-background md:flex md:flex-col">
      <div className="flex h-16 items-center border-b px-5">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight"
        >
          ReachInbox
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}