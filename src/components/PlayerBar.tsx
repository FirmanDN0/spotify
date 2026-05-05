"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/lib/store";
import { searchTracks } from "@/lib/api";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Loader2, Shuffle, Repeat, Repeat1, Mic2, ListMusic, PlaySquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlayerBar() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevTrackIdRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);
  
  const {
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    isBuffering,
    isReady,
    progress,
    volume,
    hasInteracted,
    isShuffled,
    repeatMode,
    playContext,
    isLyricsVisible,
    rightPanelMode,
    appendQueue,
    next,
    previous,
    togglePlay,
    toggleShuffle,
    setRepeatMode,
    toggleLyrics,
    setRightPanelMode,
    setIsPlaying,
    setProgress,
    setIsBuffering,
    setIsReady,
    setVolume,
    setHasInteracted,
  } = usePlayerStore();

  // Rapid click handling & Track switching
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Only reload if the track actually changed
    if (prevTrackIdRef.current !== currentTrack.id) {
      prevTrackIdRef.current = currentTrack.id;
      retryCountRef.current = 0;
      
      // Handle rapid clicks: Change source
      audio.src = currentTrack.audio_url;
      audio.load();
      setIsPlaying(true);
    }
  }, [currentTrack]);

  // Auto-Queue (Track Radio) Logic
  useEffect(() => {
    if (
      currentTrack && 
      queue.length === 1 && 
      (playContext.type === "homepage" || playContext.type === "search")
    ) {
      let isMounted = true;
      const fetchRadio = async () => {
        try {
          // Search for tracks by the same artist to simulate radio
          const results = await searchTracks(currentTrack.artist);
          if (isMounted) {
            const radioTracks = results.filter((t) => t.id !== currentTrack.id);
            if (radioTracks.length > 0) {
              usePlayerStore.getState().appendQueue(radioTracks);
            }
          }
        } catch (err) {
          console.error("Failed to fetch radio tracks:", err);
        }
      };

      fetchRadio();

      return () => {
        isMounted = false;
      };
    }
  }, [currentTrack?.id, queue.length, playContext.type]);

  // Handle Play/Pause State
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;

    if (isPlaying && audio.paused && hasInteracted) {
      audio.play().catch((err) => {
        console.warn("Play prevented:", err.message);
        setIsPlaying(false);
      });
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, isReady, hasInteracted]);

  // Handle Metadata (Duration)
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      // Sync duration to store if not already present
      // Current Track usually has duration from API, but we use audio element as source of truth for seeking
    }
  };

  // Sync Audio Progress to State
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  // Handle End of Track
  const handleEnded = () => {
    next();
  };

  // Handle Buffering States
  const handleCanPlay = () => {
    setIsBuffering(false);
    setIsReady(true);
    
    // If it was playing, resume
    if (isPlaying && hasInteracted) {
      audioRef.current?.play().catch(() => {});
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setIsBuffering(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  // Error Handling & Recovery
  const handleError = (e: any) => {
    const audio = audioRef.current;
    
    if (retryCountRef.current < 4) {
      retryCountRef.current += 1;
      const delay = retryCountRef.current * 2000; // 2s, 4s, 6s, 8s
      console.warn(`Audio error on ${audio?.src}. Retry ${retryCountRef.current}/4 in ${delay/1000}s...`);
      
      setIsBuffering(true);
      setTimeout(() => {
        if (audioRef.current && prevTrackIdRef.current === currentTrack?.id) {
          audioRef.current.load();
        }
      }, delay);
    } else {
      console.error(`Audio failed permanently for ${audio?.src}. Skipping...`);
      next(); // Skip to next if all retries fail
    }
  };

  // Volume Control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  // Mark user interaction on any click within the player
  const handleUserInteraction = () => {
    if (!hasInteracted) setHasInteracted();
  };

  // Pre-fetching Next Track Logic
  const lastPrefetchedId = useRef<string | null>(null);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || queue.length <= 1) return;

    // We pre-fetch when there's less than 30 seconds left
    const remainingTime = audio.duration - audio.currentTime;
    
    if (remainingTime > 0 && remainingTime < 30) {
      // Determine the next track ID based on store logic
      let nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === "all") nextIndex = 0;
        else return; // No next track
      }
      
      const nextTrack = queue[nextIndex];
      if (nextTrack && nextTrack.id !== lastPrefetchedId.current) {
        lastPrefetchedId.current = nextTrack.id;
        console.log(`[Player] Pre-fetching next track: ${nextTrack.title} (${nextTrack.id})`);
        
        // Background fetch to populate server cache
        fetch(`/api/music/stream?id=${nextTrack.id}`).catch(() => {
          // Ignore errors, we're just warming the cache
        });
      }
    }
  }, [progress, currentIndex, queue.length, repeatMode]);

  if (!currentTrack) return null;

  const duration = currentTrack.duration > 0 ? currentTrack.duration : audioRef.current?.duration || 0;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      onClick={handleUserInteraction}
      className="fixed bottom-0 left-0 right-0 h-[4.5rem] md:h-24 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 flex items-center justify-between px-3 md:px-6 z-50"
    >
      {/* Invisible Audio Element */}
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
      />

      {/* Track Info */}
      <div className="flex items-center gap-3 md:gap-4 w-auto md:w-1/3 min-w-0 md:min-w-[200px] flex-shrink overflow-hidden">
        <img
          src={currentTrack.cover_image}
          alt={currentTrack.title}
          className="w-10 h-10 md:w-14 md:h-14 rounded-md object-cover shadow-md flex-shrink-0"
        />
        <div className="flex flex-col overflow-hidden min-w-0">
          <span className="text-white font-medium text-sm md:text-base truncate">{currentTrack.title}</span>
          <span className="text-neutral-400 text-xs md:text-sm truncate">{currentTrack.artist}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center justify-center flex-1 md:w-1/3 md:max-w-2xl gap-1 md:gap-2 mx-2 md:mx-0">
        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={toggleShuffle} 
            className={cn("transition hidden sm:block", isShuffled ? "text-cyan-500" : "text-neutral-400 hover:text-white")}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button onClick={previous} className="text-neutral-400 hover:text-white transition">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={() => {
              setHasInteracted();
              if (isReady || isPlaying) togglePlay();
            }}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition active:scale-95"
            disabled={isBuffering && !isReady}
          >
            {isBuffering && !isReady ? (
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            ) : (
              <Play className="w-4 h-4 md:w-5 md:h-5 fill-current ml-0.5" />
            )}
          </button>

          <button onClick={next} className="text-neutral-400 hover:text-white transition">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button 
            onClick={() => {
              if (repeatMode === "none") setRepeatMode("all");
              else if (repeatMode === "all") setRepeatMode("one");
              else setRepeatMode("none");
            }} 
            className={cn("transition hidden sm:block", repeatMode !== "none" ? "text-cyan-500" : "text-neutral-400 hover:text-white")}
          >
            {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="hidden md:flex items-center w-full gap-2 text-xs text-neutral-400">
          <span className="w-10 text-right">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={handleSeek}
            className="w-full h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-white hover:accent-cyan-400 transition"
          />
          <span className="w-10">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Extras (Volume) — Hidden on mobile */}
      <div className="hidden md:flex items-center justify-end w-1/3 gap-3 min-w-[200px]">
        <button
          onClick={() => setRightPanelMode(rightPanelMode === "now-playing" ? "closed" : "now-playing")}
          className={cn("transition mr-2 hidden lg:block", rightPanelMode === "now-playing" ? "text-cyan-500" : "text-neutral-400 hover:text-white")}
          title="Now Playing View"
        >
          <PlaySquare className="w-5 h-5" />
        </button>
        <button
          onClick={toggleLyrics}
          className={cn("transition mr-2 hidden md:block", isLyricsVisible ? "text-cyan-500" : "text-neutral-400 hover:text-white")}
          title="Lyrics"
        >
          <Mic2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => setRightPanelMode(rightPanelMode === "queue" ? "closed" : "queue")}
          className={cn("transition mr-2 hidden lg:block", rightPanelMode === "queue" ? "text-cyan-500" : "text-neutral-400 hover:text-white")}
          title="Queue"
        >
          <ListMusic className="w-5 h-5" />
        </button>
        <button
          onClick={() => setVolume(volume === 0 ? 1 : 0)}
          className="text-neutral-400 hover:text-white transition"
        >
          {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-24 h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-white"
        />
      </div>
    </div>
  );
}
