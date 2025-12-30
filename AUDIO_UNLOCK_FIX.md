# Audio Unlock Fix

## Issue Fixed
When playing a new YouTube track from search without refreshing, the audio unlock prompt wasn't appearing and the music wouldn't play.

## Root Causes

1. **Module-level state**: The `audioUnlocked` variable was stored at module level, persisting across component remounts
2. **Player reinitialization**: When switching tracks, the YouTube player was destroyed and recreated, but the unlock state wasn't properly reset
3. **No unlock prompt on subsequent tracks**: The unlock overlay only showed on first load, not when changing tracks

## Solution

### 1. Component-level State
Changed `audioUnlocked` from module-level to component state:
```tsx
// Before: let audioUnlocked = false; (module-level)
// After: const [audioUnlocked, setAudioUnlocked] = React.useState(false);
```

### 2. Player Initialization Tracking
Added `playerInitializedRef` to track when the player is ready:
```tsx
const playerInitializedRef = React.useRef(false);
```

### 3. Show Unlock on Each Track
Modified the `onReady` handler to show unlock prompt for each new track:
```tsx
onReady: (event: any) => {
  playerInitializedRef.current = true;
  
  if (!audioUnlocked) {
    setShowUnlock(true);  // Show unlock for new track
  } else {
    // Auto-unmute if already unlocked
    event.target.unMute();
    event.target.setVolume(100);
  }
}
```

### 4. Improved Track Switching
Enhanced `playTrack` in music context to properly cleanup before switching:
```tsx
// Stop current playback first
if (youtubeVideoId && audioRef.current) {
  audioRef.current.pause();
  audioRef.current.src = '';
}

// Small delay to ensure cleanup before setting new video
setTimeout(() => {
  setYoutubeVideoId(track.youtubeVideoId!);
  setDuration(track.duration);
}, 50);
```

## How It Works Now

1. **First Track**: User clicks to play → Unlock prompt appears → User clicks to enable audio → Music plays
2. **Subsequent Tracks**: 
   - If audio was unlocked: New track plays automatically with audio
   - If audio wasn't unlocked yet: Unlock prompt appears again
3. **Switching Between YouTube and Regular Tracks**: Properly cleanup and reinitialize player

## Testing
- ✅ Play YouTube track from search
- ✅ Switch to another YouTube track
- ✅ Mix between YouTube and local tracks
- ✅ Unlock prompt appears when needed
- ✅ Background playback continues working
