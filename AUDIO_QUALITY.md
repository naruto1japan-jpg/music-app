# Audio Quality Settings

## Overview
The music player now includes adjustable audio quality settings for YouTube playback with bandwidth optimization.

## Quality Levels

### Available Options
1. **Low (144p)** - Data Saver mode for limited bandwidth
2. **Medium (360p)** - Balanced quality and data usage
3. **High (480p)** - Good audio quality
4. **HD (720p)** - Premium quality (default)
5. **Full HD (1080p)** - Best quality for high-speed connections
6. **Ultra (4K+)** - Maximum quality for unlimited bandwidth

## Features

### Quality Selection
- Access settings via the **Settings** button (gear icon) in the expanded player
- Click on any quality option to change playback quality
- Settings are saved to localStorage and persist across sessions
- Toast notification confirms quality changes

### Automatic Application
- Quality preference applies to all YouTube tracks
- New tracks automatically use the selected quality
- No need to reload or restart playback

### Performance Optimization
- Higher quality provides better audio fidelity
- Lower quality reduces bandwidth usage
- Recommended: HD (720p) for best balance

## UI Location
- **Mini Player**: No direct access (expand player first)
- **Expanded Player**: Settings button in toggle controls row (hexagonal button)

## Technical Details
- Quality setting stored in `localStorage` as `harmony-flow-audio-quality`
- Default quality: `hd720`
- Quality parameter passed to YouTube IFrame Player API via `vq` playerVar
- Real-time quality switching on setting change
