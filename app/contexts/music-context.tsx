import React from "react";
import type { Track } from "~/data/music";
import { mockTracks } from "~/data/music";
import { extractColorsFromImage, createGradientCSS, type DominantColors } from "~/utils/color-extractor";

interface MusicContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  isRepeat: boolean;
  isShuffle: boolean;
  backgroundGradient: string;
  tracks: Track[];
  addTrack: (track: Track) => void;
  deleteTrack: (id: string) => void;
}

interface SerializedTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  coverDataUrl?: string;
  audioDataUrl?: string;
  coverUrl?: string;
  audioUrl?: string;
  gaanaTrackId?: string;
  featured?: boolean;
}

const MusicContext = React.createContext<MusicContextType | null>(null);

const STORAGE_KEY = 'harmony-flow-tracks';

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = React.useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isRepeat, setIsRepeat] = React.useState(false);
  const [isShuffle, setIsShuffle] = React.useState(false);
  const [backgroundGradient, setBackgroundGradient] = React.useState<string>(
    'radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 50%)'
  );
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  React.useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Load tracks from localStorage on mount
  React.useEffect(() => {
    const loadTracks = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const serializedTracks: SerializedTrack[] = JSON.parse(stored);
          const deserializedTracks: Track[] = await Promise.all(
            serializedTracks.map(async (track) => {
              const result: Track = {
                ...track,
              };

              // Convert data URLs back to File objects
              if (track.coverDataUrl) {
                const blob = await fetch(track.coverDataUrl).then(r => r.blob());
                result.coverFile = new File([blob], 'cover.jpg', { type: blob.type });
              }

              if (track.audioDataUrl) {
                const blob = await fetch(track.audioDataUrl).then(r => r.blob());
                result.audioFile = new File([blob], 'audio.mp3', { type: blob.type });
              }

              return result;
            })
          );
          setTracks([...deserializedTracks, ...mockTracks]);
        } else {
          setTracks(mockTracks);
        }
      } catch (error) {
        console.error('Failed to load tracks from storage:', error);
        setTracks(mockTracks);
      }
      setIsLoaded(true);
    };

    loadTracks();
  }, []);

  // Save tracks to localStorage whenever they change
  React.useEffect(() => {
    if (!isLoaded) return;

    const saveTracks = async () => {
      try {
        // Filter out mock tracks and serialize user-added tracks
        const userTracks = tracks.filter(t => !mockTracks.find(mt => mt.id === t.id));
        const serializedTracks: SerializedTrack[] = await Promise.all(
          userTracks.map(async (track) => {
            const serialized: SerializedTrack = {
              id: track.id,
              title: track.title,
              artist: track.artist,
              album: track.album,
              genre: track.genre,
              duration: track.duration,
              coverUrl: track.coverUrl,
              audioUrl: track.audioUrl,
              gaanaTrackId: track.gaanaTrackId,
              featured: track.featured,
            };

            // Convert File objects to data URLs for storage
            if (track.coverFile) {
              serialized.coverDataUrl = await fileToDataUrl(track.coverFile);
            }

            if (track.audioFile) {
              serialized.audioDataUrl = await fileToDataUrl(track.audioFile);
            }

            return serialized;
          })
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedTracks));
      } catch (error) {
        console.error('Failed to save tracks to storage:', error);
      }
    };

    saveTracks();
  }, [tracks, isLoaded]);

  const playTrack = React.useCallback(async (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);

    // Extract colors and update background
    const coverUrl = track.coverUrl || (track.coverFile ? URL.createObjectURL(track.coverFile) : '');
    if (coverUrl) {
      try {
        const colors = await extractColorsFromImage(coverUrl);
        const gradient = createGradientCSS(colors);
        setBackgroundGradient(gradient);
      } catch (error) {
        console.error('Failed to extract colors:', error);
      }
    }

    // Play audio
    if (audioRef.current) {
      const audioUrl = track.audioUrl || (track.audioFile ? URL.createObjectURL(track.audioFile) : '');
      if (audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(err => console.error('Playback error:', err));
      }
    }
  }, []);

  const pauseTrack = React.useCallback(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const resumeTrack = React.useCallback(() => {
    if (currentTrack) {
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play().catch(err => console.error('Playback error:', err));
      }
    }
  }, [currentTrack]);

  const togglePlayPause = React.useCallback(() => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  }, [isPlaying, pauseTrack, resumeTrack]);

  const addTrack = React.useCallback((track: Track) => {
    setTracks((prev) => [track, ...prev]);
  }, []);

  // Helper function to convert File to data URL
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const deleteTrack = React.useCallback((id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const nextTrack = React.useCallback(() => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    let nextIndex;
    
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentIndex + 1) % tracks.length;
    }
    
    playTrack(tracks[nextIndex]);
  }, [currentTrack, tracks, isShuffle, playTrack]);

  const previousTrack = React.useCallback(() => {
    if (!currentTrack || tracks.length === 0) return;
    
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    let prevIndex;
    
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * tracks.length);
    } else {
      prevIndex = currentIndex - 1 < 0 ? tracks.length - 1 : currentIndex - 1;
    }
    
    playTrack(tracks[prevIndex]);
  }, [currentTrack, tracks, isShuffle, playTrack]);

  const toggleRepeat = React.useCallback(() => {
    setIsRepeat(prev => !prev);
  }, []);

  const toggleShuffle = React.useCallback(() => {
    setIsShuffle(prev => !prev);
  }, []);

  // Handle track end
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(err => console.error('Playback error:', err));
      } else {
        nextTrack();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [isRepeat, nextTrack]);

  const value = React.useMemo(
    () => ({
      currentTrack,
      isPlaying,
      playTrack,
      pauseTrack,
      resumeTrack,
      togglePlayPause,
      nextTrack,
      previousTrack,
      toggleRepeat,
      toggleShuffle,
      isRepeat,
      isShuffle,
      backgroundGradient,
      tracks,
      addTrack,
      deleteTrack,
    }),
    [currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack, togglePlayPause, nextTrack, previousTrack, toggleRepeat, toggleShuffle, isRepeat, isShuffle, backgroundGradient, tracks, addTrack, deleteTrack],
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const context = React.useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
