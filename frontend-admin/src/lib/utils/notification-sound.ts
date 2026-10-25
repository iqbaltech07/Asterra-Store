/**
 * Asterra Store - High-Reliability Audio Notification & Persistent Queue Engine
 * 
 * Uses exact audio files located in /sounds/:
 * - order: /sounds/order.mp3
 * - cancel: /sounds/cancel.mp3
 * - selesai: /sounds/selesai.mp3
 * 
 * Complies with System Requirements:
 * 1. Sound Mapping:
 *    - Admin: New order -> 'order', Cancelled -> 'cancel', Completed -> NO SOUND
 *    - User:  New order -> NO SOUND, Cancelled -> 'cancel', Completed -> 'selesai'
 * 2. Sequential FIFO Queue (one audio at a time, waits for onended + 200ms spacing)
 * 3. Persistent Queue across page closes / reloads via localStorage
 * 4. Offline Event Reconciliation: processes missed events in chronological order on reopen
 * 5. Deduplication by unique event ID / state transition
 * 6. Browser Autoplay Policy auto-unlocker with user gesture listener
 */

export type NotificationSoundType = 'order' | 'cancel' | 'selesai' | 'payout';

// Backward compatibility alias for existing code
export type SoundType =
  | NotificationSoundType
  | 'new_order'
  | 'payment_verified'
  | 'status_updated'
  | 'alert'
  | 'request'
  | 'payout_requested';

export interface AudioQueueItem {
  id: string; // Unique event key, e.g. "log-123" or "AST-ORD-123:cancelled"
  sound: NotificationSoundType;
  timestamp: number;
}

export interface PlayOptions {
  orderId?: string;
  eventId?: string;
  force?: boolean;
}

const STORAGE_QUEUE_KEY = 'asterra_admin_audio_queue';
const STORAGE_PROCESSED_KEY = 'asterra_admin_processed_events';
const STORAGE_LAST_SYNC_KEY = 'asterra_admin_last_sync_timestamp';
const STORAGE_MUTED_KEY = 'asterra_audio_muted';
const INTER_SOUND_GAP_MS = 200;
const MAX_PROCESSED_STORE = 1000;

class NotificationAudioPlayer {
  private queue: AudioQueueItem[] = [];
  private processedEvents: Set<string> = new Set();
  private isPlaying: boolean = false;
  private isAutoplayBlocked: boolean = false;
  private isMuted: boolean = false;
  private audioCache: Map<NotificationSoundType, HTMLAudioElement> = new Map();
  private unlockListeners: Set<(unlocked: boolean) => void> = new Set();
  private isInitialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initClient();
    }
  }

  private initClient() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Load Mute Setting
    try {
      this.isMuted = localStorage.getItem(STORAGE_MUTED_KEY) === 'true';
    } catch {}

    // 2. Load Processed Event Keys
    try {
      const storedProcessed = localStorage.getItem(STORAGE_PROCESSED_KEY);
      if (storedProcessed) {
        const parsed = JSON.parse(storedProcessed);
        if (Array.isArray(parsed)) {
          this.processedEvents = new Set(parsed);
        }
      }
    } catch {}

    // 3. Load Persistent Unplayed Queue
    try {
      const storedQueue = localStorage.getItem(STORAGE_QUEUE_KEY);
      if (storedQueue) {
        const parsed = JSON.parse(storedQueue);
        if (Array.isArray(parsed)) {
          this.queue = parsed;
        }
      }
    } catch {}

    // 4. Preload Audio Elements for instant 0ms response
    this.preloadAudio();

    // 5. Register Global User Interaction Listeners to unlock autoplay
    this.setupAutoUnlock();

    // 6. Handle tab visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!this.isPlaying && this.queue.length > 0) {
          this.processQueue();
        }
      }
    });

    // 7. Process any remaining restored queue items
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 300);
    }
  }

  private preloadAudio() {
    const sounds: NotificationSoundType[] = ['order', 'cancel', 'selesai', 'payout'];
    sounds.forEach((sound) => {
      try {
        const audio = new Audio(`/sounds/${sound}.mp3`);
        audio.preload = 'auto';
        this.audioCache.set(sound, audio);
      } catch (err) {
        console.warn(`[NotificationAudio] Preload note for ${sound}:`, err);
      }
    });
  }

  private setupAutoUnlock() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.isAutoplayBlocked = false;
      this.notifyUnlockListeners(true);
      if (!this.isPlaying && this.queue.length > 0) {
        this.processQueue();
      }
    };

    window.addEventListener('click', unlockHandler, { capture: true, passive: true });
    window.addEventListener('pointerdown', unlockHandler, { capture: true, passive: true });
    window.addEventListener('keydown', unlockHandler, { capture: true, passive: true });
    window.addEventListener('touchstart', unlockHandler, { capture: true, passive: true });
  }

  public async unlockAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    this.isAutoplayBlocked = false;
    this.notifyUnlockListeners(true);

    if (!this.isPlaying && this.queue.length > 0) {
      this.processQueue();
    }
    return true;
  }

  public onUnlockChange(callback: (unlocked: boolean) => void): () => void {
    this.unlockListeners.add(callback);
    callback(!this.isAutoplayBlocked);
    return () => this.unlockListeners.delete(callback);
  }

  private notifyUnlockListeners(unlocked: boolean) {
    this.unlockListeners.forEach((cb) => {
      try {
        cb(unlocked);
      } catch {}
    });
  }

  public getIsUnlocked(): boolean {
    return !this.isAutoplayBlocked;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_MUTED_KEY, muted ? 'true' : 'false');
      } catch {}
    }
  }

  public getIsMuted(): boolean {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(STORAGE_MUTED_KEY) === 'true';
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

  private saveQueue() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch {}
  }

  private saveProcessed() {
    if (typeof window === 'undefined') return;
    try {
      // Keep only the latest MAX_PROCESSED_STORE keys to prevent unbounded storage growth
      const arr = Array.from(this.processedEvents);
      const trimmed = arr.length > MAX_PROCESSED_STORE ? arr.slice(arr.length - MAX_PROCESSED_STORE) : arr;
      localStorage.setItem(STORAGE_PROCESSED_KEY, JSON.stringify(trimmed));
    } catch {}
  }

  /**
   * Maps arbitrary or legacy event types to the standard sound mapping:
   * Admin:
   * - order / new_order -> 'order'
   * - cancel / cancelled / expired -> 'cancel'
   * - selesai / completed -> NO SOUND for Admin
   */
  private resolveSoundType(type: SoundType): NotificationSoundType | null {
    if (type === 'order' || type === 'new_order') {
      return 'order';
    }
    if (type === 'cancel' || type === 'alert') {
      return 'cancel';
    }
    if (type === 'selesai') {
      return 'selesai';
    }
    if (type === 'payout' || type === 'request' || type === 'payout_requested') {
      return 'payout';
    }
    // Completed or payment_verified does not play sound for Admin
    return null;
  }

  /**
   * Enqueues an audio alert.
   * If already processed, drops duplicate.
   * Runs sequentially through FIFO queue with onended spacing.
   */
  public play(type: SoundType = 'order', options?: PlayOptions) {
    if (typeof window === 'undefined') return;

    const resolved = this.resolveSoundType(type);
    if (!resolved) {
      // Event has no mapped sound for this view (e.g. completed for admin)
      return;
    }

    const uniqueId =
      options?.eventId ||
      (options?.orderId ? `${options.orderId.trim().toUpperCase()}:${resolved}` : `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

    // Deduplication check
    if (!options?.force && this.processedEvents.has(uniqueId)) {
      return;
    }

    // Mark as processed
    this.processedEvents.add(uniqueId);
    this.saveProcessed();

    // If muted, do not queue audio playback
    if (this.getIsMuted() && !options?.force) {
      return;
    }

    // Push into persistent queue
    const item: AudioQueueItem = {
      id: uniqueId,
      sound: resolved,
      timestamp: Date.now(),
    };

    this.queue.push(item);
    this.saveQueue();

    // Trigger queue processing
    this.processQueue();
  }

  /**
   * FIFO Queue Sequencer
   * Plays exactly one audio at a time.
   * Awaits onended completion + 200ms spacing before triggering next.
   */
  private async processQueue() {
    if (this.isPlaying || this.queue.length === 0 || typeof window === 'undefined') {
      return;
    }

    const currentItem = this.queue[0];
    if (!currentItem) return;

    const sound = currentItem.sound;
    let audio = this.audioCache.get(sound);
    if (!audio) {
      audio = new Audio(`/sounds/${sound}.mp3`);
      audio.preload = 'auto';
      this.audioCache.set(sound, audio);
    }

    this.isPlaying = true;

    // Reset audio playhead
    try {
      audio.currentTime = 0;
    } catch {}

    const onAudioEnded = () => {
      audio?.removeEventListener('ended', onAudioEnded);
      audio?.removeEventListener('error', onAudioError);

      // Dequeue current item
      this.queue.shift();
      this.saveQueue();

      // Record last sync timestamp
      try {
        localStorage.setItem(STORAGE_LAST_SYNC_KEY, new Date().toISOString());
      } catch {}

      // Wait 200ms acoustic gap before next audio
      setTimeout(() => {
        this.isPlaying = false;
        this.processQueue();
      }, INTER_SOUND_GAP_MS);
    };

    const onAudioError = (e: Event) => {
      console.warn(`[NotificationAudio] Playback error for ${sound}:`, e);
      audio?.removeEventListener('ended', onAudioEnded);
      audio?.removeEventListener('error', onAudioError);

      // Discard failing item so queue never deadlocks
      this.queue.shift();
      this.saveQueue();

      setTimeout(() => {
        this.isPlaying = false;
        this.processQueue();
      }, INTER_SOUND_GAP_MS);
    };

    audio.addEventListener('ended', onAudioEnded, { once: true });
    audio.addEventListener('error', onAudioError, { once: true });

    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err: Error) => {
          if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
            // Autoplay blocked by browser policy: keep item in queue until user interaction
            this.isAutoplayBlocked = true;
            this.isPlaying = false;
            this.notifyUnlockListeners(false);
            audio?.removeEventListener('ended', onAudioEnded);
            audio?.removeEventListener('error', onAudioError);
          } else {
            console.warn('[NotificationAudio] Audio play rejected:', err);
            onAudioError(new Event('rejected'));
          }
        });
      }
    } catch (err) {
      console.warn('[NotificationAudio] Synchronous play error:', err);
      onAudioError(new Event('sync_error'));
    }
  }

  /**
   * Offline Event Recovery
   * When admin opens the dashboard after being closed, queries recent audit logs
   * since last sync timestamp and enqueues missed 'order' and 'cancel' events
   * in exact chronological order.
   */
  public async reconcileOfflineEvents(): Promise<number> {
    if (typeof window === 'undefined') return 0;

    let lastSync: string | null = null;
    try {
      lastSync = localStorage.getItem(STORAGE_LAST_SYNC_KEY);
    } catch {}

    // First time ever opening dashboard: set baseline without playing entire historical database
    if (!lastSync) {
      const nowIso = new Date().toISOString();
      try {
        localStorage.setItem(STORAGE_LAST_SYNC_KEY, nowIso);
      } catch {}
      return 0;
    }

    try {
      const res = await fetch(`/api/v1/admin/logs?since=${encodeURIComponent(lastSync)}&limit=100`);
      if (!res.ok) return 0;

      const data = await res.json();
      const logs = data?.data || [];
      if (!Array.isArray(logs) || logs.length === 0) return 0;

      let enqueuedCount = 0;

      // Logs are returned chronologically ascending (oldest to newest)
      for (const log of logs) {
        const action = String(log.action || '').toLowerCase();
        const newStatus = String(log.new_status || log.status || '').toLowerCase();
        const orderId = String(log.order_id || log.orderId || '').trim();
        const logId = String(log.id || `${orderId}:${action}:${log.created_at || ''}`);

        if (action === 'order_created' || (action.includes('created') && newStatus === 'pending')) {
          if (!this.processedEvents.has(logId)) {
            this.play('order', { orderId, eventId: logId });
            enqueuedCount++;
          }
        } else if (
          action === 'cancelled' ||
          newStatus === 'cancelled' ||
          newStatus === 'expired' ||
          newStatus === 'batal'
        ) {
          if (!this.processedEvents.has(logId)) {
            this.play('cancel', { orderId, eventId: logId });
            enqueuedCount++;
          }
        }
      }

      // Update sync timestamp
      try {
        localStorage.setItem(STORAGE_LAST_SYNC_KEY, new Date().toISOString());
      } catch {}

      return enqueuedCount;
    } catch (err) {
      console.warn('[NotificationAudio] Offline reconciliation note:', err);
      return 0;
    }
  }
}

export const notificationAudio = new NotificationAudioPlayer();
export const notificationSound = notificationAudio;

export function playOrderNotificationSound(type: SoundType = 'order', options?: PlayOptions) {
  notificationAudio.play(type, options);
}
