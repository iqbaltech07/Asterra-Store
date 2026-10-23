/**
 * High-Reliability Web Audio API Synthesizer & Sequencer for Realtime Order & Payment Alerts
 * Features:
 * - Zero external audio file dependencies (no 404s, no CORS, 0ms latency)
 * - Browser Autoplay Policy auto-unlocker via user interaction listeners
 * - Audio Queue & Sequencer: prevents sounds from overlapping or clashing ('tidak bentrok')
 * - Order ID Deduplication: prevents repeated chimes on reconnection/duplicate events ('tidak berulang')
 * - Master Dynamics Compressor & Limiter: prevents audio clipping or distortion
 * - State tracking for UI readiness indicators
 */

export type SoundType = 'new_order' | 'payment_verified' | 'status_updated' | 'alert';

export interface PlaySoundOptions {
  orderId?: string;
  force?: boolean;
}

class NotificationSoundPlayer {
  private audioCtx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;
  private isPlaying: boolean = false;
  private unlockListeners: Set<(unlocked: boolean) => void> = new Set();

  // Queue to sequence rapid-fire sounds with pleasant gaps
  private soundQueue: Array<{ type: SoundType; options?: PlaySoundOptions }> = [];
  
  // Deduplication cache: orderId -> timestamp (ms)
  private recentOrderAlerts: Map<string, number> = new Map();
  private readonly DEDUPLICATION_WINDOW_MS = 10000; // 10 seconds deduplication
  private readonly MAX_QUEUE_DEPTH = 3; // Prevent audio flood on bulk sync

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.isMuted = localStorage.getItem('asterra_audio_muted') === 'true';
      } catch {}
      this.setupAutoUnlock();
    }
  }

  /**
   * Registers global one-off listeners to unlock the AudioContext on first user interaction
   */
  private setupAutoUnlock() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.unlockAudio().then((unlocked) => {
        if (unlocked) {
          window.removeEventListener('click', unlockHandler, true);
          window.removeEventListener('pointerdown', unlockHandler, true);
          window.removeEventListener('keydown', unlockHandler, true);
          window.removeEventListener('touchstart', unlockHandler, true);
        }
      });
    };

    window.addEventListener('click', unlockHandler, { capture: true, once: false });
    window.addEventListener('pointerdown', unlockHandler, { capture: true, once: false });
    window.addEventListener('keydown', unlockHandler, { capture: true, once: false });
    window.addEventListener('touchstart', unlockHandler, { capture: true, once: false });
  }

  /**
   * Proactively initialize and resume the Web Audio Context
   */
  public async unlockAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return false;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      if (ctx.state === 'running') {
        this.isUnlocked = true;
        this.notifyUnlockListeners();
        return true;
      }
    } catch (err) {
      console.warn('[NotificationSound] AudioContext unlock attempt note:', err);
    }
    return false;
  }

  public getIsUnlocked(): boolean {
    return this.isUnlocked || (this.audioCtx !== null && this.audioCtx.state === 'running');
  }

  public onUnlockChange(callback: (unlocked: boolean) => void): () => void {
    this.unlockListeners.add(callback);
    callback(this.getIsUnlocked());
    return () => this.unlockListeners.delete(callback);
  }

  private notifyUnlockListeners() {
    const unlocked = this.getIsUnlocked();
    this.unlockListeners.forEach((cb) => {
      try {
        cb(unlocked);
      } catch {}
    });
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();

        // Master Limiter / Compressor to prevent distortion and clipping
        this.compressor = this.audioCtx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-14, this.audioCtx.currentTime);
        this.compressor.knee.setValueAtTime(24, this.audioCtx.currentTime);
        this.compressor.ratio.setValueAtTime(12, this.audioCtx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.audioCtx.currentTime);

        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(0.95, this.audioCtx.currentTime);

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.audioCtx.destination);
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('asterra_audio_muted', muted ? 'true' : 'false');
      } catch {}
    }
  }

  public getIsMuted(): boolean {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('asterra_audio_muted') === 'true';
      } catch {}
    }
    return this.isMuted;
  }

  public isSoundMuted(): boolean {
    return this.getIsMuted();
  }

  public toggleMute(): boolean {
    const next = !this.getIsMuted();
    this.setMuted(next);
    return next;
  }

  /**
   * Enqueue and play synthesized sound alert based on event type.
   * Includes order-ID deduplication and sequential queueing to guarantee
   * sounds never clash or sound distorted ('tidak bentrok').
   */
  public play(type: SoundType = 'new_order', options?: PlaySoundOptions) {
    if (this.getIsMuted()) return;

    const nowMs = Date.now();

    // 1. Order ID Deduplication Check
    if (options?.orderId && !options.force) {
      const cleanId = options.orderId.trim().toUpperCase();
      const lastPlayed = this.recentOrderAlerts.get(cleanId);
      if (lastPlayed && nowMs - lastPlayed < this.DEDUPLICATION_WINDOW_MS) {
        // Silently skip duplicate chime for same order ID within window
        return;
      }
      this.recentOrderAlerts.set(cleanId, nowMs);

      // Clean up old entries
      for (const [id, ts] of this.recentOrderAlerts.entries()) {
        if (nowMs - ts > 30000) {
          this.recentOrderAlerts.delete(id);
        }
      }
    }

    // 2. Queue Depth Management
    if (this.soundQueue.length >= this.MAX_QUEUE_DEPTH) {
      // Discard older queued items to avoid sound cascades
      this.soundQueue.shift();
    }

    this.soundQueue.push({ type, options });
    this.processQueue();
  }

  /**
   * Sequencer: plays queued sounds one by one with a clean spacing interval
   */
  private async processQueue() {
    if (this.isPlaying || this.soundQueue.length === 0) return;

    this.isPlaying = true;
    const nextItem = this.soundQueue.shift();

    if (!nextItem) {
      this.isPlaying = false;
      return;
    }

    try {
      const ctx = this.getAudioContext();
      if (!ctx) {
        this.isPlaying = false;
        return;
      }

      // Auto-resume if in suspended state
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      // If still not running (autoplay restriction), wait for user unlock
      if (ctx.state !== 'running') {
        this.isPlaying = false;
        return;
      }

      this.isUnlocked = true;
      this.notifyUnlockListeners();

      const durationSec = this.synthesizeSound(ctx, nextItem.type);

      // Wait for audio sequence to finish + 250ms pleasant inter-sound spacing
      const waitMs = Math.max(300, Math.round(durationSec * 1000 + 250));
      setTimeout(() => {
        this.isPlaying = false;
        this.processQueue();
      }, waitMs);
    } catch (err) {
      console.warn('[NotificationSound] Playback sequencer note:', err);
      this.isPlaying = false;
      setTimeout(() => this.processQueue(), 200);
    }
  }

  /**
   * Synthesize harmonic, pleasant acoustic notification alerts
   * Returns estimated playback duration in seconds
   */
  private synthesizeSound(ctx: AudioContext, type: SoundType): number {
    const now = ctx.currentTime;
    const outputNode = this.compressor || ctx.destination;

    if (type === 'new_order') {
      // Premium 3-tone ascending chord with bell overtone: C5 -> E5 -> G5
      this.playTone(ctx, outputNode, 523.25, now, 0.14, 0.35); // C5
      this.playTone(ctx, outputNode, 659.25, now + 0.12, 0.16, 0.35); // E5
      this.playTone(ctx, outputNode, 783.99, now + 0.26, 0.38, 0.45); // G5
      // Gentle sparkling overtone
      this.playTone(ctx, outputNode, 1567.98, now + 0.28, 0.25, 0.08); // G6 overtone
      return 0.70;
    }

    if (type === 'payment_verified') {
      // High-clarity 2-tone chime: A5 -> D6 with sparkling chime
      this.playTone(ctx, outputNode, 880.0, now, 0.16, 0.38); // A5
      this.playTone(ctx, outputNode, 1174.66, now + 0.14, 0.42, 0.48); // D6
      this.playTone(ctx, outputNode, 2349.32, now + 0.16, 0.30, 0.07); // D7 overtone
      return 0.60;
    }

    if (type === 'status_updated') {
      // Pleasant modern dual-tone ding: F5 -> C6
      this.playTone(ctx, outputNode, 698.46, now, 0.12, 0.30); // F5
      this.playTone(ctx, outputNode, 1046.5, now + 0.11, 0.28, 0.35); // C6
      return 0.42;
    }

    // Default attention alert tone: D5
    this.playTone(ctx, outputNode, 587.33, now, 0.25, 0.32);
    return 0.28;
  }

  /**
   * Helper: Schedule a single sine wave tone with smooth click-free volume envelope
   */
  private playTone(
    ctx: AudioContext,
    targetNode: AudioNode,
    freq: number,
    startTime: number,
    duration: number,
    volume: number = 0.3
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    // Smooth click-free envelope (exponential attack and decay)
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(targetNode);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }
}

export const notificationSound = new NotificationSoundPlayer();

export function playOrderNotificationSound(type: SoundType = 'new_order', options?: PlaySoundOptions) {
  notificationSound.play(type, options);
}
