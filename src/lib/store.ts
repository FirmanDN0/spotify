import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Track } from "./api";

export interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  playContext: { type: "search" | "homepage" | "favorites" };
  isPlaying: boolean;
  isBuffering: boolean;
  isReady: boolean;
  progress: number;
  volume: number;
  favorites: Track[];
  recentlyPlayed: Track[];
  hasInteracted: boolean;
  isShuffled: boolean;
  repeatMode: "none" | "all" | "one";
  originalQueue: Track[];
  isLyricsVisible: boolean;
  rightPanelMode: "now-playing" | "queue" | "closed";

  // Actions
  playTrack: (track: Track, contextQueue?: Track[], contextType?: "search" | "homepage" | "favorites") => void;
  next: () => void;
  previous: () => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setProgress: (progress: number) => void;
  setVolume: (volume: number) => void;
  toggleFavorite: (track: Track) => void;
  clearQueue: () => void;
  setIsBuffering: (buffering: boolean) => void;
  setIsReady: (ready: boolean) => void;
  jumpToQueueIndex: (index: number) => void;
  setHasInteracted: () => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: "none" | "all" | "one") => void;
  appendQueue: (tracks: Track[]) => void;
  toggleLyrics: () => void;
  setRightPanelMode: (mode: "now-playing" | "queue" | "closed") => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      currentIndex: 0,
      playContext: { type: "homepage" },
      isPlaying: false,
      isBuffering: false,
      isReady: false,
      progress: 0,
      volume: 1,
      favorites: [],
      recentlyPlayed: [],
      hasInteracted: false,
      isShuffled: false,
      repeatMode: "none",
      originalQueue: [],
      isLyricsVisible: false,
      rightPanelMode: "now-playing",

      playTrack: (track, contextQueue, contextType) => {
        set((state) => {
          // Add to recently played (max 10, no duplicates)
          const newRecentlyPlayed = [track, ...state.recentlyPlayed.filter((t) => t.id !== track.id)].slice(0, 10);

          // Handle missing contextQueue: fallback to single-track queue
          const queueToUse = contextQueue && contextQueue.length > 0 ? contextQueue : [track];
          
          // Find the track in the context queue, or default to 0
          const clickedIndex = contextQueue ? contextQueue.findIndex((t) => t.id === track.id) : 0;
          const initialIndex = clickedIndex >= 0 ? clickedIndex : 0;

          let finalQueue = [...queueToUse];
          let finalIndex = initialIndex;

          if (state.isShuffled) {
             const otherTracks = finalQueue.filter((_, i) => i !== initialIndex);
             for (let i = otherTracks.length - 1; i > 0; i--) {
               const j = Math.floor(Math.random() * (i + 1));
               [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
             }
             finalQueue = [finalQueue[initialIndex], ...otherTracks];
             finalIndex = 0;
          }

          return {
            currentTrack: track,
            queue: finalQueue,
            originalQueue: queueToUse,
            currentIndex: finalIndex,
            playContext: contextType ? { type: contextType } : state.playContext,
            progress: 0,
            isBuffering: true,
            isReady: false,
            isPlaying: true,
            recentlyPlayed: newRecentlyPlayed,
          };
        });
      },

      next: () => {
        set((state) => {
          if (state.repeatMode === "one" && state.currentTrack) {
             return { progress: 0, isBuffering: true, isReady: false, isPlaying: true };
          }

          if (state.currentIndex + 1 >= state.queue.length) {
            // End of queue
            if (state.repeatMode === "all" && state.queue.length > 0) {
               return {
                 currentIndex: 0,
                 currentTrack: state.queue[0],
                 progress: 0,
                 isBuffering: true,
                 isReady: false,
                 isPlaying: true,
               };
            } else {
               return { isPlaying: false, progress: 0 };
            }
          }
          
          const nextIndex = state.currentIndex + 1;
          const nextTrack = state.queue[nextIndex];
          
          return {
            currentIndex: nextIndex,
            currentTrack: nextTrack,
            progress: 0,
            isBuffering: true,
            isReady: false,
            isPlaying: true,
          };
        });
      },

      previous: () => {
        set((state) => {
          if (state.progress > 3 || state.repeatMode === "one") {
            // If progress > 3 seconds or repeat one -> restart current track
            return {
              progress: 0,
              // Keep buffering/ready state as is, the Audio component will handle resetting the time
            };
          }
          
          if (state.currentIndex <= 0) {
            // Already at the first track
            if (state.repeatMode === "all" && state.queue.length > 0) {
               const lastIndex = state.queue.length - 1;
               return {
                 currentIndex: lastIndex,
                 currentTrack: state.queue[lastIndex],
                 progress: 0,
                 isBuffering: true,
                 isReady: false,
                 isPlaying: true,
               };
            }
            return { progress: 0 };
          }
          
          const prevIndex = state.currentIndex - 1;
          const prevTrack = state.queue[prevIndex];
          
          return {
            currentIndex: prevIndex,
            currentTrack: prevTrack,
            progress: 0,
            isBuffering: true,
            isReady: false,
            isPlaying: true,
          };
        });
      },

      togglePlay: () => set((state) => {
        if (!state.currentTrack) return state;
        return { isPlaying: !state.isPlaying };
      }),

      setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
      
      setProgress: (progress: number) => set({ progress }),
      
      setVolume: (volume: number) => set({ volume }),
      
      toggleFavorite: (track: Track) => set((state) => {
        // Safe check in case old string IDs are still in memory before reload
        const validFavorites = state.favorites.filter((f) => typeof f === 'object' && f !== null);
        const isFav = validFavorites.some((f) => f.id === track.id);
        return {
          favorites: isFav
            ? validFavorites.filter((f) => f.id !== track.id)
            : [...validFavorites, track],
        };
      }),

      clearQueue: () => set({
        currentTrack: null,
        queue: [],
        currentIndex: 0,
        progress: 0,
        isPlaying: false,
        isBuffering: false,
        isReady: false,
      }),

      setIsBuffering: (buffering: boolean) => set({ isBuffering: buffering }),
      
      setIsReady: (ready: boolean) => set({ isReady: ready }),

      setHasInteracted: () => set({ hasInteracted: true }),

      toggleShuffle: () => set((state) => {
        if (!state.currentTrack || state.queue.length <= 1) {
          return { isShuffled: !state.isShuffled };
        }

        if (!state.isShuffled) {
          // Turning ON: shuffle queue, keep current track at index 0
          const otherTracks = state.queue.filter((_, i) => i !== state.currentIndex);
          for (let i = otherTracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
          }
          const shuffledQueue = [state.queue[state.currentIndex], ...otherTracks];
          
          return {
            isShuffled: true,
            originalQueue: state.queue, // Save current queue as original
            queue: shuffledQueue,
            currentIndex: 0,
          };
        } else {
          // Turning OFF: restore original queue, find current track's new index
          const originalIndex = state.originalQueue.findIndex((t) => t.id === state.currentTrack?.id);
          return {
            isShuffled: false,
            queue: state.originalQueue,
            currentIndex: originalIndex >= 0 ? originalIndex : 0,
          };
        }
      }),

      setRepeatMode: (mode) => set({ repeatMode: mode }),

      toggleLyrics: () => set((state) => ({ isLyricsVisible: !state.isLyricsVisible })),

      setRightPanelMode: (mode) => set({ rightPanelMode: mode }),

      jumpToQueueIndex: (index: number) => set((state) => {
        if (index < 0 || index >= state.queue.length) return state;
        
        const track = state.queue[index];
        return {
          currentIndex: index,
          currentTrack: track,
          progress: 0,
          isBuffering: true,
          isReady: false,
        };
      }),

      appendQueue: (tracks) => set((state) => {
        // Filter out tracks already in the queue to avoid duplicates
        const existingIds = new Set(state.queue.map(t => t.id));
        const newTracks = tracks.filter(t => !existingIds.has(t.id));
        
        if (newTracks.length === 0) return state;

        const newQueue = [...state.queue, ...newTracks];
        const newOriginalQueue = [...state.originalQueue, ...newTracks];

        return {
          queue: newQueue,
          originalQueue: newOriginalQueue
        };
      }),
    }),
    {
      name: "music-player-storage",
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        currentIndex: state.currentIndex,
        progress: state.progress,
        volume: state.volume,
        favorites: state.favorites.filter((f) => typeof f === 'object' && f !== null),
        recentlyPlayed: state.recentlyPlayed,
        isShuffled: state.isShuffled,
        repeatMode: state.repeatMode,
        originalQueue: state.originalQueue,
        rightPanelMode: state.rightPanelMode,
      }),
    }
  )
);
