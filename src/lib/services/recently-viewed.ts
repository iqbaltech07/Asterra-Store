export interface RecentlyViewedItem {
  id: string;
  name: string;
  slug?: string;
  categoryName?: string;
  price: number;
  priceFormatted?: string;
  imageUrl?: string;
  rating?: string;
  brand?: string;
  viewedAt: number;
}

const STORAGE_KEY = 'asterra_recently_viewed_v1';
const MAX_ITEMS = 4;

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function saveRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecentlyViewed();
    // Remove if already exists to push to top
    const filtered = current.filter((p) => p.id !== item.id && p.slug !== item.slug);
    const updated: RecentlyViewedItem[] = [
      {
        ...item,
        viewedAt: Date.now(),
      },
      ...filtered,
    ].slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota or disabled localStorage
  }
}
