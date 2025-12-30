import React from 'react';

interface DeviceInfo {
  manufacturer: string;
  model: string;
  refreshRate: number;
  isHighEnd: boolean;
  gpuTier: 'low' | 'medium' | 'high' | 'ultra';
}

interface PerformanceSettings {
  enableBlur: boolean;
  enableShadows: boolean;
  animationDuration: number;
  enableGradients: boolean;
  enableTransforms: boolean;
  reduceMotion: boolean;
  maxFPS: number;
  enableHardwareAcceleration: boolean;
}

/**
 * Detects device capabilities and optimizes performance accordingly
 * Special optimizations for Xiaomi, iQOO, Vivo, Samsung, and Apple devices
 */
export function usePerformanceOptimizer() {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>({
    manufacturer: 'unknown',
    model: 'unknown',
    refreshRate: 60,
    isHighEnd: true,
    gpuTier: 'medium',
  });

  const [settings, setSettings] = React.useState<PerformanceSettings>({
    enableBlur: true,
    enableShadows: true,
    animationDuration: 300,
    enableGradients: true,
    enableTransforms: true,
    reduceMotion: false,
    maxFPS: 60,
    enableHardwareAcceleration: true,
  });

  React.useEffect(() => {
    detectDevice();
    detectRefreshRate();
    detectGPUTier();
    
    // Apply performance optimizations
    applyOptimizations();
  }, []);

  const detectDevice = () => {
    const ua = navigator.userAgent.toLowerCase();
    let manufacturer = 'unknown';
    let model = 'unknown';
    let isHighEnd = true;

    // Detect Xiaomi devices
    if (ua.includes('mi ') || ua.includes('redmi') || ua.includes('poco')) {
      manufacturer = 'xiaomi';
      // High-end Xiaomi devices
      if (ua.includes('mi 13') || ua.includes('mi 14') || ua.includes('poco f')) {
        isHighEnd = true;
        model = 'flagship';
      } else if (ua.includes('redmi note')) {
        isHighEnd = false;
        model = 'midrange';
      }
    }
    // Detect iQOO devices (Vivo sub-brand)
    else if (ua.includes('iqoo')) {
      manufacturer = 'iqoo';
      // iQOO devices typically have high refresh rates
      isHighEnd = true;
      model = 'gaming';
    }
    // Detect Vivo devices
    else if (ua.includes('vivo')) {
      manufacturer = 'vivo';
      // High-end Vivo devices
      if (ua.includes('x90') || ua.includes('x100')) {
        isHighEnd = true;
        model = 'flagship';
      } else {
        isHighEnd = false;
        model = 'midrange';
      }
    }
    // Detect Samsung devices
    else if (ua.includes('samsung') || ua.includes('sm-')) {
      manufacturer = 'samsung';
      // Galaxy S and Z series are high-end
      if (ua.includes('galaxy s2') || ua.includes('galaxy z') || ua.includes('galaxy s3')) {
        isHighEnd = true;
        model = 'flagship';
      } else if (ua.includes('galaxy a')) {
        isHighEnd = false;
        model = 'midrange';
      }
    }
    // Detect Apple devices
    else if (ua.includes('iphone') || ua.includes('ipad')) {
      manufacturer = 'apple';
      // iPhone 13 Pro and newer support 120Hz ProMotion
      if (ua.includes('iphone1') && (ua.includes('13,') || ua.includes('14,') || ua.includes('15,') || ua.includes('16,'))) {
        isHighEnd = true;
        model = 'pro';
      } else {
        isHighEnd = true;
        model = 'standard';
      }
    }

    setDeviceInfo(prev => ({
      ...prev,
      manufacturer,
      model,
      isHighEnd,
    }));
  };

  const detectRefreshRate = async () => {
    let refreshRate = 60;

    try {
      // Method 1: requestAnimationFrame timing
      const frames: number[] = [];
      let lastTime = performance.now();
      let frameCount = 0;

      const measureFrameRate = () => {
        const currentTime = performance.now();
        const delta = currentTime - lastTime;
        
        if (frameCount > 0) {
          frames.push(1000 / delta);
        }
        
        lastTime = currentTime;
        frameCount++;

        if (frameCount < 60) {
          requestAnimationFrame(measureFrameRate);
        } else {
          // Calculate average FPS
          const avgFPS = frames.reduce((a, b) => a + b, 0) / frames.length;
          
          // Round to common refresh rates
          if (avgFPS > 110) {
            refreshRate = 120;
          } else if (avgFPS > 85) {
            refreshRate = 90;
          } else if (avgFPS > 55) {
            refreshRate = 60;
          } else {
            refreshRate = 30;
          }

          setDeviceInfo(prev => ({ ...prev, refreshRate }));
        }
      };

      requestAnimationFrame(measureFrameRate);
    } catch (error) {
      console.warn('Could not detect refresh rate:', error);
    }
  };

  const detectGPUTier = async () => {
    let gpuTier: 'low' | 'medium' | 'high' | 'ultra' = 'medium';

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (gl && gl instanceof WebGLRenderingContext) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
          
          // Ultra tier - Apple A16/A17, Snapdragon 8 Gen 2/3, Dimensity 9200+
          if (
            renderer.includes('apple a17') ||
            renderer.includes('apple a16') ||
            renderer.includes('adreno 740') ||
            renderer.includes('adreno 750') ||
            renderer.includes('mali-g715') ||
            renderer.includes('immortalis')
          ) {
            gpuTier = 'ultra';
          }
          // High tier - Apple A14/A15, Snapdragon 888/8 Gen 1, Dimensity 9000
          else if (
            renderer.includes('apple a15') ||
            renderer.includes('apple a14') ||
            renderer.includes('adreno 660') ||
            renderer.includes('adreno 730') ||
            renderer.includes('mali-g710') ||
            renderer.includes('mali-g78')
          ) {
            gpuTier = 'high';
          }
          // Low tier - older chips
          else if (
            renderer.includes('adreno 5') ||
            renderer.includes('mali-g5') ||
            renderer.includes('mali-g6')
          ) {
            gpuTier = 'low';
          }
        }
      }

      // Consider device memory
      const memory = (navigator as any).deviceMemory;
      if (memory) {
        if (memory <= 4 && gpuTier === 'high') {
          gpuTier = 'medium';
        } else if (memory >= 12 && gpuTier === 'medium') {
          gpuTier = 'high';
        }
      }

      setDeviceInfo(prev => ({ ...prev, gpuTier }));
    } catch (error) {
      console.warn('Could not detect GPU tier:', error);
    }
  };

  const applyOptimizations = () => {
    const { manufacturer, refreshRate, gpuTier, isHighEnd } = deviceInfo;

    let newSettings: PerformanceSettings = {
      enableBlur: true,
      enableShadows: true,
      animationDuration: 300,
      enableGradients: true,
      enableTransforms: true,
      reduceMotion: false,
      maxFPS: refreshRate,
      enableHardwareAcceleration: true,
    };

    // Ultra-high performance devices (120Hz+)
    if (refreshRate >= 120 && (gpuTier === 'ultra' || gpuTier === 'high')) {
      newSettings = {
        enableBlur: true,
        enableShadows: true,
        animationDuration: 200, // Faster animations for high refresh rate
        enableGradients: true,
        enableTransforms: true,
        reduceMotion: false,
        maxFPS: 120,
        enableHardwareAcceleration: true,
      };
    }
    // High performance devices (90Hz)
    else if (refreshRate >= 90 && (gpuTier === 'high' || gpuTier === 'ultra')) {
      newSettings = {
        enableBlur: true,
        enableShadows: true,
        animationDuration: 250,
        enableGradients: true,
        enableTransforms: true,
        reduceMotion: false,
        maxFPS: 90,
        enableHardwareAcceleration: true,
      };
    }
    // Low-end devices
    else if (gpuTier === 'low' || !isHighEnd) {
      newSettings = {
        enableBlur: false, // Disable expensive blur effects
        enableShadows: false,
        animationDuration: 200, // Shorter to feel snappier
        enableGradients: false,
        enableTransforms: true,
        reduceMotion: true,
        maxFPS: 60,
        enableHardwareAcceleration: true,
      };
    }

    // Device-specific optimizations
    switch (manufacturer) {
      case 'apple':
        // Apple devices handle animations very well
        newSettings.animationDuration = 350;
        newSettings.enableBlur = true;
        break;
      
      case 'samsung':
        // Samsung high-refresh displays
        if (refreshRate >= 120) {
          newSettings.animationDuration = 200;
        }
        break;
      
      case 'iqoo':
      case 'xiaomi':
        // Gaming-focused devices - optimize for performance
        newSettings.enableHardwareAcceleration = true;
        if (refreshRate >= 120) {
          newSettings.animationDuration = 180;
          newSettings.maxFPS = 120;
        }
        break;
      
      case 'vivo':
        // Vivo devices - balanced approach
        if (refreshRate >= 90) {
          newSettings.animationDuration = 220;
        }
        break;
    }

    setSettings(newSettings);
    applyCSSVariables(newSettings);
  };

  const applyCSSVariables = (settings: PerformanceSettings) => {
    const root = document.documentElement;
    
    // Apply animation duration
    root.style.setProperty('--optimized-duration', `${settings.animationDuration}ms`);
    root.style.setProperty('--optimized-duration-fast', `${settings.animationDuration * 0.7}ms`);
    root.style.setProperty('--optimized-duration-slow', `${settings.animationDuration * 1.5}ms`);
    
    // Apply effects based on device capability
    root.style.setProperty('--optimized-blur', settings.enableBlur ? 'blur(20px)' : 'none');
    root.style.setProperty('--optimized-shadow', settings.enableShadows ? 'var(--shadow-3)' : 'none');
    
    // Hardware acceleration
    root.style.setProperty('--optimized-transform', settings.enableHardwareAcceleration ? 'translateZ(0)' : 'none');
    
    // Set FPS limit
    root.setAttribute('data-max-fps', settings.maxFPS.toString());
    root.setAttribute('data-gpu-tier', deviceInfo.gpuTier);
    root.setAttribute('data-manufacturer', deviceInfo.manufacturer);
  };

  React.useEffect(() => {
    if (deviceInfo.refreshRate > 0 && deviceInfo.gpuTier !== 'medium') {
      applyOptimizations();
    }
  }, [deviceInfo]);

  return {
    deviceInfo,
    settings,
    isOptimized: true,
  };
}
