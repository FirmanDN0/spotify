"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/favorites", label: "Favorites", icon: Heart },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-black flex-col h-full shrink-0 border-r border-neutral-800">
        <div className="p-6">
          <div className="flex items-center gap-3 text-white mb-8">
            <div className="bg-cyan-500 p-2 rounded-lg">
              <Music2 className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold tracking-wider">MUSE</span>
          </div>

          <nav className="space-y-4">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-lg font-medium transition duration-200",
                    isActive
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-cyan-400" : "")} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 text-xs text-neutral-600">
          <p>&copy; {new Date().getFullYear()} MUSE App</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-[4.5rem] left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-neutral-800 flex items-center justify-around px-2 py-2 safe-bottom">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition-colors",
                isActive ? "text-white" : "text-neutral-500"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-cyan-400")} />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
