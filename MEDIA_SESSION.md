# Media Session API Implementation

## Overview

The Media Session API has been implemented to provide background playback controls and notification integration for YouTube music playback in Harmony Flow.

## Features

### Background Playback Controls

When a track is playing, users can control playback through:

- **System Notifications**: Play/pause buttons appear in the notification panel
- **Lock Screen**: Media controls on the device lock screen
- **System Media Keys**: Hardware media keys (if available on the device)
- **Picture-in-Picture**: Control playback while using other apps

### Supported Actions

The following media controls are available:

1. **Play**: Resume playback
2. **Pause**: Pause current track
3. **Seek Backward**: Jump back 10 seconds
4. **Seek Forward**: Jump forward 10 seconds
5. **Previous Track**: Go to previous song (optional)
6. **Next Track**: Go to next song (optional)

### Rich Metadata

The player displays rich media information including:

- **Track Title**: Fetched from YouTube video metadata
- **Artist Name**: YouTube channel/author name
- **Album**: "Harmony Flow"
- **Artwork**: Multiple resolution thumbnails from YouTube:
  - 120x90 (default)
  - 320x180 (medium quality)
  - 480x360 (high quality)
  - 512x512 (max resolution)

## Technical Implementation

### YouTube Player Component

Location: `app/components/youtube-player/youtube-player.tsx`

#### Key Functions

**setupMediaSession(player)**
- Initializes Media Session API
- Sets metadata with track information
- Registers action handlers for media controls
- Uses multiple artwork sizes for better compatibility

**updateMediaSessionState(state)**
- Updates playback state (playing, paused, none)
- Syncs with YouTube player state changes

**fetchVideoInfo()**
- Retrieves video metadata from noembed.com API
- Extracts title, artist, and thumbnail information
- Updates Media Session when data is available

### Browser Compatibility

The Media Session API is supported in:
- Chrome/Edge 73+
- Firefox 82+
- Safari 14.1+
- Opera 60+

The implementation includes feature detection:
```typescript
if ('mediaSession' in navigator) {
  // Initialize Media Session
}
```

## Mobile Considerations

### Android

For Android WebView apps, ensure the following setting is enabled:
```java
webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
```

This allows autoplay and background playback to work properly.

### iOS

iOS requires user interaction before playing audio. The implementation handles this with:
- "Tap to Play" overlay on each new track
- Unmute action after user interaction
- Proper handling of autoplay policies

## User Experience

1. **First Play**: User taps "Tap to Play" to unlock audio
2. **Background Play**: Music continues when app is in background
3. **Lock Screen**: Full controls available on lock screen
4. **Notifications**: Playback info and controls in notification panel
5. **Seamless**: Automatic metadata updates when switching tracks

## Testing

To test Media Session integration:

1. Play a YouTube track
2. Lock your device or switch to another app
3. Check lock screen for media controls
4. Verify track information is displayed correctly
5. Test play/pause and seek controls
6. Ensure artwork thumbnails load properly

## Future Enhancements

Potential improvements:
- Position state updates for precise seeking
- Chapter markers support
- Playlist navigation
- Video playback rate control
- Integration with smart speakers/car systems
