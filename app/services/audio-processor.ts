/**
 * 8D Audio Processing Service
 * Creates immersive 8D surround sound effect using Web Audio API
 */

export interface AudioProcessorOptions {
  rotationSpeed?: number; // Seconds per full rotation (default: 8)
  depth?: number; // 0-1, how pronounced the effect is (default: 0.8)
  enabled?: boolean;
}

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private pannerNode: PannerNode | null = null;
  private gainNode: GainNode | null = null;
  private isInitialized = false;
  private rotationSpeed = 8; // seconds per rotation
  private depth = 0.8;
  private enabled = false;
  private animationFrameId: number | null = null;
  private startTime = 0;

  constructor(options?: AudioProcessorOptions) {
    if (options?.rotationSpeed) this.rotationSpeed = options.rotationSpeed;
    if (options?.depth !== undefined) this.depth = options.depth;
    if (options?.enabled !== undefined) this.enabled = options.enabled;
  }

  /**
   * Initialize audio processing for an audio/video element
   */
  initialize(mediaElement: HTMLAudioElement | HTMLVideoElement): void {
    try {
      // Clean up previous instance
      this.cleanup();

      // Create audio context
      this.audioContext = new AudioContext();

      // Create source from media element
      this.sourceNode = this.audioContext.createMediaElementSource(mediaElement);

      // Create panner node for spatial audio
      this.pannerNode = this.audioContext.createPanner();
      this.pannerNode.panningModel = 'HRTF'; // Head-Related Transfer Function for realistic 3D audio
      this.pannerNode.distanceModel = 'linear';
      this.pannerNode.refDistance = 1;
      this.pannerNode.maxDistance = 10;
      this.pannerNode.rolloffFactor = 1;
      this.pannerNode.coneInnerAngle = 360;
      this.pannerNode.coneOuterAngle = 0;
      this.pannerNode.coneOuterGain = 0;

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1;

      // Connect the audio graph: source -> panner -> gain -> destination
      this.sourceNode.connect(this.pannerNode);
      this.pannerNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Set listener position (at center)
      const listener = this.audioContext.listener;
      if (listener.positionX) {
        listener.positionX.value = 0;
        listener.positionY.value = 0;
        listener.positionZ.value = 0;
      } else {
        listener.setPosition(0, 0, 0);
      }

      // Set listener orientation (facing forward)
      if (listener.forwardX) {
        listener.forwardX.value = 0;
        listener.forwardY.value = 0;
        listener.forwardZ.value = -1;
        listener.upX.value = 0;
        listener.upY.value = 1;
        listener.upZ.value = 0;
      } else {
        listener.setOrientation(0, 0, -1, 0, 1, 0);
      }

      this.isInitialized = true;
      console.log('8D Audio Processor initialized');

      // Start animation if enabled
      if (this.enabled) {
        this.start();
      }
    } catch (error) {
      console.error('Failed to initialize Audio Processor:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Start 8D audio effect (circular panning)
   */
  start(): void {
    if (!this.isInitialized || !this.pannerNode || !this.audioContext) {
      console.warn('Audio processor not initialized');
      return;
    }

    this.enabled = true;
    this.startTime = this.audioContext.currentTime;
    
    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.animate();
    console.log('8D Audio effect started');
  }

  /**
   * Stop 8D audio effect (reset to center)
   */
  stop(): void {
    this.enabled = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Reset panner to center position
    if (this.pannerNode) {
      if (this.pannerNode.positionX) {
        this.pannerNode.positionX.value = 0;
        this.pannerNode.positionY.value = 0;
        this.pannerNode.positionZ.value = -1;
      } else {
        this.pannerNode.setPosition(0, 0, -1);
      }
    }
    
    console.log('8D Audio effect stopped');
  }

  /**
   * Toggle 8D effect on/off
   */
  toggle(): boolean {
    if (this.enabled) {
      this.stop();
    } else {
      this.start();
    }
    return this.enabled;
  }

  /**
   * Set rotation speed
   * @param seconds - Seconds per full rotation
   */
  setRotationSpeed(seconds: number): void {
    this.rotationSpeed = Math.max(1, Math.min(30, seconds)); // Clamp between 1-30 seconds
  }

  /**
   * Set effect depth
   * @param depth - 0 to 1, how pronounced the effect is
   */
  setDepth(depth: number): void {
    this.depth = Math.max(0, Math.min(1, depth)); // Clamp between 0-1
  }

  /**
   * Animation loop for circular panning
   */
  private animate = (): void => {
    if (!this.enabled || !this.pannerNode || !this.audioContext) {
      return;
    }

    // Calculate elapsed time
    const elapsed = this.audioContext.currentTime - this.startTime;
    
    // Calculate angle (0 to 2π) based on rotation speed
    const angle = (elapsed / this.rotationSpeed) * Math.PI * 2;

    // Calculate 3D position on a circle
    // The sound source rotates around the listener
    const radius = 3 * this.depth; // Scale radius by depth
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const y = Math.sin(angle * 2) * radius * 0.3; // Add slight vertical movement

    // Update panner position
    if (this.pannerNode.positionX) {
      this.pannerNode.positionX.value = x;
      this.pannerNode.positionY.value = y;
      this.pannerNode.positionZ.value = z - 1; // Offset slightly forward
    } else {
      this.pannerNode.setPosition(x, y, z - 1);
    }

    // Continue animation
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Check if processor is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stop();

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.pannerNode) {
      this.pannerNode.disconnect();
      this.pannerNode = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isInitialized = false;
  }

  /**
   * Get current state
   */
  getState() {
    return {
      enabled: this.enabled,
      initialized: this.isInitialized,
      rotationSpeed: this.rotationSpeed,
      depth: this.depth,
    };
  }
}

// Export singleton instance
let globalProcessor: AudioProcessor | null = null;

export function getAudioProcessor(): AudioProcessor {
  if (!globalProcessor) {
    // Load settings from localStorage
    const savedEnabled = localStorage.getItem('audio-8d-enabled');
    const savedSpeed = localStorage.getItem('audio-8d-speed');
    const savedDepth = localStorage.getItem('audio-8d-depth');

    globalProcessor = new AudioProcessor({
      enabled: savedEnabled === 'true',
      rotationSpeed: savedSpeed ? parseFloat(savedSpeed) : 8,
      depth: savedDepth ? parseFloat(savedDepth) : 0.8,
    });
  }
  return globalProcessor;
}

export function save8DSettings(enabled: boolean, speed?: number, depth?: number): void {
  localStorage.setItem('audio-8d-enabled', enabled.toString());
  if (speed !== undefined) {
    localStorage.setItem('audio-8d-speed', speed.toString());
  }
  if (depth !== undefined) {
    localStorage.setItem('audio-8d-depth', depth.toString());
  }
}
