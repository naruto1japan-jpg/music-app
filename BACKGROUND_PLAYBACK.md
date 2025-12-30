# Background Playback & Auto-Queue Guide

This music player now supports background audio playback and intelligent auto-queue, allowing music to continue playing seamlessly with smart recommendations.

## Features Implemented

### 1. Auto-Queue with Smart Recommendations
- Learns your music preferences based on listening history
- Automatically queues similar tracks when a song ends
- Prioritizes genres you listen to most frequently
- Avoids replaying recently heard tracks
- Toggle on/off with the sparkle (✨) icon in the player
- Preference saved between sessions

### 2. Media Session API
- Displays currently playing track info in the device's media notification
- Shows track title, artist name, and album artwork
- Provides native playback controls (play, pause, skip forward/backward)
- Works on lock screen and notification center

### 3. Playback Recovery
- Auto-retry mechanism if buffering gets stuck (up to 3 attempts)
- Keep-alive monitoring prevents unexpected stops
- Automatically resumes if playback is interrupted
- Smart detection of playback issues

### 4. Service Worker
- Enables better caching for audio streams
- Helps maintain playback connection when app is backgrounded
- Improves offline capabilities

### 5. Progressive Web App (PWA) Support
- App can be installed on mobile devices
- Works like a native app with standalone display
- Custom theme colors and icons
- Better integration with device audio systems

## Browser Compatibility

### Full Support
- Chrome/Edge (Android & Desktop)
- Safari (iOS 15+ & macOS)
- Firefox (Android & Desktop)

### Partial Support
- Older browsers may not support Media Session API but basic playback will work

## How to Use

1. **Auto-Queue Mode:**
   - Tap the expanded player to see all controls
   - Look for the sparkle (✨) icon in the toggle controls
   - When active/highlighted, auto-queue is enabled
   - The app will learn from your listening habits
   - Automatically plays recommended tracks after each song
   - Turn it off to use traditional sequential/shuffle mode

2. **On Mobile Devices:**
   - Open the app in your browser
   - Play a track
   - Lock your screen or switch to another app
   - Use the media controls in your notification center or lock screen

3. **Installing as PWA:**
   - Open the app in your mobile browser
   - Look for "Add to Home Screen" or "Install App" prompt
   - Once installed, launch from your home screen
   - Enjoy better background playback support

4. **Desktop:**
   - Play music normally
   - Minimize the browser
   - Control playback from system media controls (if supported)

## Troubleshooting

### Music stops unexpectedly
- The app has auto-recovery built in and will try to resume
- If retry fails after 3 attempts, manually click play
- Check your internet connection for YouTube tracks
- Try toggling airplane mode on/off to reset network

### Music stops when screen locks (iOS Safari)
- Make sure you've interacted with the player (clicked play)
- iOS may require the PWA to be installed for full background support
- Check Settings > Safari > Advanced > Experimental Features > Media Session API
- The keep-alive feature will attempt to resume playback

### Auto-queue playing unwanted tracks
- The algorithm learns from your history
- Play more tracks from genres you prefer
- Turn off auto-queue (✨ icon) to use manual mode
- Clear your last played history from the admin panel to reset preferences

### No media controls showing
- Ensure your browser supports Media Session API
- Try refreshing the page
- Check browser permissions for notifications/media

### Audio doesn't start automatically
- Most browsers require user interaction before allowing audio playback
- Click the "Enable Audio" prompt when it appears
- This is a one-time action per session

## Technical Details

The app uses:
- **Genre Preference Learning** - Tracks listening patterns and builds weighted preference map
- **Smart Recommendation Algorithm** - Selects tracks based on genre weights and history
- **YouTube IFrame Player API** for video playback
- **Media Session API** for system-level media controls
- **Keep-Alive Monitoring** - Checks playback state every 5 seconds
- **Auto-Retry Logic** - Up to 3 retry attempts for failed playback
- **Service Worker** for improved caching and background support
- **Web App Manifest** for PWA installation
- **LocalStorage Persistence** - Saves preferences, history, and user tracks
