import React from 'react';
import styles from './youtube-player.module.css';

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayerReady?: (player: any) => void;
}

// YouTube IFrame Player API states
const YT_STATES = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

let audioUnlocked = false;
let mediaSession: MediaSession | null = null;
let keepAliveInterval: number | null = null;

// Initialize Media Session API for background playback control
if ('mediaSession' in navigator) {
  mediaSession = navigator.mediaSession;
}

export function YouTubePlayer({ videoId, isPlaying, onReady, onStateChange, onTimeUpdate, onPlayerReady }: YouTubePlayerProps) {
  const playerRef = React.useRef<any>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const timeUpdateIntervalRef = React.useRef<number | null>(null);
  const [showUnlock, setShowUnlock] = React.useState(!audioUnlocked);
  const videoInfoRef = React.useRef<{ title: string; artist: string; thumbnail: string } | null>(null);
  const retryCountRef = React.useRef(0);
  const maxRetries = 3;

  // Load YouTube IFrame API
  React.useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        console.log('YouTube IFrame API loaded');
      };
    }
  }, []);

  // Fetch video info for Media Session
  React.useEffect(() => {
    const fetchVideoInfo = async () => {
      try {
        const response = await fetch(
          `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
        );
        if (response.ok) {
          const data = await response.json();
          videoInfoRef.current = {
            title: data.title || 'Unknown Track',
            artist: data.author_name || 'Unknown Artist',
            thumbnail: data.thumbnail_url || '',
          };
        }
      } catch (error) {
        console.warn('Could not fetch video info:', error);
      }
    };
    fetchVideoInfo();
  }, [videoId]);

  // Initialize player when API is ready
  React.useEffect(() => {
    const initPlayer = () => {
      if (!(window as any).YT || !(window as any).YT.Player) {
        setTimeout(initPlayer, 100);
        return;
      }

      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: audioUnlocked ? 0 : 1, // Start muted unless audio is unlocked
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1, // Critical for mobile devices
          enablejsapi: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            console.log('YouTube player ready');
            onPlayerReady?.(event.target);
            setupMediaSession(event.target);
            onReady?.();
          },
          onStateChange: (event: any) => {
            console.log('YouTube player state:', event.data);
            onStateChange?.(event.data);
            updateMediaSessionState(event.data);

            if (event.data === YT_STATES.PLAYING) {
              retryCountRef.current = 0; // Reset retry count on successful playback
              startTimeUpdateInterval();
              startKeepAlive();
            } else if (event.data === YT_STATES.PAUSED) {
              stopTimeUpdateInterval();
              stopKeepAlive();
            } else if (event.data === YT_STATES.BUFFERING) {
              // Handle buffering state - retry if stuck
              setTimeout(() => {
                if (playerRef.current && isPlaying) {
                  const currentState = playerRef.current.getPlayerState();
                  if (currentState === YT_STATES.BUFFERING && retryCountRef.current < maxRetries) {
                    console.log('Stuck in buffering, attempting recovery...');
                    retryCountRef.current++;
                    try {
                      playerRef.current.playVideo();
                    } catch (error) {
                      console.error('Retry failed:', error);
                    }
                  }
                }
              }, 3000); // Wait 3 seconds before retry
            } else {
              stopTimeUpdateInterval();
              stopKeepAlive();
            }
          },
        },
      });
    };

    initPlayer();

    return () => {
      stopTimeUpdateInterval();
      stopKeepAlive();
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // Setup Media Session API for background playback controls
  const setupMediaSession = (player: any) => {
    if (!mediaSession || !videoInfoRef.current) return;

    try {
      const info = videoInfoRef.current;
      mediaSession.metadata = new MediaMetadata({
        title: info.title,
        artist: info.artist,
        artwork: [
          {
            src: info.thumbnail,
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });

      // Set up action handlers for background controls
      mediaSession.setActionHandler('play', () => {
        player.playVideo();
      });

      mediaSession.setActionHandler('pause', () => {
        player.pauseVideo();
      });

      mediaSession.setActionHandler('seekbackward', () => {
        const currentTime = player.getCurrentTime();
        player.seekTo(Math.max(0, currentTime - 10));
      });

      mediaSession.setActionHandler('seekforward', () => {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        player.seekTo(Math.min(duration, currentTime + 10));
      });

      console.log('Media Session API initialized');
    } catch (error) {
      console.warn('Failed to setup Media Session:', error);
    }
  };

  // Update playback state for Media Session
  const updateMediaSessionState = (state: number) => {
    if (!mediaSession) return;

    try {
      if (state === YT_STATES.PLAYING) {
        mediaSession.playbackState = 'playing';
      } else if (state === YT_STATES.PAUSED) {
        mediaSession.playbackState = 'paused';
      } else {
        mediaSession.playbackState = 'none';
      }
    } catch (error) {
      console.warn('Failed to update Media Session state:', error);
    }
  };

  // Handle play/pause from parent
  React.useEffect(() => {
    if (!playerRef.current) return;

    try {
      if (isPlaying) {
        playerRef.current.playVideo();
        startKeepAlive();
      } else {
        playerRef.current.pauseVideo();
        stopKeepAlive();
      }
    } catch (error) {
      console.error('Error controlling YouTube player:', error);
    }
  }, [isPlaying]);

  const startTimeUpdateInterval = () => {
    stopTimeUpdateInterval();
    
    timeUpdateIntervalRef.current = window.setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        onTimeUpdate?.(currentTime, duration);
      }
    }, 1000);
  };

  const stopTimeUpdateInterval = () => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  };

  // Keep-alive mechanism to prevent playback from stopping
  const startKeepAlive = () => {
    stopKeepAlive();
    
    keepAliveInterval = window.setInterval(() => {
      if (playerRef.current && isPlaying) {
        try {
          const state = playerRef.current.getPlayerState();
          
          // If player unexpectedly stopped or paused, try to resume
          if (state !== YT_STATES.PLAYING && state !== YT_STATES.BUFFERING) {
            console.log('Unexpected stop detected, resuming playback...');
            playerRef.current.playVideo();
          }
        } catch (error) {
          console.error('Keep-alive check failed:', error);
        }
      }
    }, 5000); // Check every 5 seconds
  };

  const stopKeepAlive = () => {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  };

  const unlockAudio = () => {
    if (playerRef.current) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        audioUnlocked = true;
        setShowUnlock(false);
        
        // Ensure playback starts after unlocking
        if (isPlaying) {
          playerRef.current.playVideo();
        }
      } catch (error) {
        console.error('Error unlocking audio:', error);
      }
    }
  };

  return (
    <>
      {showUnlock && isPlaying && (
        <div className={styles.audioUnlock} onClick={unlockAudio}>
          <div className={styles.unlockContent}>
            <h3>🔊 Click to Enable Audio</h3>
            <p>Tap here to unmute and start playback</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className={styles.player} />
    </>
  );
}
