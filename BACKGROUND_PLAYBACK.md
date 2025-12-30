# Background Playback Guide

This music player now supports background audio playback, allowing music to continue playing even when the app is minimized or the screen is locked.

## Features Implemented

### 1. Media Session API
- Displays currently playing track info in the device's media notification
- Shows track title, artist name, and album artwork
- Provides native playback controls (play, pause, skip forward/backward)
- Works on lock screen and notification center

### 2. Service Worker
- Enables better caching for audio streams
- Helps maintain playback connection when app is backgrounded
- Improves offline capabilities

### 3. Progressive Web App (PWA) Support
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

1. **On Mobile Devices:**
   - Open the app in your browser
   - Play a track
   - Lock your screen or switch to another app
   - Use the media controls in your notification center or lock screen

2. **Installing as PWA:**
   - Open the app in your mobile browser
   - Look for "Add to Home Screen" or "Install App" prompt
   - Once installed, launch from your home screen
   - Enjoy better background playback support

3. **Desktop:**
   - Play music normally
   - Minimize the browser
   - Control playback from system media controls (if supported)

## Troubleshooting

### Music stops when screen locks (iOS Safari)
- Make sure you've interacted with the player (clicked play)
- iOS may require the PWA to be installed for full background support
- Check Settings > Safari > Advanced > Experimental Features > Media Session API

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
- **YouTube IFrame Player API** for video playback
- **Media Session API** for system-level media controls
- **Service Worker** for improved caching and background support
- **Web App Manifest** for PWA installation
