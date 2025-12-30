/**
 * YouTube API Service
 * Provides integration with YouTube Data API v3 for music search and playback
 */

export interface YouTubeTrack {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  publishedAt: string;
}

export interface YouTubeSearchResult {
  tracks: YouTubeTrack[];
  total: number;
  nextPageToken?: string;
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

// Debug: Log environment variable status
console.log('Environment check:', {
  hasKey: !!YOUTUBE_API_KEY,
  keyLength: YOUTUBE_API_KEY?.length || 0,
  allEnvVars: Object.keys(import.meta.env)
});

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
 * Tries to parse "Artist - Song" or "Artist | Song" format
 */
function extractArtist(title: string): string {
  // Common separators in music titles
  const separators = [' - ', ' | ', ' – '];
  
  for (const separator of separators) {
    if (title.includes(separator)) {
      const parts = title.split(separator);
      return parts[0].trim();
    }
  }
  
  // Fallback: extract from parentheses or brackets
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
  // Remove common tags
  let cleanTitle = title
    .replace(/\(official.*?\)/gi, '')
    .replace(/\[official.*?\]/gi, '')
    .replace(/\(lyrics?\)/gi, '')
    .replace(/\[lyrics?\]/gi, '')
    .replace(/\(audio\)/gi, '')
    .replace(/\[audio\]/gi, '')
    .trim();
  
  // If title has separator, take the second part as song title
  const separators = [' - ', ' | ', ' – '];
  for (const separator of separators) {
    if (cleanTitle.includes(separator)) {
      const parts = cleanTitle.split(separator);
      return parts[1]?.trim() || cleanTitle;
    }
  }
  
  return cleanTitle;
}

/**
 * Search for music videos on YouTube
 */
export async function searchYouTube(
  query: string,
  maxResults = 20,
  pageToken?: string
): Promise<YouTubeSearchResult> {
  if (!YOUTUBE_API_KEY) {
    console.error('YouTube API key is not configured');
    throw new Error('YouTube API key is missing. Please configure VITE_YOUTUBE_API_KEY in your environment.');
  }

  console.log('Starting YouTube search for:', query);

  try {
    // Step 1: Search for videos
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      videoCategoryId: '10', // Music category
      maxResults: maxResults.toString(),
      key: YOUTUBE_API_KEY,
    });

    if (pageToken) {
      searchParams.append('pageToken', pageToken);
    }

    const searchUrl = `${YOUTUBE_API_BASE}/search?${searchParams}`;
    console.log('Fetching from YouTube API...');
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('YouTube API Error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        body: errorText
      });
      
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.error?.message || 'Failed to search YouTube');
      } catch (e) {
        throw new Error(`YouTube API request failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }
    }

    const searchData = await searchResponse.json();
    console.log('YouTube search response:', { itemCount: searchData.items?.length || 0 });
    const videoIds = searchData.items?.map((item: any) => item.id.videoId) || [];

    if (videoIds.length === 0) {
      console.log('No videos found in search results');
      return { tracks: [], total: 0 };
    }
    
    console.log('Found video IDs:', videoIds.length);

    // Step 2: Get video details including duration
    const detailsParams = new URLSearchParams({
      part: 'contentDetails,snippet',
      id: videoIds.join(','),
      key: YOUTUBE_API_KEY,
    });

    console.log('Fetching video details...');
    const detailsResponse = await fetch(`${YOUTUBE_API_BASE}/videos?${detailsParams}`);
    
    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error('Video details error:', errorText);
      throw new Error('Failed to fetch video details');
    }

    const detailsData = await detailsResponse.json();
    console.log('Video details received:', { count: detailsData.items?.length || 0 });

    // Step 3: Map to our track format
    const tracks: YouTubeTrack[] = (detailsData.items || []).map((item: any) => {
      const title = item.snippet.title;
      const channelTitle = item.snippet.channelTitle;
      
      return {
        id: `yt-${item.id}`,
        videoId: item.id,
        title: extractTitle(title),
        artist: extractArtist(title) || channelTitle,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        duration: parseDuration(item.contentDetails.duration),
        publishedAt: item.snippet.publishedAt,
      };
    });

    console.log('Successfully mapped tracks:', tracks.length);
    
    return {
      tracks,
      total: searchData.pageInfo?.totalResults || tracks.length,
      nextPageToken: searchData.nextPageToken,
    };
  } catch (error) {
    console.error('YouTube search error:', error);
    throw error;
  }
}

/**
 * Get embeddable audio URL for a YouTube video
 * Note: This returns an embed URL. For actual audio streaming, 
 * you'd need a backend service or use YouTube IFrame API
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0`;
}

/**
 * Get direct video URL (for use with YouTube IFrame API)
 */
export function getYouTubeVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
