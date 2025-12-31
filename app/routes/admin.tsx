import React from "react";
import type { Route } from "./+types/admin";
import { Link } from "react-router";
import { Settings, Plus, Edit, Trash2, Upload, Home, Search, Menu, X } from "lucide-react";
import { MiniPlayer } from "~/components/mini-player/mini-player";
import { GENRES, type Track } from "~/data/music";
import { useMusic } from "~/contexts/music-context";

import { useToast } from "~/hooks/use-toast";
import styles from "./admin.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Panel - Harmony Flow" },
    {
      name: "description",
      content: "Manage music content on Harmony Flow",
    },
  ];
}

function TrackListItem({ track, onDelete }: { track: Track; onDelete: (id: string) => void }) {
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

  const hasAudio = !!track.audioUrl || !!track.audioFile;

  return (
    <div className={styles.musicItem}>
      <img src={coverUrl} alt={track.title} className={styles.musicCover} />
      <div className={styles.musicInfo}>
        <h4 className={styles.musicTitle}>
          {track.title}
          {hasAudio && <span className={styles.audioIndicator}> 🎵</span>}
        </h4>
        <p className={styles.musicArtist}>
          {track.artist} • {track.genre}
        </p>
      </div>
      <div className={styles.musicActions}>
        <button className={styles.actionButton} aria-label="Edit track">
          <Edit size={16} />
        </button>
        <button
          className={`${styles.actionButton} ${styles.deleteButton}`}
          onClick={() => onDelete(track.id)}
          aria-label="Delete track"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const { tracks, addTrack, deleteTrack } = useMusic();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: "",
    artist: "",
    album: "",
    genre: "Pop",
    duration: "",
  });
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [audioFile, setAudioFile] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string>("");
  const [isSearchingYouTube, setIsSearchingYouTube] = React.useState(false);
  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const audioInputRef = React.useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Error",
          description: "Please select a valid audio file",
          variant: "destructive",
        });
        return;
      }
      setAudioFile(file);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.artist || !formData.album || !formData.duration) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!coverFile) {
      toast({
        title: "Error",
        description: "Please select a cover image",
        variant: "destructive",
      });
      return;
    }

    if (!audioFile) {
      toast({
        title: "Error",
        description: "Please select an audio file",
        variant: "destructive",
      });
      return;
    }

    try {
      const newTrack: Track = {
        id: Date.now().toString(),
        title: formData.title,
        artist: formData.artist,
        album: formData.album,
        genre: formData.genre,
        duration: parseInt(formData.duration, 10),
        coverFile: coverFile,
        audioFile: audioFile,
        featured: false,
      };

      console.log('Adding new track with audio file:', audioFile.name, audioFile.type);
      await addTrack(newTrack);
      
      // Clear form after successful save
      setFormData({
        title: "",
        artist: "",
        album: "",
        genre: "Pop",
        duration: "",
      });
      setCoverFile(null);
      setAudioFile(null);
      setCoverPreview("");
      
      // Reset file inputs
      if (coverInputRef.current) coverInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";

      toast({
        title: "Success",
        description: "Music track added successfully",
      });
    } catch (error) {
      console.error('Failed to add track:', error);
      toast({
        title: "Error",
        description: "Failed to add track. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteTrack(id);
    toast({
      title: "Deleted",
      description: "Music track removed successfully",
    });
  };

  return (
    <div className={styles.page}>
      <button 
        className={styles.menuButton} 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          <span className={styles.logoText}>Harmony Flow</span>
        </div>
        <Link to="/" className={styles.sidebarLink} onClick={() => setSidebarOpen(false)}>
          <Home size={24} />
          <span>Home</span>
        </Link>
        <Link to="/search" className={styles.sidebarLink} onClick={() => setSidebarOpen(false)}>
          <Search size={24} />
          <span>Search</span>
        </Link>
        <Link to="/admin" className={styles.sidebarLink} data-active onClick={() => setSidebarOpen(false)}>
          <Settings size={24} />
          <span>Admin</span>
        </Link>
      </aside>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <Settings className={styles.titleIcon} size={40} />
            Admin Panel
          </h2>
          <p className={styles.subtitle}>Manage your music library</p>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Add New Music</h3>
            
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="title" className={styles.label}>
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className={styles.input}
                  placeholder="Enter song title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="artist" className={styles.label}>
                  Artist *
                </label>
                <input
                  type="text"
                  id="artist"
                  name="artist"
                  className={styles.input}
                  placeholder="Enter artist name"
                  value={formData.artist}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="album" className={styles.label}>
                  Album *
                </label>
                <input
                  type="text"
                  id="album"
                  name="album"
                  className={styles.input}
                  placeholder="Enter album name"
                  value={formData.album}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="genre" className={styles.label}>
                  Genre *
                </label>
                <select
                  id="genre"
                  name="genre"
                  className={styles.select}
                  value={formData.genre}
                  onChange={handleInputChange}
                  required
                >
                  {GENRES.filter((g) => g !== "All").map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="duration" className={styles.label}>
                  Duration (seconds) *
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  className={styles.input}
                  placeholder="e.g., 180"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  min="1"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="coverFile" className={styles.label}>
                  Cover Image *
                </label>
                <div className={styles.fileInputWrapper}>
                  <input
                    ref={coverInputRef}
                    type="file"
                    id="coverFile"
                    accept="image/*"
                    className={styles.fileInput}
                    onChange={handleCoverChange}
                    required
                  />
                  <label htmlFor="coverFile" className={styles.fileLabel}>
                    <Upload size={20} />
                    {coverFile ? coverFile.name : "Choose cover image"}
                  </label>
                </div>
                {coverPreview && (
                  <img src={coverPreview} alt="Cover preview" className={styles.coverPreview} />
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="audioFile" className={styles.label}>
                  Audio File *
                </label>
                <div className={styles.fileInputWrapper}>
                  <input
                    ref={audioInputRef}
                    type="file"
                    id="audioFile"
                    accept="audio/*"
                    className={styles.fileInput}
                    onChange={handleAudioChange}
                    required
                  />
                  <label htmlFor="audioFile" className={styles.fileLabel}>
                    <Upload size={20} />
                    {audioFile ? audioFile.name : "Choose audio file"}
                  </label>
                </div>
              </div>

              <button type="submit" className={styles.submitButton}>
                <Plus size={20} />
                Add Music
              </button>
            </form>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Music Library ({tracks.length})</h3>
            <div className={styles.musicList}>
              {tracks.map((track) => (
                <TrackListItem key={track.id} track={track} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <MiniPlayer />
    </div>
  );
}
