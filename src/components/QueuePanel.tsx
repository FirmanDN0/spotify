"use client";

import { usePlayerStore } from "@/lib/store";
import { FALLBACK_IMAGE } from "@/lib/api";
import { ListMusic, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function QueuePanel() {
  const { queue, currentIndex, currentTrack, jumpToQueueIndex, clearQueue, isPlaying, setHasInteracted } = usePlayerStore();

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500 p-6 text-center">
        <ListMusic className="w-12 h-12 mb-4 opacity-50" />
        <p>Your queue is empty</p>
        <p className="text-sm mt-2">Play a song or search for tracks to add them here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800">
      <div className="p-6 pb-4 border-b border-neutral-800 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-cyan-500" />
          Queue
        </h2>
        <button
          onClick={clearQueue}
          className="text-neutral-500 hover:text-red-400 transition"
          title="Clear Queue"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {queue.map((track, index) => {
          const isCurrent = index === currentIndex;
          
          return (
            <div
              key={`${track.id}-${index}`}
              onClick={() => {
                setHasInteracted();
                jumpToQueueIndex(index);
              }}
              className={cn(
                "group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition",
                isCurrent ? "bg-cyan-500/20 hover:bg-cyan-500/30" : "hover:bg-neutral-800"
              )}
            >
              <div className="relative w-10 h-10 flex-shrink-0 rounded bg-neutral-800 overflow-hidden">
                <img 
                  src={track.cover_image} 
                  alt={track.title} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />
                <div className={cn(
                  "absolute inset-0 bg-black/50 flex items-center justify-center transition",
                  isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  {isCurrent && isPlaying ? (
                    <div className="w-3 h-3 bg-cyan-400 rounded-sm" />
                  ) : (
                    <Play className={cn("w-4 h-4 ml-0.5", isCurrent ? "text-cyan-400 fill-cyan-400" : "text-white fill-white")} />
                  )}
                </div>
              </div>
              
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className={cn(
                  "text-sm font-medium truncate",
                  isCurrent ? "text-cyan-400" : "text-white group-hover:text-cyan-100"
                )}>
                  {track.title}
                </span>
                <span className="text-xs text-neutral-400 truncate">{track.artist}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
