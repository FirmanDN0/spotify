"use client";

import { usePlayerStore } from "@/lib/store";
import { QueuePanel } from "./QueuePanel";
import { NowPlayingPanel } from "./NowPlayingPanel";
import { cn } from "@/lib/utils";

export function RightSidebar() {
  const { rightPanelMode } = usePlayerStore();

  if (rightPanelMode === "closed") {
    return null;
  }

  return (
    <aside className="w-80 hidden lg:block h-full border-l border-neutral-800">
      {rightPanelMode === "queue" ? <QueuePanel /> : <NowPlayingPanel />}
    </aside>
  );
}
