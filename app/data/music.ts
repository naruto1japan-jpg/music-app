export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  coverFile?: File;
  coverUrl?: string;
  audioFile?: File;
  audioUrl?: string;
  youtubeVideoId?: string;
  featured?: boolean;
}

export const GENRES = [
  "All",
  "Pop",
  "Rock",
  "Jazz",
  "Classical",
  "Electronic",
  "Hip Hop",
  "R&B",
  "Country",
  "Indie",
] as const;

export type Genre = (typeof GENRES)[number];

// Sample audio URLs - using free audio from Pixabay/Free Music Archive
const SAMPLE_AUDIO_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export const mockTracks: Track[] = [
  {
    id: "1",
    title: "Midnight Dreams",
    artist: "Luna Eclipse",
    album: "Nocturnal Vibes",
    genre: "Electronic",
    duration: 245,
    coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop",
    audioUrl: SAMPLE_AUDIO_URL,
    featured: true,
  },
  {
    id: "2",
    title: "Summer Breeze",
    artist: "The Coastal Crew",
    album: "Endless Horizon",
    genre: "Indie",
    duration: 198,
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    audioUrl: SAMPLE_AUDIO_URL,
    featured: true,
  },
  {
    id: "3",
    title: "Urban Rhythm",
    artist: "Metro Beats",
    album: "City Lights",
    genre: "Hip Hop",
    duration: 212,
    coverUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
    audioUrl: SAMPLE_AUDIO_URL,
    featured: true,
  },
  {
    id: "4",
    title: "Velvet Nights",
    artist: "Smooth Operators",
    album: "Late Night Sessions",
    genre: "Jazz",
    duration: 267,
    coverUrl: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop",
    audioUrl: SAMPLE_AUDIO_URL,
  },
  {
    id: "5",
    title: "Electric Storm",
    artist: "Voltage",
    album: "High Energy",
    genre: "Rock",
    duration: 223,
    coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop",
    audioUrl: SAMPLE_AUDIO_URL,
  },
  {
    id: "6",
    title: "Moonlight Sonata",
    artist: "Classical Ensemble",
    album: "Timeless Classics",
    genre: "Classical",
    duration: 334,
    coverUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=400&fit=crop",
    audioUrl: SAMPLE_AUDIO_URL,
  },
  {
    id: "7",
    title: "Heartbeat",
    artist: "Pop Stars",
    album: "Chart Toppers",
    genre: "Pop",
    duration: 189,
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    audioUrl: SAMPLE_AUDIO_URL,
    featured: true,
  },
  {
    id: "8",
    title: "Country Roads",
    artist: "Nashville Nights",
    album: "Southern Stories",
    genre: "Country",
    duration: 201,
    coverUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=400&fit=crop",
    audioUrl: SAMPLE_AUDIO_URL,
  },
  {
    id: "9",
    title: "Soulful Serenade",
    artist: "R&B Collective",
    album: "Smooth Grooves",
    genre: "R&B",
    duration: 256,
    coverUrl: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop",
    audioUrl: SAMPLE_AUDIO_URL,
  },
  {
    id: "10",
    title: "Neon Pulse",
    artist: "Synth Wave",
    album: "Digital Dreams",
    genre: "Electronic",
    duration: 278,
    coverUrl: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop",
    audioUrl: SAMPLE_AUDIO_URL,
    featured: true,
  },
];
