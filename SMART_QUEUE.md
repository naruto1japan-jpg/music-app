# Smart Queue System

Your music player now includes an intelligent auto-queue system inspired by Spotify's autoplay feature.

## Features

### 1. **Auto-Queue Toggle** 
- Toggle with the sparkle icon (✨) in the expanded player
- When enabled: Automatically fills your queue with smart recommendations
- When disabled: Manual queue control only

### 2. **Smart Recommendations**
The system learns from your listening habits:
- **Genre Preferences**: Tracks which genres you listen to most
- **Weighted History**: Recent plays have more influence than older ones
- **Intelligent Suggestions**: Recommends songs from your favorite genres
- **No Repeats**: Avoids recently played tracks

### 3. **Auto-Fill Logic**
Automatically adds songs when:
- Queue drops to 1 song or less
- Playing the last track in queue
- After playing a smart recommendation

**Auto-fill behavior:**
- Adds 2 songs at a time
- Prioritizes your most-played genres
- Filters out songs already in queue
- Shows notification when songs are added

### 4. **Manual Queue Management**

**Add to Queue:**
- Click the "+" icon on any music card
- Use the 3-dot menu → "Add to Queue"
- Get instant toast notification

**Queue View:**
- Click the queue icon in the expanded player
- See all upcoming tracks
- Remove individual tracks with the X button
- Clear entire queue with "Clear All"

### 5. **Visual Indicators**
- **Queue Badge**: Shows number of songs in queue
- **Auto-Queue Icon**: Sparkle icon glows when active
- **Toast Notifications**: 
  - "Added to Queue" when manually adding songs
  - "Smart Queue Active" when auto-fill adds songs

## How It Works

### Learning System
```
1. Every song you play → Added to history (last 10 tracks)
2. Genre preference score increases for that genre
3. Recent plays have higher weight than older ones
4. Preferences saved to localStorage
```

### Recommendation Algorithm
```
1. Sort genres by preference score (highest first)
2. Filter available tracks (not in queue, not current)
3. Find tracks from top genres
4. Add random selection from preferred genres
5. Fallback to random if no matches
```

### Auto-Fill Trigger
```
When: Queue length ≤ 1 song
Action: Add 2 smart recommendations
Result: Music never stops playing!
```

## Usage Tips

**For Discovery:**
- Enable Auto-Queue (sparkle icon)
- Let it learn your preferences
- Enjoy endless music flow

**For Control:**
- Disable Auto-Queue
- Manually add songs to queue
- Build your perfect playlist

**Best of Both:**
- Start with Auto-Queue enabled
- Manually add specific songs when desired
- Queue plays manual songs first, then auto-fills
