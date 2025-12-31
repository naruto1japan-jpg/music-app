import React from "react";
import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Home as HomeIcon, Search, Settings, Menu, X } from "lucide-react";

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
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--dynamic-background', backgroundGradient);
  }, [backgroundGradient]);

  return (
    <div className={styles.layout}>
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
          <HomeIcon size={24} />
          <span>Home</span>
        </Link>
        <Link to="/search" className={styles.sidebarLink} onClick={() => setSidebarOpen(false)}>
          <Search size={24} />
          <span>Search</span>
        </Link>
        <Link to="/admin" className={styles.sidebarLink} onClick={() => setSidebarOpen(false)}>
          <Settings size={24} />
          <span>Admin</span>
        </Link>
      </aside>
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
