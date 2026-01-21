# YouTube Suggestions

## Overview

The app now automatically loads **related YouTube music suggestions** based on the currently playing track. When you're listening to a YouTube video, the app fetches similar tracks and displays them in the queue panel.

## Features

### 🎵 Smart Recommendations

- **Automatic Loading** - Suggestions load when playing YouTube tracks
- **Related Videos** - Uses YouTube's recommendation algorithm
- **Music Category** - Filters for music content only
- **Quality Filtered** - Excludes very long videos (non-music content)

### 📱 How to Use

1. **Play a YouTube Track** - Start any song from YouTube search
2. **Open Queue** - Tap the queue icon in the player
3. **View Suggestions** - Click "Suggestions" button to see related tracks
4. **Quick Actions**:
   - **Play Now** ▶️ - Immediately play the suggested track
   - **Add to Queue** ➕ - Queue it up for later

### 🎯 Suggestion Quality

The algorithm prioritizes:
- ✅ Official music channels (VEVO, Topic, Official)
- ✅ Songs under 15 minutes
- ✅ High-quality thumbnails
- ✅ Proper artist/title extraction

### 🔄 Integration with Queue

Suggestions integrate seamlessly with the smart queue system:

1. **Manual Queueing** - Add suggestions to your queue
2. **Auto-Queue Friendly** - Works alongside smart recommendations
3. **No Duplicates** - Won't add songs already in queue

### 🚀 Quick Actions

| Action | How To | Result |
|--------|--------|--------|
| **View Suggestions** | Queue → Suggestions button | Shows related tracks |
| **Play Immediately** | Tap ▶️ on suggestion | Replaces current track |
| **Queue for Later** | Tap ➕ on suggestion | Adds to queue |
| **Hide Suggestions** | Tap Suggestions button again | Collapses list |

### 📊 Display Information

Each suggestion shows:
- **Album Art** - High-quality thumbnail
- **Track Title** - Cleaned and formatted
- **Artist Name** - Extracted from video metadata
- **Quick Actions** - Play and Add buttons

### ⚡ Performance

- **Fast Loading** - Suggestions load in background
- **No Interruption** - Doesn't affect current playback
- **Cached Results** - Reuses data when possible
- **Optimized for Mobile** - Lightweight and responsive

### 🎨 Visual Design

Suggestions have a distinctive purple-themed design to differentiate from queued tracks:
- **Purple tint** - Easy to spot
- **Compact layout** - Fits more on screen
- **Smooth animations** - Polished experience

### 🔐 Privacy

- **No tracking** - Uses public YouTube API
- **No account required** - Works anonymously
- **Minimal data** - Only fetches basic video info

### 💡 Tips

1. **Discover New Music** - Suggestions help you find similar artists
2. **Build Playlists** - Quickly add multiple related tracks
3. **Genre Exploration** - Find tracks in the same style
4. **Artist Deep Dives** - Discover more from the same creator

### 🛠️ Configuration

Suggestions respect your queue settings:
- **Auto-Queue ON** - Suggestions complement smart picks
- **Auto-Queue OFF** - Full manual control
- **Driving Mode** - Can still view and add suggestions

---

**Note:** YouTube suggestions require a valid YouTube API key. The feature gracefully degrades if API is unavailable.
