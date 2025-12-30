import React from "react";
import { Play, ListPlus } from "lucide-react";
import { useNavigate } from "react-router";
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
  const { playTrack, addToQueue } = useMusic();
  const navigate = useNavigate();
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
    console.log('Playing track:', track.title);
    console.log('Has audioUrl:', !!track.audioUrl);
    console.log('Has audioFile:', !!track.audioFile);
    if (track.audioUrl) {
      console.log('Audio URL type:', track.audioUrl.substring(0, 20));
    }
    playTrack(track);
    navigate('/player');
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
  };

  return (
    <div className={classNames(styles.card, className)}>
      <div className={styles.coverContainer} onClick={handlePlay}>
        <img src={coverUrl} alt={`${track.title} cover`} className={styles.cover} />
        <div className={styles.playOverlay}>
          <button className={styles.playButton} aria-label="Play track">
            <Play className={styles.playIcon} size={24} fill="currentColor" />
          </button>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.trackInfo}>
          <h3 className={styles.title}>{track.title}</h3>
          <p className={styles.artist}>{track.artist}</p>
        </div>
        <div className={styles.footer}>
          <div className={styles.meta}>
            <span className={styles.genre}>{track.genre}</span>
            <span className={styles.duration}>{formatDuration(track.duration)}</span>
          </div>
          <button 
            className={styles.queueButton}
            onClick={handleAddToQueue}
            aria-label="Add to queue"
            title="Add to queue"
          >
            <ListPlus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
