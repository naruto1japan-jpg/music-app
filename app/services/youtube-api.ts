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

// Multiple API keys with automatic fallback
const YOUTUBE_API_KEYS = [
  import.meta.env.VITE_YOUTUBE_API_KEY_1,
  import.meta.env.VITE_YOUTUBE_API_KEY_2,
  import.meta.env.VITE_YOUTUBE_API_KEY_3,
].filter(Boolean);

let currentKeyIndex = 0;

// Debug: Log environment variable status
console.log('YouTube API Keys loaded:', {
  count: YOUTUBE_API_KEYS.length,
  keysAvailable: YOUTUBE_API_KEYS.map((k, i) => `Key ${i + 1}: ${k?.substring(0, 10)}...`)
});

function getCurrentApiKey(): string {
  if (YOUTUBE_API_KEYS.length === 0) {
    throw new Error('No YouTube API keys configured');
  }
  return YOUTUBE_API_KEYS[currentKeyIndex];
}

function rotateToNextKey(): boolean {
  currentKeyIndex = (currentKeyIndex + 1) % YOUTUBE_API_KEYS.length;
  console.log(`Switched to API key ${currentKeyIndex + 1}`);
  return currentKeyIndex !== 0; // Return false if we've cycled through all keys
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
 * Make a YouTube API request with automatic key rotation on failure
 */
async function makeYouTubeRequest(url: string, attempt = 0): Promise<Response> {
  const apiKey = getCurrentApiKey();
  const requestUrl = `${url}&key=${apiKey}`;
  
  const response = await fetch(requestUrl);
  
  // If we get a 400 or 403 error, try the next API key
  if (!response.ok && (response.status === 400 || response.status === 403) && attempt < YOUTUBE_API_KEYS.length) {
    const errorText = await response.text();
    console.warn(`API key ${currentKeyIndex + 1} failed:`, {
      status: response.status,
      error: errorText.substring(0, 200)
    });
    
    const hasMoreKeys = rotateToNextKey();
    if (hasMoreKeys || attempt < YOUTUBE_API_KEYS.length - 1) {
      console.log(`Retrying with next API key (attempt ${attempt + 1}/${YOUTUBE_API_KEYS.length})...`);
      return makeYouTubeRequest(url, attempt + 1);
    }
  }
  
  return response;
}

/**
 * Search for music videos on YouTube
 */
export async function searchYouTube(
  query: string,
  maxResults = 20,
  pageToken?: string
): Promise<YouTubeSearchResult> {
  if (YOUTUBE_API_KEYS.length === 0) {
    console.error('YouTube API keys are not configured');
    throw new Error('YouTube API keys are missing. Please configure API keys in your environment.');
  }

  console.log('Starting YouTube search for:', query);

  try {
    // Step 1: Search for music content
    // Use YouTube Music specific search by adding 'topic' to get official music tracks
    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      videoCategoryId: '10', // Music category
      videoEmbeddable: 'true', // Only embeddable videos
      maxResults: maxResults.toString(),
      topicId: '/m/04rlf', // Music topic ID - helps get music-specific content
    });

    if (pageToken) {
      searchParams.append('pageToken', pageToken);
    }

    const searchUrl = `${YOUTUBE_API_BASE}/search?${searchParams}`;
    console.log('YouTube API Request:', { query, maxResults });
    
    const searchResponse = await makeYouTubeRequest(searchUrl);
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('YouTube API Error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        body: errorText
      });
      
      let errorMessage = `YouTube API request failed: ${searchResponse.status}`;
      
      try {
        const error = JSON.parse(errorText);
        const apiError = error.error;
        
        if (apiError) {
          errorMessage = apiError.message || errorMessage;
          
          // Provide helpful messages for common errors
          if (searchResponse.status === 400) {
            if (apiError.message?.includes('API key')) {
              errorMessage = 'All YouTube API keys are invalid. Please check your API key configuration.';
            } else if (apiError.errors) {
              const reasons = apiError.errors.map((e: any) => e.reason).join(', ');
              errorMessage = `YouTube API error: ${reasons}. ${apiError.message}`;
            }
          } else if (searchResponse.status === 403) {
            errorMessage = 'YouTube API quota exceeded on all keys or API keys lack required permissions. Enable YouTube Data API v3 in Google Cloud Console.';
          }
          
          console.error('Detailed API Error:', apiError);
        }
      } catch (e) {
        // Error text is not JSON
      }
      
      throw new Error(errorMessage);
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
    });

    console.log('Fetching video details...');
    const detailsUrl = `${YOUTUBE_API_BASE}/videos?${detailsParams}`;
    const detailsResponse = await makeYouTubeRequest(detailsUrl);
    
    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error('Video details error:', errorText);
      throw new Error('Failed to fetch video details');
    }

    const detailsData = await detailsResponse.json();
    console.log('Video details received:', { count: detailsData.items?.length || 0 });

    // Step 3: Map to our track format
    // Filter and prioritize official music content
    const tracks: YouTubeTrack[] = (detailsData.items || [])
      .filter((item: any) => {
        // Filter out very long videos (likely not music)
        const duration = parseDuration(item.contentDetails.duration);
        return duration > 0 && duration <= 900; // Max 15 minutes
      })
      .map((item: any) => {
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
      })
      .sort((a: YouTubeTrack, b: YouTubeTrack) => {
        // Prioritize tracks from official channels (usually have 'VEVO', 'Official', 'Topic' in artist name)
        const aIsOfficial = /vevo|official|topic/i.test(a.artist);
        const bIsOfficial = /vevo|official|topic/i.test(b.artist);
        if (aIsOfficial && !bIsOfficial) return -1;
        if (!aIsOfficial && bIsOfficial) return 1;
        return 0;
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
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
}

/**
 * Get direct video URL (for use with YouTube IFrame API)
 */
export function getYouTubeVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Get YouTube search suggestions
 * Uses YouTube's suggestion API (JSONP endpoint)
 */
export async function getYouTubeSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    // YouTube suggestion API endpoint
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn('Failed to fetch suggestions:', response.status);
      return [];
    }

    const text = await response.text();
    
    // The response is JSONP format, we need to extract the JSON array
    // Format: window.google.ac.h(query, [suggestions])
    const match = text.match(/\[.*\]/);
    if (!match) {
      return [];
    }

    const data = JSON.parse(match[0]);
    
    // The suggestions are in data[1], each suggestion is an array where [0] is the text
    if (!data[1] || !Array.isArray(data[1])) {
      return [];
    }

    return data[1]
      .map((item: any) => item[0])
      .filter((suggestion: string) => suggestion && typeof suggestion === 'string')
      .slice(0, 8); // Limit to 8 suggestions
  } catch (error) {
    console.error('Error fetching YouTube suggestions:', error);
    return [];
  }
}
