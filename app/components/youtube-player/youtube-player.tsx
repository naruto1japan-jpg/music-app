import React from 'react';
import styles from './youtube-player.module.css';

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
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

export function YouTubePlayer({ videoId, isPlaying, onReady, onStateChange, onTimeUpdate }: YouTubePlayerProps) {
  const playerRef = React.useRef<any>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const timeUpdateIntervalRef = React.useRef<number | null>(null);

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
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            console.log('YouTube player ready');
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

  return <div ref={containerRef} className={styles.player} />;
}
