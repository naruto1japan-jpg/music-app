import React from "react";
import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Home as HomeIcon, Search, Settings, Menu, X, User } from "lucide-react";

import { MiniPlayer } from "~/components/mini-player/mini-player";
import { MusicCard } from "~/components/music-card/music-card";
import { useMusic } from "~/contexts/music-context";
import { mockTracks } from "~/data/music";
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

const categories = ["All", "Wrapped", "Music", "Podcasts"];

export default function Home() {
  const { backgroundGradient, lastPlayed, playTrack } = useMusic();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  React.useEffect(() => {
    // Apply dynamic theme colors from album art to background gradients
    const layoutElement = document.querySelector(`.${styles.layout}`);
    if (layoutElement && backgroundGradient) {
      // Extract color values from gradient
      const gradientMatch = backgroundGradient.match(/rgb\([^)]+\)/g);
      if (gradientMatch && gradientMatch.length >= 3) {
        const [primary, secondary, accent] = gradientMatch;
        
        // Create dynamic gradients based on extracted colors
        const dynamicLinear = `linear-gradient(45deg, ${primary} 0%, ${secondary} 30%, ${accent} 60%, ${primary} 100%)`;
        const dynamicRadial = `
          radial-gradient(circle at 20% 50%, ${primary}99 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, ${secondary}99 0%, transparent 50%),
          radial-gradient(circle at 40% 20%, ${accent}66 0%, transparent 50%)
        `;
        
        (layoutElement as HTMLElement).style.setProperty('--dynamic-gradient', dynamicLinear);
        (layoutElement as HTMLElement).style.setProperty('--dynamic-radial-gradient', dynamicRadial);
      }
    }
  }, [backgroundGradient]);

  // Get recent plays and featured tracks
  const recentPlays = lastPlayed.length > 0 ? lastPlayed.slice(0, 2) : mockTracks.slice(0, 2);
  const featuredTracks = mockTracks.filter(track => track.featured);
  const jumpBackIn = mockTracks.slice(0, 3);

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
        <div className={styles.topBar}>
          <div className={styles.userAvatar}>
            <User size={20} />
          </div>
          <div className={styles.categories}>
            {categories.map((category) => (
              <button
                key={category}
                className={`${styles.categoryButton} ${selectedCategory === category ? styles.categoryActive : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.contentWrapper}>
          {/* Recent Plays */}
          <div className={styles.recentSection}>
            {recentPlays.map((track) => (
              <MusicCard
                key={track.id}
                track={track}
                variant="compact"
              />
            ))}
          </div>

          {/* Pre-save upcoming releases */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Pre-save upcoming releases</h2>
            <div className={styles.horizontalScroll}>
              {featuredTracks.map((track) => (
                <div key={track.id} className={styles.largeCard} onClick={() => playTrack(track)}>
                  <img 
                    src={track.coverUrl || 'https://placehold.co/400x400/1a1a1a/666'} 
                    alt={track.title}
                    className={styles.largeCardImage}
                  />
                  <div className={styles.largeCardInfo}>
                    <h3 className={styles.largeCardTitle}>{track.title}</h3>
                    <p className={styles.largeCardArtist}>{track.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Jump back in */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Jump back in</h2>
            <div className={styles.horizontalScroll}>
              {jumpBackIn.map((track) => (
                <div key={track.id} className={styles.mixCard} onClick={() => playTrack(track)}>
                  <img 
                    src={track.coverUrl || 'https://placehold.co/400x400/1a1a1a/666'} 
                    alt={track.title}
                    className={styles.mixCardImage}
                  />
                  <div className={styles.mixCardOverlay}>
                    <span className={styles.mixCardLabel}>{track.genre} Mix</span>
                  </div>
                  <div className={styles.mixCardInfo}>
                    <p className={styles.mixCardArtist}>{track.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <MiniPlayer />
    </div>
  );
}
