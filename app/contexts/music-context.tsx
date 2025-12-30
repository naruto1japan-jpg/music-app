import React from "react";
import type { Track } from "~/data/music";
import { extractColorsFromImage, createGradientCSS, type DominantColors } from "~/utils/color-extractor";

interface MusicContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  togglePlayPause: () => void;
  backgroundGradient: string;
  tracks: Track[];
  addTrack: (track: Track) => void;
  deleteTrack: (id: string) => void;
}

const MusicContext = React.createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = React.useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [backgroundGradient, setBackgroundGradient] = React.useState<string>(
    'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)'
  );
  const [tracks, setTracks] = React.useState<Track[]>([]);
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

  const deleteTrack = React.useCallback((id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = React.useMemo(
    () => ({
      currentTrack,
      isPlaying,
      playTrack,
      pauseTrack,
      resumeTrack,
      togglePlayPause,
      backgroundGradient,
      tracks,
      addTrack,
      deleteTrack,
    }),
    [currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack, togglePlayPause, backgroundGradient, tracks, addTrack, deleteTrack],
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
