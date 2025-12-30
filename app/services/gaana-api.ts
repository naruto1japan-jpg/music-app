/**
 * Gaana API Service
 * Provides integration with Gaana's music streaming service
 */

export interface GaanaTrack {
  track_id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  duration: number;
  preview_url?: string;
  stream_url?: string;
}

export interface GaanaSearchResult {
  tracks: GaanaTrack[];
  total: number;
}

const GAANA_API_BASE = 'https://api.gaana.com';

/**
 * Search for tracks on Gaana
 */
export async function searchGaanaTracks(query: string, limit = 20): Promise<GaanaSearchResult> {
  try {
    const response = await fetch(
      `${GAANA_API_BASE}/search.php?key=${encodeURIComponent(query)}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to search Gaana');
    }

    const data = await response.json();
    
    return {
      tracks: data.tracks || [],
      total: data.count || 0,
    };
  } catch (error) {
    console.error('Gaana search error:', error);
    return { tracks: [], total: 0 };
  }
}

/**
 * Get track details from Gaana
 */
export async function getGaanaTrack(trackId: string): Promise<GaanaTrack | null> {
  try {
    const response = await fetch(`${GAANA_API_BASE}/track.php?seokey=${trackId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch track');
    }

    const data = await response.json();
    return data.track || null;
  } catch (error) {
    console.error('Gaana track fetch error:', error);
    return null;
  }
}

/**
 * Get streaming URL for a track
 */
export async function getGaanaStreamUrl(trackId: string): Promise<string | null> {
  try {
    const track = await getGaanaTrack(trackId);
    return track?.stream_url || track?.preview_url || null;
  } catch (error) {
    console.error('Gaana stream URL error:', error);
    return null;
  }
}
