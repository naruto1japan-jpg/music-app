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

export function YouTubePlayer({ videoId, isPlaying, onReady, onStateChange, onTimeUpdate, onPlayerReady }: YouTubePlayerProps) {
  const playerRef = React.useRef<any>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const timeUpdateIntervalRef = React.useRef<number | null>(null);
  const [showUnlock, setShowUnlock] = React.useState(!audioUnlocked);

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
            onReady?.();
          },
          onStateChange: (event: any) => {
            console.log('YouTube player state:', event.data);
            onStateChange?.(event.data);

            if (event.data === YT_STATES.PLAYING) {
              startTimeUpdateInterval();
            } else {
              stopTimeUpdateInterval();
            }
          },
        },
      });
    };

    initPlayer();

    return () => {
      stopTimeUpdateInterval();
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // Handle play/pause from parent
  React.useEffect(() => {
    if (!playerRef.current) return;

    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
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

  const unlockAudio = () => {
    if (playerRef.current) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        audioUnlocked = true;
        setShowUnlock(false);
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
