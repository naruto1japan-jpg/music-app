import React from "react";
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, ChevronUp, ChevronDown } from "lucide-react";
import { useMusic } from "~/contexts/music-context";
import { extractColorsFromImage, type DominantColors } from "~/utils/color-extractor";
import styles from "./mini-player.module.css";

// YouTube IFrame Player API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function MiniPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlayPause, 
    nextTrack, 
    previousTrack,
    toggleRepeat,
    toggleShuffle,
    isRepeat,
    isShuffle,
    currentTime,
    duration,
    seek
  } = useMusic();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [coverUrl, setCoverUrl] = React.useState<string>('');
  const [dominantColors, setDominantColors] = React.useState<DominantColors | null>(null);
  const [ytPlayer, setYtPlayer] = React.useState<any>(null);
  const [ytCurrentTime, setYtCurrentTime] = React.useState(0);
  const [ytDuration, setYtDuration] = React.useState(0);
  const playerRef = React.useRef<HTMLDivElement>(null);
  const intervalRef = React.useRef<number | null>(null);

  // Load YouTube IFrame API
  React.useEffect(() => {
    if (window.YT) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }, []);

  React.useEffect(() => {
    if (!currentTrack) {
      setCoverUrl('');
      setDominantColors(null);
      return;
    }

    if (currentTrack.coverUrl) {
      setCoverUrl(currentTrack.coverUrl);
      extractColorsFromImage(currentTrack.coverUrl).then(setDominantColors);
    } else if (currentTrack.coverFile) {
      const url = URL.createObjectURL(currentTrack.coverFile);
      setCoverUrl(url);
      extractColorsFromImage(url).then(setDominantColors);
      return () => URL.revokeObjectURL(url);
    }
  }, [currentTrack]);

  // Initialize YouTube player when track changes to YouTube track
  React.useEffect(() => {
    if (!currentTrack?.youtubeVideoId || !window.YT) return;

    const initPlayer = () => {
      // Clean up existing player
      if (ytPlayer) {
        ytPlayer.destroy();
      }

      // Create new player
      const player = new window.YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: currentTrack.youtubeVideoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            console.log('YouTube player ready');
            setYtPlayer(event.target);
            setYtDuration(event.target.getDuration());
            if (isPlaying) {
              event.target.playVideo();
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              nextTrack();
            }
          },
        },
      });
    };

    if (window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentTrack?.youtubeVideoId]);

  // Update YouTube player time
  React.useEffect(() => {
    if (!ytPlayer || !currentTrack?.youtubeVideoId) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(() => {
      if (ytPlayer.getCurrentTime) {
        setYtCurrentTime(ytPlayer.getCurrentTime());
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ytPlayer, currentTrack?.youtubeVideoId]);

  // Control YouTube player playback
  React.useEffect(() => {
    if (!ytPlayer || !currentTrack?.youtubeVideoId) return;

    if (isPlaying) {
      ytPlayer.playVideo?.();
    } else {
      ytPlayer.pauseVideo?.();
    }
  }, [isPlaying, ytPlayer, currentTrack?.youtubeVideoId]);

  if (!currentTrack) {
    return null;
  }

  const isYouTubeTrack = !!currentTrack.youtubeVideoId;
  const displayCurrentTime = isYouTubeTrack ? ytCurrentTime : currentTime;
  const displayDuration = isYouTubeTrack ? ytDuration : duration;

  const getMeshGradientStyle = (): React.CSSProperties => {
    if (!dominantColors) return {};
    
    return {
      background: `
        radial-gradient(circle at 15% 50%, ${dominantColors.primary}40 0%, transparent 40%),
        radial-gradient(circle at 85% 50%, ${dominantColors.secondary}40 0%, transparent 40%),
        radial-gradient(circle at 50% 80%, ${dominantColors.accent}30 0%, transparent 50%),
        rgba(0, 0, 0, 0.9)
      `,
      animation: `${styles.meshFlow} 15s ease-in-out infinite`,
    };
  };

  const getExpandedGradientStyle = (): React.CSSProperties => {
    if (!dominantColors) return {};
    
    return {
      background: `
        radial-gradient(ellipse at 20% 20%, ${dominantColors.primary}50 0%, transparent 50%),
        radial-gradient(ellipse at 80% 30%, ${dominantColors.secondary}50 0%, transparent 50%),
        radial-gradient(ellipse at 50% 70%, ${dominantColors.accent}40 0%, transparent 60%),
        radial-gradient(ellipse at 30% 80%, ${dominantColors.primary}30 0%, transparent 50%),
        rgba(0, 0, 0, 0.95)
      `,
      animation: `${styles.meshFlow} 20s ease-in-out infinite`,
    };
  };

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = displayDuration > 0 ? (displayCurrentTime / displayDuration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * displayDuration;
    
    if (isYouTubeTrack && ytPlayer) {
      ytPlayer.seekTo(newTime, true);
      setYtCurrentTime(newTime);
    } else {
      seek(newTime);
    }
  };

  return (
    <>
      {/* Hidden YouTube player */}
      {isYouTubeTrack && (
        <div style={{ position: 'absolute', left: '-9999px' }}>
          <div id="youtube-player" ref={playerRef}></div>
        </div>
      )}

      {/* Mini Player Bar */}
      <div 
        className={styles.player} 
        onClick={() => setIsExpanded(true)}
        style={getMeshGradientStyle()}
      >
        <div className={styles.container}>
          <div className={styles.trackInfo}>
            <img src={coverUrl} alt={`${currentTrack.title} cover`} className={styles.cover} />
            <div className={styles.details}>
              <h4 className={styles.title}>{currentTrack.title}</h4>
              <p className={styles.artist}>{currentTrack.artist}</p>
            </div>
          </div>
          <div className={styles.controls}>
            <button 
              className={styles.controlButton} 
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }} 
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            <button 
              className={styles.expandButton}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              aria-label="Expand player"
            >
              <ChevronUp size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Player */}
      {isExpanded && (
        <div className={styles.expandedPlayer} style={getExpandedGradientStyle()}>
          <div className={styles.expandedContainer}>
            <button 
              className={styles.collapseButton}
              onClick={() => setIsExpanded(false)}
              aria-label="Collapse player"
            >
              <ChevronDown size={24} />
            </button>

            <div className={styles.expandedContent}>
              <div className={styles.coverArtContainer}>
                <img 
                  src={coverUrl} 
                  alt={`${currentTrack.title} cover`} 
                  className={styles.expandedCover} 
                />
              </div>

              <div className={styles.expandedTrackInfo}>
                <h2 className={styles.expandedTitle}>{currentTrack.title}</h2>
                <p className={styles.expandedArtist}>{currentTrack.artist}</p>
                <p className={styles.expandedAlbum}>{currentTrack.album}</p>
              </div>

              <div className={styles.progressSection}>
                <div className={styles.progressBar} onClick={handleProgressClick}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className={styles.timeInfo}>
                  <span className={styles.currentTime}>{formatTime(displayCurrentTime)}</span>
                  <span className={styles.totalTime}>{formatTime(displayDuration)}</span>
                </div>
                <div className={styles.toggleControls}>
                  <button 
                    className={`${styles.toggleButton} ${isShuffle ? styles.active : ''}`}
                    onClick={toggleShuffle}
                    aria-label="Toggle shuffle"
                    title="Shuffle"
                  >
                    <Shuffle size={20} />
                  </button>
                  <button 
                    className={`${styles.toggleButton} ${isRepeat ? styles.active : ''}`}
                    onClick={toggleRepeat}
                    aria-label="Toggle repeat"
                    title="Repeat"
                  >
                    <Repeat size={20} />
                  </button>
                </div>
              </div>

              <div className={styles.expandedControls}>
                <div className={styles.secondaryControls}>
                  <button 
                    className={styles.mainControlButton}
                    onClick={previousTrack}
                    aria-label="Previous track"
                  >
                    <SkipBack size={28} fill="currentColor" />
                  </button>
                  <button 
                    className={styles.playButton}
                    onClick={togglePlayPause}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                  </button>
                  <button 
                    className={styles.mainControlButton}
                    onClick={nextTrack}
                    aria-label="Next track"
                  >
                    <SkipForward size={28} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
