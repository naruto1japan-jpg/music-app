import React from "react";
import type { Route } from "./+types/home";
import { Header } from "~/components/header/header";
import { MiniPlayer } from "~/components/mini-player/mini-player";
import { MusicCard } from "~/components/music-card/music-card";
import { mockTracks } from "~/data/music";
import { useMusic } from "~/contexts/music-context";
import styles from "./home.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Harmony Flow - Discover Your Sound" },
    {
      name: "description",
      content: "Discover, browse, and play music online with Harmony Flow",
    },
  ];
}

export default function Home() {
  const { tracks, backgroundGradient } = useMusic();
  const allTracks = tracks.length > 0 ? tracks : mockTracks;
  const featuredTracks = allTracks.filter((track) => track.featured);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--dynamic-background', backgroundGradient);
  }, [backgroundGradient]);

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.hero}>
        <h2 className={styles.heroTitle}>Discover Your Sound</h2>
        <p className={styles.heroSubtitle}>Explore millions of tracks and find your perfect rhythm</p>
      </div>
      <div className={styles.container}>
        {featuredTracks.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Featured Tracks</h3>
            </div>
            <div className={styles.grid}>
              {featuredTracks.map((track) => (
                <MusicCard key={track.id} track={track} />
              ))}
            </div>
          </section>
        )}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>All Music</h3>
          </div>
          <div className={styles.grid}>
            {allTracks.map((track) => (
              <MusicCard key={track.id} track={track} />
            ))}
          </div>
        </section>
      </div>
      <MiniPlayer />
    </div>
  );
}
