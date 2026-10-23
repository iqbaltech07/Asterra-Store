/**
 * Asterra Store - Client/User Audio Notification & Persistent Queue Engine
 * 
 * Uses exact audio files located in /sounds/:
 * - cancel: /sounds/cancel.mp3
 * - selesai: /sounds/selesai.mp3
 * 
 * Complies with Client/User Rules:
 * 1. Sound Mapping:
 *    - New order created -> NO SOUND (silence)
 *    - User order cancelled -> Putar 'cancel'
 *    - User order completed -> Putar 'selesai'
 *    - Other users' orders -> NO SOUND
 * 2. Sequential FIFO Queue (one audio at a time, waits for onended + 200ms spacing)
 * 3. Persistent Queue across page closes / reloads via localStorage
 * 4. Deduplication by unique orderId + status transition key
 * 5. Browser Autoplay Policy auto-unlocker on user gesture
 * 6. Zero mute toggle (always enabled for order alerts per specification)
 */

export type NotificationSoundType = 'cancel' | 'selesai';

// Backward compatibility alias
export type SoundType =
  | NotificationSoundType
  | 'order'
  | 'new_order'
  | 'payment_verified'
  | 'status_updated'
  | 'alert';

export interface AudioQueueItem {
  id: string; // Unique event key, e.g. "AST-ORD-123:cancelled"
  sound: NotificationSoundType;
  timestamp: number;
}

export interface PlayOptions {
  orderId?: string;
  eventId?: string;
  force?: boolean;
}

const STORAGE_QUEUE_KEY = 'asterra_user_audio_queue';
const STORAGE_PROCESSED_KEY = 'asterra_user_processed_events';
const STORAGE_TRACKED_KEY = 'asterra_user_tracked_orders';
const INTER_SOUND_GAP_MS = 200;
const MAX_PROCESSED_STORE = 500;

class UserNotificationAudioPlayer {
  private queue: AudioQueueItem[] = [];
  private processedEvents: Set<string> = new Set();
  private isPlaying: boolean = false;
  private isAutoplayBlocked: boolean = false;
  private audioCache: Map<NotificationSoundType, HTMLAudioElement> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initClient();
    }
  }

  private initClient() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Load Processed Event Keys
    try {
      const storedProcessed = localStorage.getItem(STORAGE_PROCESSED_KEY);
      if (storedProcessed) {
        const parsed = JSON.parse(storedProcessed);
        if (Array.isArray(parsed)) {
          this.processedEvents = new Set(parsed);
        }
      }
    } catch {}

    // 2. Load Persistent Unplayed Queue
    try {
      const storedQueue = localStorage.getItem(STORAGE_QUEUE_KEY);
      if (storedQueue) {
        const parsed = JSON.parse(storedQueue);
        if (Array.isArray(parsed)) {
          this.queue = parsed;
        }
      }
    } catch {}

    // 3. Preload Audio Elements
    this.preloadAudio();

    // 4. Register Global User Interaction Listeners to unlock autoplay
    this.setupAutoUnlock();

    // 5. Handle tab visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!this.isPlaying && this.queue.length > 0) {
          this.processQueue();
        }
      }
    });

    // 6. Process any restored queue items
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 300);
    }
  }

  private preloadAudio() {
    const sounds: NotificationSoundType[] = ['cancel', 'selesai'];
    sounds.forEach((sound) => {
      try {
        const audio = new Audio(`/sounds/${sound}.mp3`);
        audio.preload = 'auto';
        this.audioCache.set(sound, audio);
      } catch (err) {
        console.warn(`[NotificationAudio] Client preload note for ${sound}:`, err);
      }
    });
  }

  private setupAutoUnlock() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.isAutoplayBlocked = false;
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
    if (!this.isPlaying && this.queue.length > 0) {
      this.processQueue();
    }
    return true;
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
      const arr = Array.from(this.processedEvents);
      const trimmed = arr.length > MAX_PROCESSED_STORE ? arr.slice(arr.length - MAX_PROCESSED_STORE) : arr;
      localStorage.setItem(STORAGE_PROCESSED_KEY, JSON.stringify(trimmed));
    } catch {}
  }

  /**
   * Client-side sound mapping:
   * - order / new_order -> NO SOUND (silence)
   * - cancel / cancelled / expired -> 'cancel'
   * - selesai / completed / paid -> 'selesai'
   */
  private resolveSoundType(type: SoundType): NotificationSoundType | null {
    if (type === 'cancel') return 'cancel';
    if (type === 'selesai') return 'selesai';
    // Orders created or in-process have NO sound for Client/User
    return null;
  }

  /**
   * Enqueues an audio alert for Client/User
   */
  public play(type: SoundType, options?: PlayOptions) {
    if (typeof window === 'undefined') return;

    const resolved = this.resolveSoundType(type);
    if (!resolved) {
      // No sound for this event in Client/User view
      return;
    }

    const uniqueId =
      options?.eventId ||
      (options?.orderId ? `${options.orderId.trim().toUpperCase()}:${resolved}` : `user-evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

    // Deduplication check
    if (!options?.force && this.processedEvents.has(uniqueId)) {
      return;
    }

    this.processedEvents.add(uniqueId);
    this.saveProcessed();

    const item: AudioQueueItem = {
      id: uniqueId,
      sound: resolved,
      timestamp: Date.now(),
    };

    this.queue.push(item);
    this.saveQueue();

    this.processQueue();
  }

  /**
   * Reconciles order state transitions for user's tracked orders across page reloads.
   * If an order transitioned from pending/processing to completed or cancelled while
   * the user was away, enqueues the appropriate audio alert.
   */
  public reconcileUserOrders(orders: Array<{ id: string; status: string }>) {
    if (typeof window === 'undefined' || !Array.isArray(orders)) return;

    let trackedMap: Record<string, string> = {};
    try {
      const stored = localStorage.getItem(STORAGE_TRACKED_KEY);
      if (stored) {
        trackedMap = JSON.parse(stored);
      }
    } catch {}

    orders.forEach((o) => {
      const orderId = String(o.id || '').trim().toUpperCase();
      const currentStatus = String(o.status || '').toLowerCase().trim();
      const previousStatus = trackedMap[orderId];

      if (previousStatus && previousStatus !== currentStatus) {
        // Status transitioned!
        if (
          (currentStatus === 'cancelled' || currentStatus === 'expired' || currentStatus === 'batal') &&
          previousStatus !== 'cancelled'
        ) {
          const eventId = `${orderId}:cancelled`;
          if (!this.processedEvents.has(eventId)) {
            this.play('cancel', { orderId, eventId });
          }
        } else if (
          (currentStatus === 'completed' || currentStatus === 'selesai' || currentStatus === 'paid') &&
          previousStatus !== 'completed' &&
          previousStatus !== 'selesai'
        ) {
          const eventId = `${orderId}:completed`;
          if (!this.processedEvents.has(eventId)) {
            this.play('selesai', { orderId, eventId });
          }
        }
      }

      // Record current status as the baseline
      trackedMap[orderId] = currentStatus;
    });

    try {
      localStorage.setItem(STORAGE_TRACKED_KEY, JSON.stringify(trackedMap));
    } catch {}
  }

  /**
   * FIFO Queue Sequencer for Client/User
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

    try {
      audio.currentTime = 0;
    } catch {}

    const onAudioEnded = () => {
      audio?.removeEventListener('ended', onAudioEnded);
      audio?.removeEventListener('error', onAudioError);

      this.queue.shift();
      this.saveQueue();

      setTimeout(() => {
        this.isPlaying = false;
        this.processQueue();
      }, INTER_SOUND_GAP_MS);
    };

    const onAudioError = (e: Event) => {
      console.warn(`[NotificationAudio] Client playback error for ${sound}:`, e);
      audio?.removeEventListener('ended', onAudioEnded);
      audio?.removeEventListener('error', onAudioError);

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
            this.isAutoplayBlocked = true;
            this.isPlaying = false;
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
}

export const notificationAudio = new UserNotificationAudioPlayer();
export const notificationSound = notificationAudio;

export function playOrderNotificationSound(type: SoundType, options?: PlayOptions) {
  notificationAudio.play(type, options);
}
