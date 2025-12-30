import React from "react";
import type { Route } from "./+types/admin";
import { Settings, Plus, Edit, Trash2 } from "lucide-react";
import { Header } from "~/components/header/header";
import { MiniPlayer } from "~/components/mini-player/mini-player";
import { mockTracks, GENRES, type Track } from "~/data/music";
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

export default function Admin() {
  const { toast } = useToast();
  const [tracks, setTracks] = React.useState<Track[]>(mockTracks);
  const [formData, setFormData] = React.useState({
    title: "",
    artist: "",
    album: "",
    genre: "Pop",
    duration: "",
    coverUrl: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.artist || !formData.album || !formData.duration || !formData.coverUrl) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
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
      coverUrl: formData.coverUrl,
      audioUrl: "",
      featured: false,
    };

    setTracks((prev) => [newTrack, ...prev]);
    setFormData({
      title: "",
      artist: "",
      album: "",
      genre: "Pop",
      duration: "",
      coverUrl: "",
    });

    toast({
      title: "Success",
      description: "Music track added successfully",
    });
  };

  const handleDelete = (id: string) => {
    setTracks((prev) => prev.filter((track) => track.id !== id));
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
                <label htmlFor="coverUrl" className={styles.label}>
                  Cover Image URL *
                </label>
                <input
                  type="url"
                  id="coverUrl"
                  name="coverUrl"
                  className={styles.input}
                  placeholder="https://example.com/cover.jpg"
                  value={formData.coverUrl}
                  onChange={handleInputChange}
                  required
                />
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
                <div key={track.id} className={styles.musicItem}>
                  <img src={track.coverUrl} alt={track.title} className={styles.musicCover} />
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
                      onClick={() => handleDelete(track.id)}
                      aria-label="Delete track"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <MiniPlayer />
    </div>
  );
}
