import React from "react";
import { Play } from "lucide-react";
import type { Track } from "~/data/music";
import { useMusic } from "~/contexts/music-context";
import styles from "./music-card.module.css";
import classNames from "classnames";

interface MusicCardProps {
  track: Track;
  className?: string;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function MusicCard({ track, className }: MusicCardProps) {
  const { playTrack } = useMusic();
  const [coverUrl, setCoverUrl] = React.useState<string>('');

  React.useEffect(() => {
    if (track.coverUrl) {
      setCoverUrl(track.coverUrl);
    } else if (track.coverFile) {
      const url = URL.createObjectURL(track.coverFile);
      setCoverUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [track.coverUrl, track.coverFile]);

  const handlePlay = () => {
    playTrack(track);
  };

  return (
    <div className={classNames(styles.card, className)} onClick={handlePlay}>
      <div className={styles.coverContainer}>
        <img src={coverUrl} alt={`${track.title} cover`} className={styles.cover} />
        <div className={styles.playOverlay}>
          <button className={styles.playButton} aria-label="Play track">
            <Play className={styles.playIcon} size={24} fill="currentColor" />
          </button>
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{track.title}</h3>
        <p className={styles.artist}>{track.artist}</p>
        <div className={styles.footer}>
          <span className={styles.genre}>{track.genre}</span>
          <span className={styles.duration}>{formatDuration(track.duration)}</span>
        </div>
      </div>
    </div>
  );
}
