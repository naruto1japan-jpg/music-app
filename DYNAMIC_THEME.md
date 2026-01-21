# Dynamic Theme Colors Feature

## Overview

The app now features **live dynamic theme colors** that automatically extract and apply colors from the currently playing track's album artwork to create immersive, personalized backgrounds.

## How It Works

### 1. Color Extraction

When a track starts playing:
1. Album artwork is loaded into a hidden canvas
2. Image is downsampled to 100x100px for performance
3. Pixels are analyzed (sampling every 4th pixel)
4. Colors are quantized to reduce noise
5. Top 3 dominant colors are extracted

### 2. Gradient Generation

Extracted colors are applied to create:
- **Linear gradient**: Flowing diagonal gradient using all 3 colors
- **Radial gradients**: 3 overlapping radial gradients for depth
- **CSS variables**: Global theme variables for consistent styling

### 3. Live Application

Colors are applied to:
- Background gradients (::before and ::after pseudo-elements)
- Animated liquid flow effect
- Pulsing radial gradients
- Mini-player accents

## Technical Implementation

### Color Extractor (`app/utils/color-extractor.ts`)

```typescript
interface DominantColors {
  primary: string;   // Most dominant color
  secondary: string; // Second most dominant
  accent: string;    // Third most dominant
}
```

### CSS Variables

The following CSS variables are set dynamically:

- `--theme-primary`: Primary color from album art
- `--theme-secondary`: Secondary color from album art
- `--theme-accent`: Accent color from album art
- `--dynamic-gradient`: Linear gradient CSS
- `--dynamic-radial-gradient`: Radial gradients CSS

### Gradient CSS Structure

```css
.layout::before {
  background: var(--dynamic-gradient, /* fallback */);
  animation: liquidFlow 15s ease-in-out infinite;
}

.layout::after {
  background: var(--dynamic-radial-gradient, /* fallback */);
  animation: liquidPulse 20s ease-in-out infinite;
}
```

## Performance Optimizations

### Samsung A14 5G Specific

- Hardware-accelerated animations
- 90Hz refresh rate compatible
- Backface visibility optimization
- Touch interaction optimizations

### General Optimizations

- **Image sampling**: 100x100px canvas (vs full resolution)
- **Pixel sampling**: Every 4th pixel analyzed (75% reduction)
- **Color quantization**: 32-step color grouping
- **Lazy evaluation**: Colors extracted only on track change

### Animation Performance

- **Smooth easing**: `ease-in-out` instead of `linear`
- **Will-change**: Applied to animated backgrounds
- **GPU acceleration**: Transform-based animations
- **Reduced motion**: Respects accessibility preferences

## Visual Effects

### Background Layers

1. **Base layer**: Solid dark gradient (#1a1a2e → #0f0f1e)
2. **Primary radial**: Dominant color at 20% 30% position
3. **Secondary radial**: Secondary color at 80% 70% position
4. **Accent radial**: Accent color at 50% 50% position
5. **Linear flow**: Animated diagonal gradient overlay

### Opacity Tuning

- Linear gradient: 35% opacity
- Radial gradients: 35-50% opacity (animated)
- Ensures text readability while maintaining visual impact

### Animation Cycles

- **Linear flow**: 15-second continuous loop
- **Radial pulse**: 20-second breathing effect
- **Opacity pulse**: 0.35 → 0.5 → 0.4 → 0.5 → 0.35

## User Experience

### Transitions

- **Smooth color shifts**: When tracks change, colors blend seamlessly
- **No jarring changes**: Gradients transition over ~300ms
- **Fallback colors**: Default purple/blue theme if extraction fails

### Visual Consistency

- Theme colors maintain WCAG AA contrast ratios
- Text remains readable against all generated backgrounds
- UI elements (sidebar, player) have semi-transparent overlays

## Browser Compatibility

### Fully Supported

- ✅ Chrome/Edge (all versions with Canvas API)
- ✅ Firefox (all versions)
- ✅ Safari (iOS/macOS)
- ✅ Samsung Internet

### Fallback Behavior

If color extraction fails:
- Uses default gradient (purple/blue theme)
- No visual disruption to user
- Console warning logged for debugging

## Error Handling

### CORS Issues

Images must be served with `crossOrigin="Anonymous"`:
```typescript
img.crossOrigin = 'Anonymous';
```

### Extraction Failures

Default colors provided:
```typescript
{
  primary: 'rgb(30, 30, 40)',
  secondary: 'rgb(50, 50, 60)',
  accent: 'rgb(70, 150, 200)'
}
```

## Future Enhancements

Potential improvements:
- User control over gradient intensity
- Color scheme presets (warm, cool, monochrome)
- Sync with system dark/light mode
- Save favorite color schemes
- Contrast ratio auto-adjustment
