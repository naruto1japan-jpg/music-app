import React from "react";
import type { Route } from "./+types/admin";
import { Settings, Plus, Edit, Trash2, Upload, Music } from "lucide-react";
import { Header } from "~/components/header/header";
import { MiniPlayer } from "~/components/mini-player/mini-player";
import { GENRES, type Track } from "~/data/music";
import { useMusic } from "~/contexts/music-context";
import { searchGaanaTracks } from "~/services/gaana-api";
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

  return (
    <div className={styles.musicItem}>
      <img src={coverUrl} alt={track.title} className={styles.musicCover} />
      <div className={styles.musicInfo}>
        <h4 className={styles.musicTitle}>{track.title}</h4>
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
  const [formData, setFormData] = React.useState({
    title: "",
    artist: "",
    album: "",
    genre: "Pop",
    duration: "",
    gaanaSearch: "",
  });
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [audioFile, setAudioFile] = React.useState<File | null>(null);
  const [coverPreview, setCoverPreview] = React.useState<string>("");
  const [isSearchingGaana, setIsSearchingGaana] = React.useState(false);

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

  const handleGaanaSearch = async () => {
    if (!formData.gaanaSearch.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }

    setIsSearchingGaana(true);
    try {
      const results = await searchGaanaTracks(formData.gaanaSearch, 1);
      if (results.tracks.length > 0) {
        const gaanaTrack = results.tracks[0];
        setFormData((prev) => ({
          ...prev,
          title: gaanaTrack.title,
          artist: gaanaTrack.artist,
          album: gaanaTrack.album,
          duration: gaanaTrack.duration.toString(),
        }));
        
        // Download and set cover art
        if (gaanaTrack.artwork) {
          try {
            const response = await fetch(gaanaTrack.artwork);
            const blob = await response.blob();
            const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
            setCoverFile(file);
            setCoverPreview(gaanaTrack.artwork);
          } catch (err) {
            console.error('Failed to download cover art:', err);
          }
        }

        toast({
          title: "Success",
          description: "Track details loaded from Gaana",
        });
      } else {
        toast({
          title: "Not Found",
          description: "No results found on Gaana",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search Gaana",
        variant: "destructive",
      });
    } finally {
      setIsSearchingGaana(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    const newTrack: Track = {
      id: Date.now().toString(),
      title: formData.title,
      artist: formData.artist,
      album: formData.album,
      genre: formData.genre,
      duration: parseInt(formData.duration, 10),
      coverFile: coverFile,
      audioFile: audioFile || undefined,
      featured: false,
    };

    addTrack(newTrack);
    
    setFormData({
      title: "",
      artist: "",
      album: "",
      genre: "Pop",
      duration: "",
      gaanaSearch: "",
    });
    setCoverFile(null);
    setAudioFile(null);
    setCoverPreview("");

    toast({
      title: "Success",
      description: "Music track added successfully",
    });
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
      <Header />
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
            
            <div className={styles.gaanaSection}>
              <h4 className={styles.gaanaTitle}>
                <Music size={20} />
                Search on Gaana
              </h4>
              <div className={styles.gaanaSearch}>
                <input
                  type="text"
                  name="gaanaSearch"
                  className={styles.input}
                  placeholder="Search for a song on Gaana..."
                  value={formData.gaanaSearch}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className={styles.gaanaButton}
                  onClick={handleGaanaSearch}
                  disabled={isSearchingGaana}
                >
                  {isSearchingGaana ? "Searching..." : "Search"}
                </button>
              </div>
            </div>

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
                  Audio File (Optional)
                </label>
                <div className={styles.fileInputWrapper}>
                  <input
                    type="file"
                    id="audioFile"
                    accept="audio/*"
                    className={styles.fileInput}
                    onChange={handleAudioChange}
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
