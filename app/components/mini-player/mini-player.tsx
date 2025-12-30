import React from "react";
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, ChevronUp, ChevronDown } from "lucide-react";
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
    isShuffle
  } = useMusic();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [coverUrl, setCoverUrl] = React.useState<string>('');
  const [dominantColors, setDominantColors] = React.useState<DominantColors | null>(null);

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

              <div className={styles.expandedControls}>
                <div className={styles.secondaryControls}>
                  <button 
                    className={`${styles.secondaryButton} ${isShuffle ? styles.active : ''}`}
                    onClick={toggleShuffle}
                    aria-label="Toggle shuffle"
                  >
                    <Shuffle size={20} />
                  </button>
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
                  <button 
                    className={`${styles.secondaryButton} ${isRepeat ? styles.active : ''}`}
                    onClick={toggleRepeat}
                    aria-label="Toggle repeat"
                  >
                    <Repeat size={20} />
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
