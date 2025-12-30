import { Play, Pause } from "lucide-react";
import { useMusic } from "~/contexts/music-context";
import styles from "./mini-player.module.css";

export function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlayPause } = useMusic();

  if (!currentTrack) {
    return (
      <div className={styles.player}>
        <div className={styles.container}>
          <p className={styles.emptyState}>No track playing</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.player}>
      <div className={styles.container}>
        <div className={styles.trackInfo}>
          <img src={currentTrack.coverUrl} alt={`${currentTrack.title} cover`} className={styles.cover} />
          <div className={styles.details}>
            <h4 className={styles.title}>{currentTrack.title}</h4>
            <p className={styles.artist}>{currentTrack.artist}</p>
          </div>
        </div>
        <div className={styles.controls}>
          <button className={styles.controlButton} onClick={togglePlayPause} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>
        </div>
      </div>
    </div>
  );
}
