#!/usr/bin/env python3
"""
Complete Music Player Web Application
Single-file Flask app with embedded HTML, CSS, and JavaScript
"""

from flask import Flask, render_template_string, jsonify
import json

app = Flask(__name__)

# Music library data
MUSIC_DATA = [
    {
        "id": "1",
        "title": "Midnight Dreams",
        "artist": "Luna Eclipse",
        "album": "Nocturnal",
        "duration": "3:45",
        "youtubeId": "jfKfPfyJRdk",
        "coverUrl": "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=300&h=300&fit=crop"
    },
    {
        "id": "2",
        "title": "Electric Waves",
        "artist": "Neon Pulse",
        "album": "Synthesis",
        "duration": "4:12",
        "youtubeId": "5qap5aO4i9A",
        "coverUrl": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop"
    },
    {
        "id": "3",
        "title": "Urban Rhythm",
        "artist": "City Lights",
        "album": "Metropolitan",
        "duration": "3:28",
        "youtubeId": "ScNNfyq3d_w",
        "coverUrl": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop"
    },
    {
        "id": "4",
        "title": "Sunset Boulevard",
        "artist": "Golden Hour",
        "album": "Horizon",
        "duration": "4:05",
        "youtubeId": "OPf0YbXqDm0",
        "coverUrl": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop"
    },
    {
        "id": "5",
        "title": "Digital Love",
        "artist": "Cyber Soul",
        "album": "Virtual Reality",
        "duration": "3:52",
        "youtubeId": "A2nyBFPj0x8",
        "coverUrl": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop"
    },
    {
        "id": "6",
        "title": "Cosmic Journey",
        "artist": "Star Voyager",
        "album": "Galaxy",
        "duration": "5:20",
        "youtubeId": "zK1mLIeXwsQ",
        "coverUrl": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop"
    },
    {
        "id": "7",
        "title": "Ocean Breeze",
        "artist": "Coastal Dreams",
        "album": "Waves",
        "duration": "4:33",
        "youtubeId": "UIVe-rZBcm4",
        "coverUrl": "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&h=300&fit=crop"
    },
    {
        "id": "8",
        "title": "Mountain Echo",
        "artist": "Alpine Sound",
        "album": "Peaks",
        "duration": "3:58",
        "youtubeId": "1-xGerv5FOk",
        "coverUrl": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop"
    },
    {
        "id": "9",
        "title": "Tokyo Nights",
        "artist": "Neon City",
        "album": "Urban Pulse",
        "duration": "4:15",
        "youtubeId": "yBLdQ1a4-JI",
        "coverUrl": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop"
    },
    {
        "id": "10",
        "title": "Retro Vibes",
        "artist": "Synthwave Collective",
        "album": "80s Revival",
        "duration": "3:42",
        "youtubeId": "MV_3Dpw-BRY",
        "coverUrl": "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300&h=300&fit=crop"
    }
]

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Music Player - Python Edition</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --color-bg: #0a0a0a;
            --color-surface: #121212;
            --color-surface-hover: #1a1a1a;
            --color-accent: #1db954;
            --color-accent-hover: #1ed760;
            --color-text: #ffffff;
            --color-text-muted: #b3b3b3;
            --color-border: #282828;
            --sidebar-width: 280px;
            --topbar-height: 64px;
            --player-height: 90px;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--color-bg);
            color: var(--color-text);
            overflow: hidden;
        }

        .app-container {
            display: flex;
            height: 100vh;
            flex-direction: column;
        }

        .main-wrapper {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        /* Sidebar */
        .sidebar {
            width: var(--sidebar-width);
            background: var(--color-surface);
            border-right: 1px solid var(--color-border);
            display: flex;
            flex-direction: column;
            padding: 24px 16px;
        }

        .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 32px;
            padding: 0 8px;
            background: linear-gradient(135deg, var(--color-accent), #1ed760);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .nav-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 12px 16px;
            border-radius: 8px;
            color: var(--color-text-muted);
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 4px;
        }

        .nav-item:hover,
        .nav-item.active {
            background: var(--color-surface-hover);
            color: var(--color-text);
        }

        .nav-icon {
            width: 24px;
            height: 24px;
        }

        /* Main Content */
        .main-content {
            flex: 1;
            overflow-y: auto;
            background: linear-gradient(180deg, #1a1a1a 0%, var(--color-bg) 100%);
        }

        .topbar {
            height: var(--topbar-height);
            padding: 16px 32px;
            display: flex;
            align-items: center;
            gap: 16px;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .search-bar {
            flex: 1;
            max-width: 400px;
            position: relative;
        }

        .search-input {
            width: 100%;
            padding: 12px 16px 12px 44px;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: 24px;
            color: var(--color-text);
            font-size: 14px;
            outline: none;
            transition: all 0.2s;
        }

        .search-input:focus {
            border-color: var(--color-accent);
            background: var(--color-surface-hover);
        }

        .search-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--color-text-muted);
        }

        .content-wrapper {
            padding: 32px;
        }

        .section {
            margin-bottom: 48px;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .section-title {
            font-size: 24px;
            font-weight: 700;
        }

        .music-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 24px;
        }

        .music-card {
            background: var(--color-surface);
            border-radius: 12px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid transparent;
        }

        .music-card:hover {
            background: var(--color-surface-hover);
            border-color: var(--color-border);
            transform: translateY(-4px);
        }

        .music-card.playing {
            border-color: var(--color-accent);
            background: rgba(29, 185, 84, 0.1);
        }

        .cover-wrapper {
            position: relative;
            width: 100%;
            aspect-ratio: 1;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
        }

        .cover-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .play-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s;
        }

        .music-card:hover .play-overlay {
            opacity: 1;
        }

        .play-btn {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: var(--color-accent);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
        }

        .play-btn:hover {
            background: var(--color-accent-hover);
            transform: scale(1.05);
        }

        .music-title {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .music-artist {
            color: var(--color-text-muted);
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Player Controls */
        .player-bar {
            height: var(--player-height);
            background: var(--color-surface);
            border-top: 1px solid var(--color-border);
            padding: 16px 24px;
            display: flex;
            align-items: center;
            gap: 24px;
        }

        .now-playing {
            display: flex;
            align-items: center;
            gap: 16px;
            flex: 1;
            min-width: 0;
        }

        .now-playing-cover {
            width: 56px;
            height: 56px;
            border-radius: 8px;
            object-fit: cover;
            background: var(--color-surface-hover);
        }

        .now-playing-info {
            flex: 1;
            min-width: 0;
        }

        .now-playing-title {
            font-weight: 600;
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .now-playing-artist {
            color: var(--color-text-muted);
            font-size: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .player-controls {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            flex: 2;
        }

        .control-buttons {
            display: flex;
            gap: 16px;
            align-items: center;
        }

        .control-btn {
            background: none;
            border: none;
            color: var(--color-text-muted);
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .control-btn:hover {
            color: var(--color-text);
            background: var(--color-surface-hover);
        }

        .control-btn.primary {
            background: var(--color-text);
            color: var(--color-bg);
            width: 40px;
            height: 40px;
        }

        .control-btn.primary:hover {
            background: var(--color-accent);
            transform: scale(1.05);
        }

        .progress-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            max-width: 600px;
        }

        .time-label {
            color: var(--color-text-muted);
            font-size: 12px;
            font-variant-numeric: tabular-nums;
            min-width: 40px;
        }

        .progress-track {
            flex: 1;
            height: 4px;
            background: var(--color-surface-hover);
            border-radius: 2px;
            position: relative;
            cursor: pointer;
        }

        .progress-fill {
            height: 100%;
            background: var(--color-accent);
            border-radius: 2px;
            transition: width 0.1s linear;
        }

        .volume-control {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            justify-content: flex-end;
        }

        /* YouTube Player Container */
        #youtube-player {
            position: fixed;
            top: -9999px;
            left: -9999px;
            width: 1px;
            height: 1px;
            opacity: 0;
            pointer-events: none;
        }

        /* Loading State */
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: var(--color-accent);
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .sidebar {
                display: none;
            }

            .music-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 16px;
            }

            .content-wrapper {
                padding: 16px;
            }

            .topbar {
                padding: 12px 16px;
            }
        }
    </style>
</head>
<body>
    <div class="app-container">
        <div class="main-wrapper">
            <!-- Sidebar -->
            <aside class="sidebar">
                <div class="logo">🎵 MusicApp</div>
                <nav>
                    <div class="nav-item active">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                        </svg>
                        <span>Home</span>
                    </div>
                    <div class="nav-item">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <span>Search</span>
                    </div>
                    <div class="nav-item">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                        <span>Your Library</span>
                    </div>
                </nav>
            </aside>

            <!-- Main Content -->
            <main class="main-content">
                <div class="topbar">
                    <div class="search-bar">
                        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <input type="text" class="search-input" placeholder="Search songs, artists..." id="searchInput">
                    </div>
                </div>

                <div class="content-wrapper">
                    <!-- Recent Plays Section -->
                    <section class="section">
                        <div class="section-header">
                            <h2 class="section-title">Recent Plays</h2>
                        </div>
                        <div class="music-grid" id="recentPlays"></div>
                    </section>

                    <!-- Featured Releases Section -->
                    <section class="section">
                        <div class="section-header">
                            <h2 class="section-title">Featured Releases</h2>
                        </div>
                        <div class="music-grid" id="featuredReleases"></div>
                    </section>

                    <!-- All Tracks Section -->
                    <section class="section">
                        <div class="section-header">
                            <h2 class="section-title">All Tracks</h2>
                        </div>
                        <div class="music-grid" id="allTracks"></div>
                    </section>
                </div>
            </main>
        </div>

        <!-- Player Bar -->
        <div class="player-bar">
            <div class="now-playing">
                <img id="playerCover" class="now-playing-cover" src="" alt="Cover">
                <div class="now-playing-info">
                    <div class="now-playing-title" id="playerTitle">Select a track</div>
                    <div class="now-playing-artist" id="playerArtist">-</div>
                </div>
            </div>

            <div class="player-controls">
                <div class="control-buttons">
                    <button class="control-btn" id="shuffleBtn" title="Shuffle">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                        </svg>
                    </button>
                    <button class="control-btn" id="prevBtn" title="Previous">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                        </svg>
                    </button>
                    <button class="control-btn primary" id="playPauseBtn" title="Play">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" id="playIcon">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" id="pauseIcon" style="display: none;">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                    </button>
                    <button class="control-btn" id="nextBtn" title="Next">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                        </svg>
                    </button>
                    <button class="control-btn" id="repeatBtn" title="Repeat">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                        </svg>
                    </button>
                </div>

                <div class="progress-bar">
                    <span class="time-label" id="currentTime">0:00</span>
                    <div class="progress-track" id="progressTrack">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <span class="time-label" id="totalTime">0:00</span>
                </div>
            </div>

            <div class="volume-control">
                <button class="control-btn" id="volumeBtn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <!-- YouTube Player (Hidden) -->
    <div id="youtube-player"></div>

    <script>
        // Music data from Python backend
        const musicLibrary = {{ music_data | tojson }};

        // Player state
        let currentTrackIndex = 0;
        let isPlaying = false;
        let player = null;
        let playerReady = false;
        let currentTrack = null;

        // Load YouTube IFrame API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // Initialize YouTube Player
        function onYouTubeIframeAPIReady() {
            player = new YT.Player('youtube-player', {
                height: '1',
                width: '1',
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    mute: 1
                },
                events: {
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange,
                    onError: onPlayerError
                }
            });
        }

        function onPlayerReady(event) {
            playerReady = true;
            event.target.unMute();
            event.target.setVolume(100);
            console.log('YouTube player ready');
        }

        function onPlayerStateChange(event) {
            if (event.data === YT.PlayerState.PLAYING) {
                isPlaying = true;
                updatePlayPauseButton();
                startProgressUpdate();
            } else if (event.data === YT.PlayerState.PAUSED) {
                isPlaying = false;
                updatePlayPauseButton();
            } else if (event.data === YT.PlayerState.ENDED) {
                playNext();
            }
        }

        function onPlayerError(event) {
            console.error('YouTube player error:', event.data);
            playNext();
        }

        // Render music cards
        function renderMusicCards(tracks, containerId) {
            const container = document.getElementById(containerId);
            container.innerHTML = tracks.map((track, index) => `
                <div class="music-card" data-index="${index}" onclick="playTrack(${index})">
                    <div class="cover-wrapper">
                        <img src="${track.coverUrl}" alt="${track.title}" class="cover-image" loading="lazy">
                        <div class="play-overlay">
                            <button class="play-btn">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="music-title">${track.title}</div>
                    <div class="music-artist">${track.artist}</div>
                </div>
            `).join('');
        }

        // Play track
        function playTrack(index) {
            if (!playerReady) {
                console.log('Player not ready yet');
                return;
            }

            currentTrackIndex = index;
            currentTrack = musicLibrary[index];

            try {
                player.loadVideoById(currentTrack.youtubeId);
                player.unMute();
                player.setVolume(100);
                
                setTimeout(() => {
                    if (player.getPlayerState() !== YT.PlayerState.PLAYING) {
                        player.playVideo();
                    }
                }, 100);

                updateNowPlaying();
                updateActiveCard();
            } catch (error) {
                console.error('Error playing track:', error);
            }
        }

        // Update now playing info
        function updateNowPlaying() {
            if (!currentTrack) return;

            document.getElementById('playerCover').src = currentTrack.coverUrl;
            document.getElementById('playerTitle').textContent = currentTrack.title;
            document.getElementById('playerArtist').textContent = currentTrack.artist;
        }

        // Update active card styling
        function updateActiveCard() {
            document.querySelectorAll('.music-card').forEach(card => {
                card.classList.remove('playing');
            });
            document.querySelector(`[data-index="${currentTrackIndex}"]`)?.classList.add('playing');
        }

        // Toggle play/pause
        function togglePlayPause() {
            if (!playerReady || !currentTrack) {
                playTrack(0);
                return;
            }

            try {
                if (isPlaying) {
                    player.pauseVideo();
                } else {
                    player.unMute();
                    player.setVolume(100);
                    player.playVideo();
                }
            } catch (error) {
                console.error('Error toggling play/pause:', error);
            }
        }

        // Play next track
        function playNext() {
            const nextIndex = (currentTrackIndex + 1) % musicLibrary.length;
            playTrack(nextIndex);
        }

        // Play previous track
        function playPrevious() {
            const prevIndex = currentTrackIndex === 0 ? musicLibrary.length - 1 : currentTrackIndex - 1;
            playTrack(prevIndex);
        }

        // Update play/pause button
        function updatePlayPauseButton() {
            const playIcon = document.getElementById('playIcon');
            const pauseIcon = document.getElementById('pauseIcon');

            if (isPlaying) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            }
        }

        // Update progress bar
        let progressInterval = null;

        function startProgressUpdate() {
            if (progressInterval) clearInterval(progressInterval);

            progressInterval = setInterval(() => {
                if (!player || !playerReady) return;

                try {
                    const currentTime = player.getCurrentTime();
                    const duration = player.getDuration();

                    if (duration > 0) {
                        const progress = (currentTime / duration) * 100;
                        document.getElementById('progressFill').style.width = `${progress}%`;
                        document.getElementById('currentTime').textContent = formatTime(currentTime);
                        document.getElementById('totalTime').textContent = formatTime(duration);
                    }
                } catch (error) {
                    // Ignore errors during state transitions
                }
            }, 1000);
        }

        // Format time (seconds to mm:ss)
        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = musicLibrary.filter(track => 
                track.title.toLowerCase().includes(query) ||
                track.artist.toLowerCase().includes(query) ||
                track.album.toLowerCase().includes(query)
            );

            renderMusicCards(filtered, 'allTracks');
        });

        // Event listeners
        document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
        document.getElementById('nextBtn').addEventListener('click', playNext);
        document.getElementById('prevBtn').addEventListener('click', playPrevious);

        // Progress bar click
        document.getElementById('progressTrack').addEventListener('click', (e) => {
            if (!player || !playerReady || !currentTrack) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const duration = player.getDuration();
            
            player.seekTo(duration * percentage, true);
        });

        // Initialize app
        function initApp() {
            renderMusicCards(musicLibrary.slice(0, 4), 'recentPlays');
            renderMusicCards(musicLibrary.slice(4, 8), 'featuredReleases');
            renderMusicCards(musicLibrary, 'allTracks');
        }

        // Start app when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initApp);
        } else {
            initApp();
        }
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """Render the main music player page"""
    return render_template_string(HTML_TEMPLATE, music_data=MUSIC_DATA)

@app.route('/api/music')
def get_music():
    """API endpoint to get all music tracks"""
    return jsonify(MUSIC_DATA)

@app.route('/api/music/<track_id>')
def get_track(track_id):
    """API endpoint to get a specific track"""
    track = next((t for t in MUSIC_DATA if t['id'] == track_id), None)
    if track:
        return jsonify(track)
    return jsonify({'error': 'Track not found'}), 404

if __name__ == '__main__':
    print("=" * 60)
    print("🎵 Music Player Web Application")
    print("=" * 60)
    print("\n✅ Server starting...")
    print("📡 Access the app at: http://localhost:5000")
    print("\n🎧 Features:")
    print("   • Full music library with YouTube playback")
    print("   • Play/pause, next/previous controls")
    print("   • Progress bar with seek functionality")
    print("   • Search tracks by title, artist, or album")
    print("   • Responsive Spotify-inspired design")
    print("\n⏹️  Press CTRL+C to stop the server\n")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
