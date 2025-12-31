import React from "react";
import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Home as HomeIcon, Search, Settings } from "lucide-react";

import { Header } from "~/components/header/header";
import { MiniPlayer } from "~/components/mini-player/mini-player";
import { MusicCard } from "~/components/music-card/music-card";
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
  const { backgroundGradient, lastPlayed } = useMusic();

  React.useEffect(() => {
    document.documentElement.style.setProperty('--dynamic-background', backgroundGradient);
  }, [backgroundGradient]);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <Link to="/" className={styles.sidebarLink}>
          <HomeIcon size={24} />
          <span>Home</span>
        </Link>
        <Link to="/search" className={styles.sidebarLink}>
          <Search size={24} />
          <span>Search</span>
        </Link>
        <Link to="/admin" className={styles.sidebarLink}>
          <Settings size={24} />
          <span>Admin</span>
        </Link>
      </aside>
      <Header />
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.section}>
            <h2 className={styles.greeting}>Good evening</h2>
            {lastPlayed.length > 0 && (
              <div className={styles.grid}>
                {lastPlayed.slice(0, 6).map((track) => (
                  <MusicCard
                    key={track.id}
                    track={track}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <MiniPlayer />
    </div>
  );
}
