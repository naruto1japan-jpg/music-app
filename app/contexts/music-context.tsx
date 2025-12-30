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
const MOCK_TRACK_IDS = new Set<string>();

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

  // Track mock track IDs on mount
  React.useEffect(() => {
    mockTracks.forEach(track => MOCK_TRACK_IDS.add(track.id));
  }, []);

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
          console.log('Loading tracks from localStorage...');
          const serializedTracks: SerializedTrack[] = JSON.parse(stored);
          console.log('Found', serializedTracks.length, 'stored tracks');
          
          const deserializedTracks: Track[] = await Promise.all(
            serializedTracks.map(async (track) => {
              console.log('Deserializing track:', track.title, '- Has audioDataUrl:', !!track.audioDataUrl);
              const result: Track = {
                ...track,
              };

              // Use data URLs directly as coverUrl and audioUrl
              if (track.coverDataUrl) {
                result.coverUrl = track.coverDataUrl;
                const blob = await fetch(track.coverDataUrl).then(r => r.blob());
                result.coverFile = new File([blob], 'cover.jpg', { type: blob.type });
              }

              if (track.audioDataUrl) {
                result.audioUrl = track.audioDataUrl;
                const blob = await fetch(track.audioDataUrl).then(r => r.blob());
                result.audioFile = new File([blob], 'audio.mp3', { type: blob.type });
                console.log('Restored audio URL for', track.title);
              }

              return result;
            })
          );
          console.log('Loaded', deserializedTracks.length, 'user tracks');
          // User tracks first, then mock tracks (so user tracks appear at the top)
          setTracks([...deserializedTracks, ...mockTracks]);
        } else {
          console.log('No stored tracks found, using mock tracks only');
          setTracks([...mockTracks]);
        }
      } catch (error) {
        console.error('Failed to load tracks from storage:', error);
        setTracks([...mockTracks]);
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
        // Filter out mock tracks using the Set of IDs
        const userTracks = tracks.filter(t => !MOCK_TRACK_IDS.has(t.id));
        console.log('Saving', userTracks.length, 'user tracks to localStorage');
        
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

            console.log('Serialized track:', track.title, '- Has audio URL:', !!serialized.audioUrl, 'Has audioDataUrl:', !!serialized.audioDataUrl);
            return serialized;
          })
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializedTracks));
        console.log('Tracks saved to localStorage');
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
    const coverUrl = track.coverUrl;
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
      // Use audioUrl directly (it's already a data URL for uploaded tracks)
      const audioUrl = track.audioUrl;
      if (audioUrl) {
        console.log('Playing audio from:', audioUrl.substring(0, 50) + '...');
        audioRef.current.src = audioUrl;
        try {
          await audioRef.current.play();
          console.log('Audio playback started successfully');
        } catch (err) {
          console.error('Playback error:', err);
        }
      } else {
        console.error('No audio URL available for track:', track.title);
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

  const addTrack = React.useCallback(async (track: Track) => {
    // Convert File objects to data URLs immediately
    const newTrack = { ...track };
    
    if (track.coverFile && !track.coverUrl) {
      console.log('Converting cover file to data URL...');
      newTrack.coverUrl = await fileToDataUrl(track.coverFile);
      console.log('Cover data URL created:', newTrack.coverUrl.substring(0, 50));
    }
    
    if (track.audioFile && !track.audioUrl) {
      console.log('Converting audio file to data URL...');
      newTrack.audioUrl = await fileToDataUrl(track.audioFile);
      console.log('Audio data URL created:', newTrack.audioUrl.substring(0, 50));
    }
    
    console.log('Adding track to state:', newTrack.title, 'Has audio URL:', !!newTrack.audioUrl);
    setTracks((prev) => [newTrack, ...prev]);
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
    console.log('Deleting track:', id);
    setTracks((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      console.log('Tracks after deletion:', filtered.length);
      return filtered;
    });
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
