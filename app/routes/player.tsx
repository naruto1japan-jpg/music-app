import { useMusic } from "~/contexts/music-context";
import { useNavigate } from "react-router";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Volume2, 
  ChevronDown 
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import styles from "./player.module.css";

export default function Player() {
  const { 
    currentTrack, 
    isPlaying, 
    playPause, 
    nextTrack, 
    previousTrack,
    queue,
    currentIndex
  } = useMusic();
  const navigate = useNavigate();
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Find the audio element
    const audio = document.querySelector('audio');
    if (audio) {
      audioRef.current = audio;
      
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('durationchange', updateDuration);
      
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('durationchange', updateDuration);
      };
    }
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol / 100;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    navigate('/');
    return null;
  }

  const queuePosition = `${currentIndex + 1} of ${queue.length} in queue`;

  return (
    <div className={styles.playerContainer}>
      <header className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/')}
          aria-label="Go back"
        >
          <ChevronDown size={32} />
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.albumArt}>
          <img 
            src={currentTrack.coverUrl} 
            alt={currentTrack.title}
          />
        </div>

        <div className={styles.trackInfo}>
          <h1 className={styles.title}>{currentTrack.title}</h1>
          <p className={styles.artist}>{currentTrack.artist}</p>
          {queue.length > 0 && (
            <p className={styles.queueInfo}>{queuePosition}</p>
          )}
        </div>

        <div className={styles.progressSection}>
          <div className={styles.timeDisplay}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className={styles.progressBar}
          />
        </div>

        <div className={styles.controls}>
          <button
            className={`${styles.controlButton} ${isShuffle ? styles.active : ''}`}
            onClick={() => setIsShuffle(!isShuffle)}
            aria-label="Shuffle"
          >
            <Shuffle size={24} />
          </button>
          
          <button
            className={styles.controlButton}
            onClick={previousTrack}
            aria-label="Previous track"
          >
            <SkipBack size={32} />
          </button>

          <button
            className={styles.playButton}
            onClick={playPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={36} /> : <Play size={36} />}
          </button>

          <button
            className={styles.controlButton}
            onClick={nextTrack}
            aria-label="Next track"
          >
            <SkipForward size={32} />
          </button>

          <button
            className={`${styles.controlButton} ${repeatMode !== 'off' ? styles.active : ''}`}
            onClick={() => {
              const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
              const currentIdx = modes.indexOf(repeatMode);
              setRepeatMode(modes[(currentIdx + 1) % modes.length]);
            }}
            aria-label="Repeat"
          >
            <Repeat size={24} />
          </button>
        </div>

        <div className={styles.volumeSection}>
          <Volume2 size={20} />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className={styles.volumeSlider}
          />
        </div>
      </div>
    </div>
  );
}
