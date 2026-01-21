import React from 'react';
import styles from './youtube-player.module.css';

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayerReady?: (player: any) => void;
  quality?: 'small' | 'medium' | 'large' | 'hd720' | 'hd1080' | 'highres';
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

// Remove module-level audio unlock tracking - show prompt for each new song

let mediaSession: MediaSession | null = null;

// Initialize Media Session API for background playback control
if ('mediaSession' in navigator) {
  mediaSession = navigator.mediaSession;
}

export function YouTubePlayer({ videoId, isPlaying, onReady, onStateChange, onTimeUpdate, onPlayerReady, quality = 'hd720' }: YouTubePlayerProps) {
  const playerRef = React.useRef<any>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const timeUpdateIntervalRef = React.useRef<number | null>(null);
  const keepAliveIntervalRef = React.useRef<number | null>(null);
  const [showUnlockPrompt, setShowUnlockPrompt] = React.useState(true);
  const hasUserInteractedRef = React.useRef(false); // Track if user has ever interacted

  // Only show unlock prompt for the very first song
  React.useEffect(() => {
    if (!hasUserInteractedRef.current) {
      setShowUnlockPrompt(true);
    } else {
      setShowUnlockPrompt(false);
    }
  }, [videoId]);

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
          // Update Media Session metadata if player is ready
          if (playerRef.current && mediaSession) {
            setupMediaSession(playerRef.current);
          }
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
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying player (safe to ignore):', e);
        }
      }

      // Clear the container before creating new player to prevent child node errors
      if (containerRef.current) {
        try {
          while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
          }
        } catch (e) {
          console.warn('Error clearing container (safe to ignore):', e);
        }
      }

      try {
        playerRef.current = new (window as any).YT.Player(containerRef.current, {
          videoId,
          playerVars: {
            autoplay: 1,
            mute: 1, // Always start muted to comply with browser autoplay policies
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1, // Critical for mobile devices
            enablejsapi: 1,
            rel: 0,
            vq: quality, // Video quality parameter
          },
          events: {
            onReady: (event: any) => {
              console.log('YouTube player ready for videoId:', videoId);
              onPlayerReady?.(event.target);
              setupMediaSession(event.target);
              
              // Auto-unmute if user has already interacted once
              if (hasUserInteractedRef.current) {
                event.target.unMute();
                event.target.setVolume(100);
                console.log('Auto-unmuted new track (user previously interacted)');
              }
              
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
      } catch (e) {
        console.error('Error creating YouTube player:', e);
        // Reload on critical initialization error
        window.location.reload();
      }
    };

    initPlayer();

    return () => {
      stopTimeUpdateInterval();
      stopKeepAlive();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying player on cleanup:', e);
        }
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // Setup Media Session API for background playback controls and Android notification
  const setupMediaSession = (player: any) => {
    if (!mediaSession) return;

    try {
      const videoData = player.getVideoData();
      const currentVideoId = videoData.video_id || videoId;
      const info = videoInfoRef.current;
      const title = info?.title || videoData.title || 'Unknown Track';
      const artist = info?.artist || videoData.author || 'My Music App';

      // Set metadata with optimized artwork sizes for Android notification panel
      mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: artist,
        album: 'YouTube Stream',
        artwork: [
          { 
            src: `https://img.youtube.com/vi/${currentVideoId}/mqdefault.jpg`, 
            sizes: '96x96', 
            type: 'image/jpeg' 
          },
          { 
            src: `https://img.youtube.com/vi/${currentVideoId}/sddefault.jpg`, 
            sizes: '640x480', 
            type: 'image/jpeg' 
          },
        ],
      });

      // Set up action handlers for background controls and notifications
      // These listeners make the notification buttons (Play/Pause) actually work
      mediaSession.setActionHandler('play', () => {
        console.log('Media Session: play action');
        player.playVideo();
      });

      mediaSession.setActionHandler('pause', () => {
        console.log('Media Session: pause action');
        player.pauseVideo();
      });

      mediaSession.setActionHandler('seekbackward', () => {
        console.log('Media Session: seekbackward action');
        const currentTime = player.getCurrentTime();
        player.seekTo(Math.max(0, currentTime - 10), true);
      });

      mediaSession.setActionHandler('seekforward', () => {
        console.log('Media Session: seekforward action');
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        player.seekTo(Math.min(duration, currentTime + 10), true);
      });

      // Optional: Add previous/next track handlers if available
      try {
        mediaSession.setActionHandler('previoustrack', () => {
          console.log('Media Session: previoustrack action');
          // This would be handled by the parent component
        });

        mediaSession.setActionHandler('nexttrack', () => {
          console.log('Media Session: nexttrack action');
          // This would be handled by the parent component
        });
      } catch (error) {
        console.log('Previous/Next track actions not supported');
      }

      console.log('Media Session API initialized with metadata:', { title, artist });
    } catch (error) {
      console.warn('Failed to setup Media Session:', error);
    }
  };

  // Update playback state for Media Session and refresh notification
  const updateMediaSessionState = (state: number) => {
    if (!mediaSession || !playerRef.current) return;

    try {
      if (state === YT_STATES.PLAYING) {
        mediaSession.playbackState = 'playing';
        // Update notification with current song info when playback starts
        setupMediaSession(playerRef.current);
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
    
    keepAliveIntervalRef.current = window.setInterval(() => {
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
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
  };

  const unlockAudio = () => {
    if (playerRef.current) {
      playerRef.current.unMute();
      playerRef.current.setVolume(100);
      setShowUnlockPrompt(false);
      hasUserInteractedRef.current = true; // Remember user interaction
      console.log('Audio unlocked - will auto-unmute future tracks');
    }
  };

  // Function to play a new song with proper audio unlock handling and error recovery
  const playNewSong = (newVideoId: string) => {
    try {
      // Reset the UI button first
      setShowUnlockPrompt(true);

      // Check if player is ready
      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById({
          videoId: newVideoId,
          startSeconds: 0,
          suggestedQuality: quality
        });
        playerRef.current.unMute(); // Unmute since user clicked to play
        playerRef.current.playVideo();
        
        // Hide the 'Unlock Audio' button since user clicked to play a song
        setShowUnlockPrompt(false);
      } else {
        // If the player somehow died, just reload
        // rather than showing the "Oops" error
        console.error('Player not initialized yet.');
        window.location.reload();
      }
    } catch (err) {
      console.warn('Caught a removeChild style error. Resetting player...');
      // If it crashes, a simple page reload is better than the error screen
      window.location.reload();
    }
  };

  // Expose playNewSong function to parent via onPlayerReady
  React.useEffect(() => {
    if (playerRef.current) {
      (playerRef.current as any).playNewSong = playNewSong;
    }
  }, []);

  return (
    <div className={styles.playerWrapper}>
      {showUnlockPrompt && (
        <div className={styles.audioUnlock} onClick={unlockAudio} id="audio-unlock">
          <div className={styles.unlockContent}>
            <h2>Tap to Play</h2>
          </div>
        </div>
      )}
      <div ref={containerRef} className={styles.player} id="player" />
    </div>
  );
}
