import React from "react";
import type { Route } from "./+types/search";
import { Link } from "react-router";
import { Search as SearchIcon, Music2, Youtube, Home, Settings, Menu, X } from "lucide-react";
import { MiniPlayer } from "~/components/mini-player/mini-player";
import { MusicCard } from "~/components/music-card/music-card";
import { GENRES, type Genre, type Track } from "~/data/music";
import { useMusic } from "~/contexts/music-context";
import { searchYouTube, getYouTubeSuggestions, type YouTubeTrack } from "~/services/youtube-api";
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
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [selectedGenre, setSelectedGenre] = React.useState<Genre>("All");
  const [localResults, setLocalResults] = React.useState(userTracks);
  const [onlineResults, setOnlineResults] = React.useState<Track[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [suggestionIndex, setSuggestionIndex] = React.useState(-1);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const suggestionsRef = React.useRef<HTMLDivElement>(null);

  // Debug: Check if API key is loaded
  React.useEffect(() => {
    console.log('Search page loaded. API Key check:', {
      hasKey: !!import.meta.env.VITE_YOUTUBE_API_KEY,
      keyLength: import.meta.env.VITE_YOUTUBE_API_KEY?.length || 0
    });
  }, []);

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

    console.log('Initiating YouTube search for:', searchQuery);
    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await searchYouTube(searchQuery);
      console.log('Search completed. Results:', result.tracks.length);
      
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

  // Debounced search suggestions
  React.useEffect(() => {
    if (activeTab !== "online" || !searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await getYouTubeSuggestions(searchQuery);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setSuggestionIndex(-1);
    // Automatically search after selecting suggestion
    setTimeout(() => {
      if (activeTab === "online") {
        handleOnlineSearch();
      } else {
        handleLocalSearch();
      }
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (suggestionIndex >= 0 && suggestions[suggestionIndex]) {
        handleSuggestionClick(suggestions[suggestionIndex]);
      } else {
        setShowSuggestions(false);
        handleSearch();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSuggestionIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSuggestionIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSuggestionIndex(-1);
    }
  };

  const currentResults = activeTab === "local" ? localResults : onlineResults;
  const showCategories = activeTab === "local";

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
        <Link to="/search" className={styles.sidebarLink} data-active onClick={() => setSidebarOpen(false)}>
          <SearchIcon size={24} />
          <span>Search</span>
        </Link>
        <Link to="/admin" className={styles.sidebarLink} onClick={() => setSidebarOpen(false)}>
          <Settings size={24} />
          <span>Admin</span>
        </Link>
      </aside>
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
            <div className={styles.searchInputWrapper}>
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder={activeTab === "local" ? "Search your library..." : "Search YouTube music..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSuggestionIndex(-1);
                }}
                onKeyDown={handleKeyPress}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div ref={suggestionsRef} className={styles.suggestions}>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className={styles.suggestionItem}
                      data-active={index === suggestionIndex}
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseEnter={() => setSuggestionIndex(index)}
                    >
                      <SearchIcon className={styles.suggestionIcon} size={16} />
                      <span className={styles.suggestionText}>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
