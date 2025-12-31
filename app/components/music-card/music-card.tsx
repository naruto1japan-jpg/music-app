import React from "react";
import { Play, ListPlus, MoreVertical } from "lucide-react";
import type { Track } from "~/data/music";
import { useMusic } from "~/contexts/music-context";
import styles from "./music-card.module.css";
import classNames from "classnames";

interface MusicCardProps {
  track: Track;
  className?: string;
  variant?: 'default' | 'compact';
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function MusicCard({ track, className, variant = 'default' }: MusicCardProps) {
  const { playTrack, addToQueue } = useMusic();
  const [coverUrl, setCoverUrl] = React.useState<string>('');
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

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
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(prev => !prev);
  };

  const handleMenuAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setShowMenu(false);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  if (variant === 'compact') {
    return (
      <div className={classNames(styles.compactCard, className)} onClick={handlePlay}>
        <img src={coverUrl} alt={`${track.title} cover`} className={styles.compactCover} />
        <div className={styles.compactInfo}>
          <h3 className={styles.compactTitle}>{track.title}</h3>
        </div>
        <button className={styles.compactPlayButton} aria-label="Play track">
          <Play className={styles.playIcon} size={20} fill="currentColor" />
        </button>
      </div>
    );
  }

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
          <div className={styles.actions}>
            <button 
              className={styles.queueButton}
              onClick={handleAddToQueue}
              aria-label="Add to queue"
              title="Add to queue"
            >
              <ListPlus size={18} />
            </button>
            <div className={styles.menuContainer} ref={menuRef}>
              <button 
                className={styles.menuButton}
                onClick={toggleMenu}
                aria-label="More options"
                title="More options"
                data-active={showMenu}
              >
                <MoreVertical size={18} />
              </button>
              {showMenu && (
                <div className={styles.dropdown}>
                  <button 
                    className={styles.dropdownItem}
                    onClick={(e) => handleMenuAction(e, () => playTrack(track))}
                  >
                    <Play size={16} />
                    Play Now
                  </button>
                  <button 
                    className={styles.dropdownItem}
                    onClick={(e) => handleMenuAction(e, () => addToQueue(track))}
                  >
                    <ListPlus size={16} />
                    Add to Queue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
