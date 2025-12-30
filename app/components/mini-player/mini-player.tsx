import React from "react";
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, ChevronUp, ChevronDown, ListMusic, Car, X } from "lucide-react";
import { useMusic } from "~/contexts/music-context";
import { extractColorsFromImage, type DominantColors } from "~/utils/color-extractor";
import styles from "./mini-player.module.css";

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
    seek,
    queue,
    removeFromQueue,
    clearQueue,
    isDrivingMode,
    toggleDrivingMode
  } = useMusic();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [coverUrl, setCoverUrl] = React.useState<string>('');
  const [dominantColors, setDominantColors] = React.useState<DominantColors | null>(null);
  const [showQueue, setShowQueue] = React.useState(false);


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



  if (!currentTrack) {
    return null;
  }

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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    seek(newTime);
  };

  return (
    <>
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
              className={`${styles.iconButton} ${isDrivingMode ? styles.active : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleDrivingMode();
              }}
              aria-label="Driving mode"
              title="Driving Mode"
            >
              <Car size={20} />
            </button>
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
                  <span className={styles.currentTime}>{formatTime(currentTime)}</span>
                  <span className={styles.totalTime}>{formatTime(duration)}</span>
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
                  <button 
                    className={`${styles.toggleButton} ${showQueue ? styles.active : ''}`}
                    onClick={() => setShowQueue(!showQueue)}
                    aria-label="Toggle queue"
                    title="Queue"
                  >
                    <ListMusic size={20} />
                    {queue.length > 0 && <span className={styles.queueBadge}>{queue.length}</span>}
                  </button>
                  <button 
                    className={`${styles.toggleButton} ${isDrivingMode ? styles.active : ''}`}
                    onClick={toggleDrivingMode}
                    aria-label="Toggle driving mode"
                    title="Driving Mode"
                  >
                    <Car size={20} />
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

              {showQueue && (
                <div className={styles.queueContainer}>
                  <div className={styles.queueHeader}>
                    <h3 className={styles.queueTitle}>Queue</h3>
                    {queue.length > 0 && (
                      <button 
                        className={styles.clearButton}
                        onClick={clearQueue}
                        aria-label="Clear queue"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  {queue.length === 0 ? (
                    <p className={styles.emptyQueue}>No tracks in queue</p>
                  ) : (
                    <div className={styles.queueList}>
                      {queue.map((track, index) => (
                        <div key={`${track.id}-${index}`} className={styles.queueItem}>
                          <img 
                            src={track.coverUrl} 
                            alt={`${track.title} cover`} 
                            className={styles.queueCover}
                          />
                          <div className={styles.queueTrackInfo}>
                            <p className={styles.queueTrackTitle}>{track.title}</p>
                            <p className={styles.queueTrackArtist}>{track.artist}</p>
                          </div>
                          <button 
                            className={styles.removeButton}
                            onClick={() => removeFromQueue(index)}
                            aria-label="Remove from queue"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
