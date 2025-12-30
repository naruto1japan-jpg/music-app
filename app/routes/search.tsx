import React from "react";
import type { Route } from "./+types/search";
import { Search as SearchIcon, Music2, Globe } from "lucide-react";
import { Header } from "~/components/header/header";
import { MiniPlayer } from "~/components/mini-player/mini-player";
import { MusicCard } from "~/components/music-card/music-card";
import { mockTracks, GENRES, type Genre } from "~/data/music";
import { useMusic } from "~/contexts/music-context";
import styles from "./search.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Search - Harmony Flow" },
    {
      name: "description",
      content: "Search for your favorite music on Harmony Flow",
    },
  ];
}

export default function Search() {
  const { tracks: userTracks, backgroundGradient } = useMusic();
  const [activeTab, setActiveTab] = React.useState<"search" | "categories">("search");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedGenre, setSelectedGenre] = React.useState<Genre>("All");
  const [searchResults, setSearchResults] = React.useState(mockTracks);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--dynamic-background', backgroundGradient);
  }, [backgroundGradient]);

  const allTracks = userTracks.length > 0 ? [...userTracks, ...mockTracks] : mockTracks;

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults(allTracks);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allTracks.filter(
      (track) =>
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.album.toLowerCase().includes(query),
    );
    setSearchResults(filtered);
  };

  const handleCategorySelect = (genre: Genre) => {
    setSelectedGenre(genre);
    if (genre === "All") {
      setSearchResults(allTracks);
    } else {
      const filtered = allTracks.filter((track) => track.genre === genre);
      setSearchResults(filtered);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Search Indian Music</h2>
          <div className={styles.tabs}>
            <button className={styles.tab} data-active={activeTab === "search"} onClick={() => setActiveTab("search")}>
              <SearchIcon className={styles.tabIcon} />
              Search
            </button>
            <button
              className={styles.tab}
              data-active={activeTab === "categories"}
              onClick={() => setActiveTab("categories")}
            >
              <Globe className={styles.tabIcon} />
              Categories
            </button>
          </div>
        </div>

        {activeTab === "search" && (
          <div className={styles.searchSection}>
            <div className={styles.searchBar}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search for songs, artists, albums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className={styles.searchButton} onClick={handleSearch}>
                <SearchIcon size={20} />
                Search
              </button>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className={styles.categorySection}>
            <p className={styles.categoryLabel}>Browse by Genre</p>
            <div className={styles.categoryGrid}>
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  className={styles.categoryButton}
                  data-active={selectedGenre === genre}
                  onClick={() => handleCategorySelect(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.resultsSection}>
          {searchResults.length > 0 ? (
            <>
              <div className={styles.resultsHeader}>
                <h3 className={styles.resultsTitle}>
                  {activeTab === "search" && searchQuery ? "Search Results" : "Browse Music"}
                </h3>
                <p className={styles.resultsCount}>
                  {searchResults.length} {searchResults.length === 1 ? "track" : "tracks"} found
                </p>
              </div>
              <div className={styles.grid}>
                {searchResults.map((track) => (
                  <MusicCard key={track.id} track={track} />
                ))}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <Music2 className={styles.emptyIcon} size={64} />
              <h3 className={styles.emptyTitle}>No results found</h3>
              <p className={styles.emptyText}>Try a different search term or browse categories.</p>
            </div>
          )}
        </div>
      </div>
      <MiniPlayer />
    </div>
  );
}
