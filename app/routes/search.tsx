import React from "react";
import type { Route } from "./+types/search";
import { Search as SearchIcon, Music2, Youtube } from "lucide-react";
import { Header } from "~/components/header/header";
import { MiniPlayer } from "~/components/mini-player/mini-player";
import { MusicCard } from "~/components/music-card/music-card";
import { GENRES, type Genre, type Track } from "~/data/music";
import { useMusic } from "~/contexts/music-context";
import { searchYouTube, type YouTubeTrack } from "~/services/youtube-api";
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
  const [activeTab, setActiveTab] = React.useState<"local" | "online">("local");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedGenre, setSelectedGenre] = React.useState<Genre>("All");
  const [localResults, setLocalResults] = React.useState(userTracks);
  const [onlineResults, setOnlineResults] = React.useState<Track[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLocalResults(userTracks);
  }, [userTracks]);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--dynamic-background', backgroundGradient);
  }, [backgroundGradient]);

  const handleLocalSearch = () => {
    if (!searchQuery.trim()) {
      setLocalResults(userTracks);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = userTracks.filter(
      (track) =>
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.album.toLowerCase().includes(query),
    );
    setLocalResults(filtered);
  };

  const handleOnlineSearch = async () => {
    if (!searchQuery.trim()) {
      setOnlineResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await searchYouTube(searchQuery);
      
      // Convert YouTube tracks to our Track format
      const tracks: Track[] = result.tracks.map((ytTrack: YouTubeTrack) => ({
        id: ytTrack.id,
        title: ytTrack.title,
        artist: ytTrack.artist,
        album: 'YouTube',
        genre: 'Online',
        duration: ytTrack.duration,
        coverUrl: ytTrack.thumbnail,
        youtubeVideoId: ytTrack.videoId,
      }));
      
      setOnlineResults(tracks);
      
      if (tracks.length === 0) {
        setSearchError('No results found. Try a different search term.');
      }
    } catch (error) {
      console.error('Online search failed:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed. Please try again.');
      setOnlineResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (activeTab === "local") {
      handleLocalSearch();
    } else {
      handleOnlineSearch();
    }
  };

  const handleCategorySelect = (genre: Genre) => {
    setSelectedGenre(genre);
    if (genre === "All") {
      setLocalResults(userTracks);
    } else {
      const filtered = userTracks.filter((track) => track.genre === genre);
      setLocalResults(filtered);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const currentResults = activeTab === "local" ? localResults : onlineResults;
  const showCategories = activeTab === "local";

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Search Music</h2>
          <div className={styles.tabs}>
            <button 
              className={styles.tab} 
              data-active={activeTab === "local"} 
              onClick={() => setActiveTab("local")}
            >
              <Music2 className={styles.tabIcon} />
              My Library
            </button>
            <button
              className={styles.tab}
              data-active={activeTab === "online"}
              onClick={() => setActiveTab("online")}
            >
              <Youtube className={styles.tabIcon} />
              YouTube
            </button>
          </div>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchBar}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={activeTab === "local" ? "Search your library..." : "Search YouTube music..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button 
              className={styles.searchButton} 
              onClick={handleSearch}
              disabled={isSearching}
            >
              <SearchIcon size={20} />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {showCategories && (
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
          {currentResults.length > 0 ? (
            <>
              <div className={styles.resultsHeader}>
                <h3 className={styles.resultsTitle}>
                  {activeTab === "online" && searchQuery 
                    ? "YouTube Results" 
                    : activeTab === "local" && searchQuery 
                    ? "Search Results" 
                    : "Browse Music"}
                </h3>
                <p className={styles.resultsCount}>
                  {currentResults.length} {currentResults.length === 1 ? "track" : "tracks"} found
                </p>
              </div>
              <div className={styles.grid}>
                {currentResults.map((track) => (
                  <MusicCard key={track.id} track={track} />
                ))}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <Music2 className={styles.emptyIcon} size={64} />
              <h3 className={styles.emptyTitle}>
                {isSearching ? 'Searching...' : searchError ? 'Search Error' : 'No results found'}
              </h3>
              <p className={styles.emptyText}>
                {searchError ? searchError : activeTab === "online" 
                  ? "Try searching for your favorite songs, artists, or albums on YouTube." 
                  : "Try a different search term or browse categories."}
              </p>
            </div>
          )}
        </div>
      </div>
      <MiniPlayer />
    </div>
  );
}
