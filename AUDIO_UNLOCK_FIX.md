# Audio Unlock & Track Switching Fix

## Issues Fixed
When playing a new YouTube track from search without refreshing, two problems occurred:
1. The audio unlock prompt wasn't appearing and the music wouldn't play
2. React DOM errors: "Failed to execute 'removeChild' on 'Node'"

## Root Causes

### Issue 1: Audio State Management
1. **Module-level state**: The `audioUnlocked` variable was stored at module level, persisting across component remounts
2. **Player reinitialization**: When switching tracks, the YouTube player was destroyed and recreated, but the unlock state wasn't properly reset
3. **No unlock prompt on subsequent tracks**: The unlock overlay only showed on first load, not when changing tracks

### Issue 2: DOM Cleanup Errors
1. **Improper player destruction**: YouTube player was being destroyed without properly cleaning up its iframe from the DOM
2. **Race condition**: New player was being created before old player's DOM elements were fully removed
3. **React reconciliation conflict**: React was trying to remove child nodes that YouTube player had already modified

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

### 4. Proper DOM Cleanup
Enhanced player initialization to properly cleanup DOM before creating new player:
```tsx
// Clean up existing player before creating new one
if (playerRef.current) {
  try {
    playerRef.current.destroy();
    playerRef.current = null;
  } catch (error) {
    console.error('Error destroying old player:', error);
  }
}

// Clear the container to prevent DOM errors
if (containerRef.current) {
  containerRef.current.innerHTML = '';
}

// Small delay to ensure DOM is clean before creating new player
setTimeout(() => {
  playerRef.current = new YT.Player(containerRef.current, { ... });
}, 50);
```

### 5. Improved Track Switching
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

### 6. Cleanup on Unmount
Added proper cleanup when component unmounts:
```tsx
return () => {
  stopTimeUpdateInterval();
  stopKeepAlive();
  playerInitializedRef.current = false;
  if (playerRef.current) {
    try {
      playerRef.current.destroy();
    } catch (error) {
      console.error('Error destroying player:', error);
    }
    playerRef.current = null;
  }
  // Clear container on cleanup
  if (containerRef.current) {
    containerRef.current.innerHTML = '';
  }
};
```

## How It Works Now

1. **First Track**: User clicks to play → Unlock prompt appears → User clicks to enable audio → Music plays
2. **Subsequent Tracks**: 
   - If audio was unlocked: New track plays automatically with audio
   - If audio wasn't unlocked yet: Unlock prompt appears again
3. **DOM Cleanup**: Old YouTube player is completely removed from DOM before new one is created
4. **No Errors**: Smooth transitions between tracks with no React DOM errors

## Timing Coordination
- **Context delay**: 50ms before setting new videoId
- **Player delay**: 50ms before creating new YT.Player instance
- **Total delay**: ~100ms for smooth transition without DOM conflicts

## Benefits
- ✅ No more silent playback when switching tracks
- ✅ No React DOM errors when changing songs
- ✅ Unlock prompt appears when needed
- ✅ Auto-unmutes subsequent tracks after first unlock
- ✅ Clean DOM state between track changes
- ✅ Proper cleanup prevents memory leaks
- ✅ Compliant with browser autoplay policies

## Testing
- ✅ Play YouTube track from search
- ✅ Switch to another YouTube track (no DOM errors)
- ✅ Mix between YouTube and local tracks
- ✅ Unlock prompt appears when needed
- ✅ Background playback continues working
- ✅ No console errors when switching tracks

## Related Files
- `app/components/youtube-player/youtube-player.tsx` - Player component with DOM cleanup and state management
- `app/contexts/music-context.tsx` - Track switching logic with cleanup delays
