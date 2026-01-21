import React from "react";
import type { Track } from "~/data/music";
import { mockTracks } from "~/data/music";
import { extractColorsFromImage, createGradientCSS, type DominantColors } from "~/utils/color-extractor";
import { YouTubePlayer } from "~/components/youtube-player/youtube-player";
import { toast } from "~/hooks/use-toast";

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
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  queue: Track[];
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  isDrivingMode: boolean;
  toggleDrivingMode: () => void;
  lastPlayed: Track[];
  autoQueue: boolean;
  toggleAutoQueue: () => void;
  audioQuality: 'small' | 'medium' | 'large' | 'hd720' | 'hd1080' | 'highres';
  setAudioQuality: (quality: 'small' | 'medium' | 'large' | 'hd720' | 'hd1080' | 'highres') => void;
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
  youtubeVideoId?: string;
  featured?: boolean;
}

const MusicContext = React.createContext<MusicContextType | null>(null);

const STORAGE_KEY = 'harmony-flow-tracks';
const DELETED_TRACKS_KEY = 'harmony-flow-deleted-tracks';
const LAST_PLAYED_KEY = 'harmony-flow-last-played';
const AUTO_QUEUE_KEY = 'harmony-flow-auto-queue';
const AUDIO_QUALITY_KEY = 'harmony-flow-audio-quality';
const SAVE_KEY = 'last_video_id';
const TIME_KEY = 'last_timestamp';
// Pre-populate mock track IDs at module level
const MOCK_TRACK_IDS = new Set<string>(mockTracks.map(t => t.id));

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = React.useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isRepeat, setIsRepeat] = React.useState(false);
  const [isShuffle, setIsShuffle] = React.useState(false);
  const [backgroundGradient, setBackgroundGradient] = React.useState<string>(
    'radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 50%)'
  );
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [deletedTrackIds, setDeletedTrackIds] = React.useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = React.useState<string | null>(null);
  const youtubePlayerRef = React.useRef<any>(null);
  const [queue, setQueue] = React.useState<Track[]>([]);
  const [isDrivingMode, setIsDrivingMode] = React.useState(false);
  const [lastPlayed, setLastPlayed] = React.useState<Track[]>([]);
  const [autoQueue, setAutoQueue] = React.useState(true);
  const [audioQuality, setAudioQualityState] = React.useState<'small' | 'medium' | 'large' | 'hd720' | 'hd1080' | 'highres'>('hd720');
  const genrePreferenceRef = React.useRef<Map<string, number>>(new Map());

  // Initialize audio element
  React.useEffect(() => {
    audioRef.current = new Audio();
    
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      if (!youtubeVideoId) {
        setCurrentTime(audio.currentTime);
      }
    };
    
    const handleLoadedMetadata = () => {
      if (!youtubeVideoId) {
        setDuration(audio.duration);
      }
    };
    
    const handleDurationChange = () => {
      if (!youtubeVideoId) {
        setDuration(audio.duration);
      }
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('durationchange', handleDurationChange);
        audioRef.current = null;
      }
    };
  }, [youtubeVideoId]);

  // Load tracks and deleted track IDs from localStorage on mount
  React.useEffect(() => {
    const loadTracks = async () => {
      try {
        // Load deleted track IDs
        const deletedIds = localStorage.getItem(DELETED_TRACKS_KEY);
        const deletedSet = new Set<string>(deletedIds ? JSON.parse(deletedIds) : []);
        setDeletedTrackIds(deletedSet);
        console.log('Loaded deleted track IDs:', Array.from(deletedSet));

        // Load last played tracks
        const lastPlayedData = localStorage.getItem(LAST_PLAYED_KEY);
        if (lastPlayedData) {
          const serializedLastPlayed: SerializedTrack[] = JSON.parse(lastPlayedData);
          const deserializedLastPlayed: Track[] = await Promise.all(
            serializedLastPlayed.map(async (track) => {
              const result: Track = { ...track };
              if (track.coverDataUrl) {
                result.coverUrl = track.coverDataUrl;
              }
              if (track.audioDataUrl) {
                result.audioUrl = track.audioDataUrl;
              }
              return result;
            })
          );
          setLastPlayed(deserializedLastPlayed);
          
          // Build genre preference from last played
          deserializedLastPlayed.forEach((track, index) => {
            const weight = deserializedLastPlayed.length - index; // Recent = higher weight
            const currentWeight = genrePreferenceRef.current.get(track.genre) || 0;
            genrePreferenceRef.current.set(track.genre, currentWeight + weight);
          });
        }
        
        // Load auto queue preference
        const autoQueueData = localStorage.getItem(AUTO_QUEUE_KEY);
        if (autoQueueData !== null) {
          setAutoQueue(JSON.parse(autoQueueData));
        }

        // Load audio quality preference
        const qualityData = localStorage.getItem(AUDIO_QUALITY_KEY);
        if (qualityData !== null) {
          setAudioQualityState(JSON.parse(qualityData));
        }

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          console.log('Loading tracks from localStorage...');
          const serializedTracks: SerializedTrack[] = JSON.parse(stored);
          console.log('Found', serializedTracks.length, 'stored tracks');
          
          const deserializedTracks: Track[] = await Promise.all(
            serializedTracks.map(async (track) => {
              console.log('Deserializing track:', track.title, '- Has audioDataUrl:', !!track.audioDataUrl, '- Has youtubeVideoId:', !!track.youtubeVideoId);
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
          
          // Filter out deleted mock tracks
          const activeMockTracks = mockTracks.filter(t => !deletedSet.has(t.id));
          console.log('Active mock tracks:', activeMockTracks.length, '(', mockTracks.length - activeMockTracks.length, 'deleted)');
          
          // User tracks first, then non-deleted mock tracks
          setTracks([...deserializedTracks, ...activeMockTracks]);
        } else {
          console.log('No stored tracks found, using mock tracks only');
          const activeMockTracks = mockTracks.filter(t => !deletedSet.has(t.id));
          setTracks([...activeMockTracks]);
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
              youtubeVideoId: track.youtubeVideoId,
              featured: track.featured,
            };

            // Don't serialize audio files for YouTube tracks
            if (track.youtubeVideoId) {
              return serialized;
            }

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
    console.log('playTrack called:', track.title, 'YouTube ID:', track.youtubeVideoId);
    
    // Stop current playback first
    if (youtubeVideoId && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);

    // Update last played and genre preferences
    setLastPlayed(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 10); // Keep last 10 tracks
      
      // Update genre preferences
      const currentWeight = genrePreferenceRef.current.get(track.genre) || 0;
      genrePreferenceRef.current.set(track.genre, currentWeight + 10);
      
      // Save to localStorage
      const serialized = updated.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        genre: t.genre,
        duration: t.duration,
        coverUrl: t.coverUrl,
        audioUrl: t.audioUrl,
        youtubeVideoId: t.youtubeVideoId,
        featured: t.featured,
        coverDataUrl: t.coverUrl,
        audioDataUrl: t.audioUrl,
      }));
      localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(serialized));
      return updated;
    });

    // Extract colors and update background with theme color matching
    const coverUrl = track.coverUrl;
    if (coverUrl) {
      try {
        const colors = await extractColorsFromImage(coverUrl);
        const gradient = createGradientCSS(colors);
        setBackgroundGradient(gradient);
        
        // Apply theme colors to root for global access
        document.documentElement.style.setProperty('--theme-primary', colors.primary);
        document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
        document.documentElement.style.setProperty('--theme-accent', colors.accent);
      } catch (error) {
        console.error('Failed to extract colors:', error);
      }
    }

    // Play audio or video
    if (track.youtubeVideoId) {
      // YouTube track - set videoId first, then update state
      console.log('Setting YouTube video ID:', track.youtubeVideoId);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setYoutubeVideoId(track.youtubeVideoId!);
      setDuration(track.duration);
    } else {
      // Regular audio track
      setYoutubeVideoId(null);
      if (audioRef.current) {
        const audioUrl = track.audioUrl;
        if (audioUrl) {
          console.log('Playing audio from:', audioUrl.substring(0, 50) + '...');
          audioRef.current.src = audioUrl;
          try {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              await playPromise;
              console.log('Audio playback started successfully');
            }
          } catch (err) {
            console.error('Playback error (likely autoplay restriction):', err);
            // Show user notification that they need to interact
            alert('Click OK to start playback');
            try {
              await audioRef.current.play();
            } catch (retryErr) {
              console.error('Retry failed:', retryErr);
            }
          }
        } else {
          console.error('No audio URL available for track:', track.title);
        }
      }
    }
  }, [youtubeVideoId]);

  const pauseTrack = React.useCallback(() => {
    console.log('pauseTrack called');
    setIsPlaying(false);
    // Audio element will pause automatically via useEffect
  }, []);

  const resumeTrack = React.useCallback(() => {
    console.log('resumeTrack called');
    if (currentTrack) {
      setIsPlaying(true);
      // YouTube player will resume automatically via useEffect
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
    const isMockTrack = MOCK_TRACK_IDS.has(id);
    console.log('Deleting track:', id, 'Is mock track:', isMockTrack);
    
    // If deleting current track, stop playback
    if (currentTrack?.id === id) {
      setCurrentTrack(null);
      setIsPlaying(false);
      setYoutubeVideoId(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }
    
    // If it's a mock track, add to deleted IDs
    if (isMockTrack) {
      setDeletedTrackIds(prev => {
        const newSet = new Set(prev);
        newSet.add(id);
        // Save deleted IDs to localStorage
        localStorage.setItem(DELETED_TRACKS_KEY, JSON.stringify(Array.from(newSet)));
        console.log('Added to deleted IDs:', id);
        return newSet;
      });
    }
    
    setTracks((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      console.log('Tracks before deletion:', prev.length, 'After deletion:', filtered.length);
      return filtered;
    });
  }, [currentTrack]);

  const seek = React.useCallback((time: number) => {
    setCurrentTime(time);
    if (youtubeVideoId && youtubePlayerRef.current) {
      try {
        youtubePlayerRef.current.seekTo(time, true);
      } catch (error) {
        console.error('Error seeking YouTube player:', error);
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, [youtubeVideoId]);

  // Get smart recommendation based on genre preferences
  const getSmartRecommendation = React.useCallback(() => {
    if (tracks.length === 0) return null;
    
    // Get sorted genres by preference
    const sortedGenres = Array.from(genrePreferenceRef.current.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre);
    
    // Filter out already played tracks and current track
    const playedIds = new Set([...lastPlayed.map(t => t.id), currentTrack?.id]);
    const availableTracks = tracks.filter(t => !playedIds.has(t.id));
    
    if (availableTracks.length === 0) {
      // All tracks played, reset and use all tracks
      return tracks[Math.floor(Math.random() * tracks.length)];
    }
    
    // Try to find a track from preferred genres
    for (const genre of sortedGenres) {
      const genreTracks = availableTracks.filter(t => t.genre === genre);
      if (genreTracks.length > 0) {
        return genreTracks[Math.floor(Math.random() * genreTracks.length)];
      }
    }
    
    // Fallback to random available track
    return availableTracks[Math.floor(Math.random() * availableTracks.length)];
  }, [tracks, lastPlayed, currentTrack]);

  // Auto-fill queue with smart recommendations
  const autoFillQueue = React.useCallback(() => {
    if (!autoQueue || tracks.length === 0) return;
    
    // Get sorted genres by preference
    const sortedGenres = Array.from(genrePreferenceRef.current.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre);
    
    // Filter out already queued tracks and current track
    const queuedIds = new Set([...queue.map(t => t.id), currentTrack?.id]);
    const playedIds = new Set(lastPlayed.map(t => t.id));
    
    // Prefer unplayed tracks from favorite genres
    const availableTracks = tracks.filter(t => !queuedIds.has(t.id));
    const suggestions: Track[] = [];
    
    // Try to add 2 tracks from preferred genres
    for (const genre of sortedGenres) {
      const genreTracks = availableTracks.filter(t => 
        t.genre === genre && !playedIds.has(t.id) && !suggestions.some(s => s.id === t.id)
      );
      
      if (genreTracks.length > 0) {
        suggestions.push(genreTracks[Math.floor(Math.random() * genreTracks.length)]);
        if (suggestions.length >= 2) break;
      }
    }
    
    // If we don't have enough suggestions, add random tracks
    if (suggestions.length < 2) {
      const remainingTracks = availableTracks.filter(t => !suggestions.some(s => s.id === t.id));
      while (suggestions.length < 2 && remainingTracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * remainingTracks.length);
        suggestions.push(remainingTracks[randomIndex]);
        remainingTracks.splice(randomIndex, 1);
      }
    }
    
    if (suggestions.length > 0) {
      setQueue(prev => [...prev, ...suggestions]);
      const genreText = sortedGenres[0] ? ` based on your love for ${sortedGenres[0]}` : '';
      toast({
        title: "Smart Queue Active",
        description: `Added ${suggestions.length} song${suggestions.length > 1 ? 's' : ''} to queue${genreText}`,
      });
      console.log(`Smart Queue: Added ${suggestions.length} suggestions based on your preferences`);
    }
  }, [autoQueue, tracks, queue, currentTrack, lastPlayed]);

  const nextTrack = React.useCallback(() => {
    console.log('nextTrack called - queue length:', queue.length);
    
    // PRIORITY 1: Play from queue if songs are queued
    if (queue.length > 0) {
      const nextTrack = queue[0];
      console.log('Playing next song from queue:', nextTrack.title);
      setQueue(prev => prev.slice(1)); // Remove the first song from queue
      playTrack(nextTrack);
      
      // SPOTIFY MAGIC: If queue is running low (1 song left), auto-generate more!
      if (queue.length <= 1 && autoQueue) {
        console.log('Queue running low, auto-filling...');
        setTimeout(() => autoFillQueue(), 500);
      }
      return;
    }
    
    if (!currentTrack || tracks.length === 0) {
      console.log('No current track or no tracks available');
      return;
    }
    
    // PRIORITY 2: Auto-queue enabled - smart recommendation
    if (autoQueue) {
      const recommendation = getSmartRecommendation();
      if (recommendation) {
        console.log('Playing smart recommendation:', recommendation.title);
        playTrack(recommendation);
        // Auto-fill queue after playing recommendation
        setTimeout(() => autoFillQueue(), 500);
        return;
      }
    }
    
    // PRIORITY 3: Manual mode or fallback - sequential/shuffle
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    let nextIndex;
    
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentIndex + 1) % tracks.length;
    }
    
    console.log('Playing track at index:', nextIndex);
    playTrack(tracks[nextIndex]);
  }, [currentTrack, tracks, isShuffle, playTrack, queue, autoQueue, getSmartRecommendation, autoFillQueue]);

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

  const addToQueue = React.useCallback((track: Track) => {
    // Check if track is already in queue
    const isAlreadyInQueue = queue.some(t => t.id === track.id);
    
    if (isAlreadyInQueue) {
      toast({
        title: "Already in Queue",
        description: `${track.title} is already queued`,
      });
      console.log('Track already in queue:', track.title);
      return;
    }
    
    setQueue(prev => [...prev, track]);
    console.log('Added to queue:', track.title, 'New queue length:', queue.length + 1);
    toast({
      title: "Added to Queue",
      description: `${track.title} by ${track.artist}`,
    });
  }, [queue]);

  const removeFromQueue = React.useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearQueue = React.useCallback(() => {
    setQueue([]);
  }, []);

  const toggleDrivingMode = React.useCallback(() => {
    setIsDrivingMode(prev => {
      const newMode = !prev;
      if (newMode) {
        // When enabling driving mode, find and play phonk music from YouTube
        const phonkTracks = tracks.filter(t => 
          t.genre.toLowerCase().includes('phonk') || 
          t.title.toLowerCase().includes('phonk') ||
          t.artist.toLowerCase().includes('phonk')
        );
        
        if (phonkTracks.length > 0) {
          // Play a random phonk track
          const randomPhonk = phonkTracks[Math.floor(Math.random() * phonkTracks.length)];
          playTrack(randomPhonk);
        } else {
          // If no phonk tracks, create a temporary one with a popular phonk video
          const drivingPhonk: Track = {
            id: 'driving-phonk-temp',
            title: 'SHADOWBOXING - Phonk',
            artist: 'KXNVRA',
            album: 'Driving Mode',
            genre: 'Phonk',
            duration: 180,
            coverUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop',
            youtubeVideoId: 'LGfuScqWPLk',
          };
          playTrack(drivingPhonk);
        }
      }
      return newMode;
    });
  }, [tracks, playTrack]);

  const toggleAutoQueue = React.useCallback(() => {
    setAutoQueue(prev => {
      const newValue = !prev;
      localStorage.setItem(AUTO_QUEUE_KEY, JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  const setAudioQuality = React.useCallback((quality: 'small' | 'medium' | 'large' | 'hd720' | 'hd1080' | 'highres') => {
    setAudioQualityState(quality);
    localStorage.setItem(AUDIO_QUALITY_KEY, JSON.stringify(quality));
    toast({
      title: "Audio Quality Updated",
      description: `Quality set to ${quality.toUpperCase()}`,
    });
  }, []);

  // Handle regular audio track end
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || youtubeVideoId) return;

    const handleEnded = () => {
      console.log('Audio track ended');
      if (isRepeat) {
        console.log('Repeating current track');
        audio.currentTime = 0;
        audio.play().catch(err => console.error('Playback error:', err));
      } else {
        console.log('Moving to next track');
        nextTrack();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [isRepeat, nextTrack, youtubeVideoId]);

  // Handle play/pause for audio element
  React.useEffect(() => {
    if (youtubeVideoId || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(err => console.error('Playback error:', err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, youtubeVideoId]);

  const handleYouTubeTimeUpdate = React.useCallback((currentTime: number, duration: number) => {
    setCurrentTime(currentTime);
    setDuration(duration);
  }, []);

  const handleYouTubeStateChange = React.useCallback((state: number) => {
    // 0 = ended, 1 = playing, 2 = paused
    console.log('YouTube state changed:', state);
    if (state === 0) {
      // Track ended
      console.log('YouTube track ended');
      if (isRepeat) {
        console.log('Repeating current track');
        setCurrentTime(0);
        setIsPlaying(true);
      } else {
        console.log('Moving to next track from queue or playlist');
        nextTrack();
      }
    }
  }, [isRepeat, nextTrack]);

  const handleYouTubePlayerReady = React.useCallback((player: any) => {
    youtubePlayerRef.current = player;
  }, []);

  // Auto-save progress every 2 seconds for crash recovery
  React.useEffect(() => {
    const saveInterval = setInterval(() => {
      if (isPlaying && currentTrack) {
        if (currentTrack.youtubeVideoId) {
          localStorage.setItem(SAVE_KEY, currentTrack.youtubeVideoId);
          localStorage.setItem(TIME_KEY, currentTime.toString());
        }
      }
    }, 2000);

    return () => clearInterval(saveInterval);
  }, [isPlaying, currentTrack, currentTime]);

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
      audioRef,
      currentTime,
      duration,
      seek,
      queue,
      addToQueue,
      removeFromQueue,
      clearQueue,
      isDrivingMode,
      toggleDrivingMode,
      lastPlayed,
      autoQueue,
      toggleAutoQueue,
      audioQuality,
      setAudioQuality,
    }),
    [currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack, togglePlayPause, nextTrack, previousTrack, toggleRepeat, toggleShuffle, isRepeat, isShuffle, backgroundGradient, tracks, addTrack, deleteTrack, currentTime, duration, seek, queue, addToQueue, removeFromQueue, clearQueue, isDrivingMode, toggleDrivingMode, lastPlayed, autoQueue, toggleAutoQueue, audioQuality, setAudioQuality],
  );

  return (
    <MusicContext.Provider value={value}>
      {children}
      {youtubeVideoId && (
        <YouTubePlayer
          key={youtubeVideoId}
          videoId={youtubeVideoId}
          isPlaying={isPlaying}
          onTimeUpdate={handleYouTubeTimeUpdate}
          onStateChange={handleYouTubeStateChange}
          onPlayerReady={handleYouTubePlayerReady}
          quality={audioQuality}
        />
      )}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = React.useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
