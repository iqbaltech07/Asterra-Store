/**
 * Utility for preserving and retrieving active referral & UTM parameters across navigation
 */

export function getActiveReferralParams(): Record<string, string> {
  const params: Record<string, string> = {};
  if (typeof window === 'undefined') return params;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref') || localStorage.getItem('asterra_ref');
    const campaign = urlParams.get('utm_campaign') || localStorage.getItem('asterra_utm_campaign');
    const source = urlParams.get('utm_source') || localStorage.getItem('asterra_utm_source');
    const medium = urlParams.get('utm_medium') || localStorage.getItem('asterra_utm_medium');

    if (ref && ref.trim()) params.ref = ref.trim().toUpperCase();
    if (campaign && campaign.trim()) params.utm_campaign = campaign.trim();
    if (source && source.trim()) params.utm_source = source.trim();
    if (medium && medium.trim()) params.utm_medium = medium.trim();
  } catch {}

  return params;
}

export function appendReferralParams(url: string): string {
  if (typeof window === 'undefined') return url;
  const activeParams = getActiveReferralParams();
  if (Object.keys(activeParams).length === 0) return url;

  try {
    const dummyBase = 'https://asterrastore.biz.id';
    const parsed = new URL(url, dummyBase);
    for (const [key, value] of Object.entries(activeParams)) {
      if (!parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, value);
      }
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return parsed.toString();
    }
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return url;
  }
}
