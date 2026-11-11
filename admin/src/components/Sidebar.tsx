"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  BookOpen,
  Users,
  HelpCircle,
} from "lucide-react";

const nav = [
  { label: "Overview",         href: "/",             icon: LayoutDashboard },
  { label: "Verification",     href: "/verification", icon: ShieldCheck },
  { label: "Classes",          href: "/classes",      icon: BookOpen },
  { label: "Requests",         href: "/requests",     icon: Users },
  { label: "Q&A Board",        href: "/qa",           icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ width: 220 }}
      className="shrink-0 h-screen sticky top-0 bg-white border-r border-zinc-200 flex flex-col"
    >
      {/* Wordmark */}
      <div className="h-14 px-5 flex items-center border-b border-zinc-200">
        <span className="text-sm font-semibold text-zinc-900 tracking-tight">
          IlmConnect
        </span>
        <span className="ml-2 text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
          Portal
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-[#064e3b] text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-zinc-200">
        <p className="text-[11px] text-zinc-400">Zoq / IlmConnect v1.0</p>
      </div>
    </aside>
  );
}
