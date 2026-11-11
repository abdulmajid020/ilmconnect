"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

export function Header({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 px-6 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-zinc-900">{title}</h1>
        {description && (
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* User + logout */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#064e3b] flex items-center justify-center text-white text-xs font-medium">
            {user?.full_name?.[0] ?? "A"}
          </div>
          <span className="text-xs text-zinc-700 font-medium hidden sm:block">
            {user?.full_name?.split(" ")[0] ?? "Admin"}
          </span>
        </div>
        <button
          onClick={logout}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
