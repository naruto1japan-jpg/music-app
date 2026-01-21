/**
 * YouTube Suggestions Service
 * Provides related video suggestions based on currently playing track
 */

import type { Track } from '~/data/music';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YouTubeSuggestion {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
}

/**
 * Get related videos from YouTube based on a video ID
 */
export async function getRelatedVideos(videoId: string, apiKey: string): Promise<YouTubeSuggestion[]> {
  try {
    const searchParams = new URLSearchParams({
      part: 'snippet',
      relatedToVideoId: videoId,
      type: 'video',
      videoCategoryId: '10', // Music category
      maxResults: '10',
      key: apiKey,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams}`);
    
    if (!response.ok) {
      console.error('Failed to fetch related videos:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Get video IDs
    const videoIds = data.items.map((item: any) => item.id.videoId);
    
    // Fetch video details for duration
    const detailsParams = new URLSearchParams({
      part: 'contentDetails,snippet',
      id: videoIds.join(','),
      key: apiKey,
    });

    const detailsResponse = await fetch(`${YOUTUBE_API_BASE}/videos?${detailsParams}`);
    
    if (!detailsResponse.ok) {
      console.error('Failed to fetch video details:', detailsResponse.status);
      return [];
    }

    const detailsData = await detailsResponse.json();

    return detailsData.items.map((item: any) => ({
      videoId: item.id,
      title: extractTitle(item.snippet.title),
      artist: extractArtist(item.snippet.title) || item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      duration: parseDuration(item.contentDetails.duration),
    }));
  } catch (error) {
    console.error('Error fetching related videos:', error);
    return [];
  }
}

/**
 * Convert YouTube suggestions to Track objects
 */
export function suggestionsToTracks(suggestions: YouTubeSuggestion[]): Track[] {
  return suggestions.map((suggestion, index) => ({
    id: `yt-suggestion-${suggestion.videoId}-${index}`,
    title: suggestion.title,
    artist: suggestion.artist,
    album: 'YouTube Suggestion',
    genre: 'Music',
    duration: suggestion.duration,
    coverUrl: suggestion.thumbnail,
    youtubeVideoId: suggestion.videoId,
  }));
}

/**
 * Parse duration from ISO 8601 format (PT1M30S) to seconds
 */
function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Extract artist name from video title
 */
function extractArtist(title: string): string {
  const separators = [' - ', ' | ', ' – '];
  
  for (const separator of separators) {
    if (title.includes(separator)) {
      const parts = title.split(separator);
      return parts[0].trim();
    }
  }
  
  const match = title.match(/\(([^)]+)\)|\[([^\]]+)\]/);
  if (match) {
    return match[1] || match[2] || 'Unknown Artist';
  }
  
  return 'Unknown Artist';
}

/**
 * Extract song title from video title
 */
function extractTitle(title: string): string {
  let cleanTitle = title
    .replace(/\(official.*?\)/gi, '')
    .replace(/\[official.*?\]/gi, '')
    .replace(/\(lyrics?\)/gi, '')
    .replace(/\[lyrics?\]/gi, '')
    .replace(/\(audio\)/gi, '')
    .replace(/\[audio\]/gi, '')
    .trim();
  
  const separators = [' - ', ' | ', ' – '];
  for (const separator of separators) {
    if (cleanTitle.includes(separator)) {
      const parts = cleanTitle.split(separator);
      return parts[1]?.trim() || cleanTitle;
    }
  }
  
  return cleanTitle;
}
