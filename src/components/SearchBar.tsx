"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { searchTracks, Track } from "@/lib/api";
import { TrackCard } from "./TrackCard";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setHasSearched(true);
      
      try {
        const tracks = await searchTracks(query, abortController.signal);
        setResults(tracks);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Search failed:", error);
          setResults([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [query]);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-neutral-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to listen to?"
          className="w-full bg-neutral-800/80 border border-neutral-700 text-white rounded-full py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition shadow-lg"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="w-full">
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <div className="text-center py-12 text-neutral-400">
            <h3 className="text-xl font-medium text-white mb-2">No results found</h3>
            <p>Please make sure your words are spelled correctly or use fewer or different keywords.</p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Top Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {results.map((track) => (
                <TrackCard key={track.id} track={track} contextQueue={results} contextType="search" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
