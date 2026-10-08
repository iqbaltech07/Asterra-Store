/**
 * High-Reliability Web Audio API Synthesizer for Realtime Order & Payment Alerts
 * Zero external audio files required, zero CORS issues, instant 0ms playback!
 */

export type SoundType = 'new_order' | 'payment_verified' | 'status_updated' | 'alert';

class NotificationSoundPlayer {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
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
   * Play synthesized sound alert based on event type
   */
  public play(type: SoundType = 'new_order') {
    if (this.getIsMuted()) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (type === 'new_order') {
        // Upbeat 3-tone chime for incoming orders: C5 -> E5 -> G5
        this.playTone(ctx, 523.25, now, 0.12, 0.35);
        this.playTone(ctx, 659.25, now + 0.12, 0.14, 0.35);
        this.playTone(ctx, 783.99, now + 0.26, 0.35, 0.45);
      } else if (type === 'payment_verified') {
        // High-clarity 2-tone cash register chime: A5 -> D6
        this.playTone(ctx, 880.0, now, 0.15, 0.4);
        this.playTone(ctx, 1174.66, now + 0.15, 0.4, 0.5);
      } else if (type === 'status_updated') {
        // Pleasant modern ding: F5 -> C6
        this.playTone(ctx, 698.46, now, 0.12, 0.3);
        this.playTone(ctx, 1046.5, now + 0.12, 0.28, 0.35);
      } else {
        // Standard alert
        this.playTone(ctx, 587.33, now, 0.25, 0.3);
      }
    } catch (err) {
      console.warn('[NotificationSound] Audio playback failed:', err);
    }
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    volume: number = 0.3
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }
}

export const notificationSound = new NotificationSoundPlayer();

export function playOrderNotificationSound(type: SoundType = 'new_order') {
  notificationSound.play(type);
}
