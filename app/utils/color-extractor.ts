/**
 * Extract dominant colors from an image for dynamic backgrounds
 */

export interface DominantColors {
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Extract dominant colors from an image URL
 */
export async function extractColorsFromImage(imageUrl: string): Promise<DominantColors> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(getDefaultColors());
          return;
        }

        // Sample the image at lower resolution for better performance
        const size = 100;
        canvas.width = size;
        canvas.height = size;
        
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size).data;
        
        const colors = analyzeImageData(imageData);
        resolve(colors);
      } catch (error) {
        console.error('Color extraction error:', error);
        resolve(getDefaultColors());
      }
    };
    
    img.onerror = () => {
      resolve(getDefaultColors());
    };
    
    img.src = imageUrl;
  });
}

/**
 * Analyze image data to extract dominant colors
 */
function analyzeImageData(data: Uint8ClampedArray): DominantColors {
  const colorCounts = new Map<string, number>();
  const pixelCount = data.length / 4;
  
  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    // Quantize colors to reduce noise
    const quantizedR = Math.round(r / 32) * 32;
    const quantizedG = Math.round(g / 32) * 32;
    const quantizedB = Math.round(b / 32) * 32;
    
    const key = `${quantizedR},${quantizedG},${quantizedB}`;
    colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
  }
  
  // Sort colors by frequency
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color);
  
  // Get top 3 colors
  const [primary = '30,30,40', secondary = '50,50,60', accent = '70,150,200'] = sortedColors;
  
  return {
    primary: `rgb(${primary})`,
    secondary: `rgb(${secondary})`,
    accent: `rgb(${accent})`,
  };
}

/**
 * Get default colors when extraction fails
 */
function getDefaultColors(): DominantColors {
  return {
    primary: 'rgb(30, 30, 40)',
    secondary: 'rgb(50, 50, 60)',
    accent: 'rgb(70, 150, 200)',
  };
}

/**
 * Create gradient CSS from dominant colors
 */
export function createGradientCSS(colors: DominantColors): string {
  // Enhanced gradient with smoother color transitions for Samsung A14 5G
  return `
    radial-gradient(ellipse at 20% 30%, ${colors.primary}bb 0%, transparent 55%),
    radial-gradient(ellipse at 80% 70%, ${colors.secondary}bb 0%, transparent 55%),
    radial-gradient(ellipse at 50% 50%, ${colors.accent}88 0%, transparent 65%),
    linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)
  `;
}

/**
 * Create dynamic CSS variables for live background theming
 */
export function createThemeVariables(colors: DominantColors): Record<string, string> {
  return {
    '--theme-primary': colors.primary,
    '--theme-secondary': colors.secondary,
    '--theme-accent': colors.accent,
  };
}
