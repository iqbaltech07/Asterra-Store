/**
 * Utility for preserving and retrieving active referral & UTM parameters across navigation
 */

export function getReferralSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const local = localStorage.getItem('asterra_referral_session_id');
    if (local) return local;
    const match = document.cookie.match(/(?:^|;\s*)asterra_referral_session_id=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export function setReferralSessionId(sessionId: string): void {
  if (typeof window === 'undefined' || !sessionId) return;
  try {
    localStorage.setItem('asterra_referral_session_id', sessionId);
    document.cookie = `asterra_referral_session_id=${encodeURIComponent(
      sessionId
    )}; path=/; max-age=2592000; SameSite=Lax`;
  } catch {}
}

export function clearReferralSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('asterra_referral_session_id');
    document.cookie = 'asterra_referral_session_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  } catch {}
}

export function getActiveReferralParams(): Record<string, string> {
  const params: Record<string, string> = {};
  if (typeof window === 'undefined') return params;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlRef = urlParams.get('ref');
    const urlCamp = urlParams.get('campaign') || urlParams.get('utm_campaign');
    const urlSource = urlParams.get('utm_source');
    const urlMedium = urlParams.get('utm_medium');

    if (urlRef && urlRef.trim()) {
      const code = urlRef.trim().toUpperCase();
      localStorage.setItem('asterra_ref', code);
      document.cookie = `asterra_ref=${encodeURIComponent(code)}; path=/; max-age=2592000; SameSite=Lax`;
    }
    if (urlCamp && urlCamp.trim()) {
      const cName = urlCamp.trim();
      localStorage.setItem('asterra_utm_campaign', cName);
      localStorage.setItem('asterra_campaign', cName);
      document.cookie = `asterra_campaign=${encodeURIComponent(cName)}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `asterra_utm_campaign=${encodeURIComponent(cName)}; path=/; max-age=2592000; SameSite=Lax`;
    }
    if (urlSource && urlSource.trim()) {
      localStorage.setItem('asterra_utm_source', urlSource.trim());
      document.cookie = `asterra_utm_source=${encodeURIComponent(urlSource.trim())}; path=/; max-age=2592000; SameSite=Lax`;
    }
    if (urlMedium && urlMedium.trim()) {
      localStorage.setItem('asterra_utm_medium', urlMedium.trim());
      document.cookie = `asterra_utm_medium=${encodeURIComponent(urlMedium.trim())}; path=/; max-age=2592000; SameSite=Lax`;
    }

    const ref = urlRef || localStorage.getItem('asterra_ref');
    const campaign = urlCamp || localStorage.getItem('asterra_utm_campaign') || localStorage.getItem('asterra_campaign');
    const source = urlSource || localStorage.getItem('asterra_utm_source');
    const medium = urlMedium || localStorage.getItem('asterra_utm_medium');
    const sessionId = getReferralSessionId();

    if (ref && ref.trim()) params.ref = ref.trim().toUpperCase();
    if (campaign && campaign.trim()) {
      params.campaign = campaign.trim();
      params.utm_campaign = campaign.trim();
    }
    if (source && source.trim()) params.utm_source = source.trim();
    if (medium && medium.trim()) params.utm_medium = medium.trim();
    if (sessionId) params.referral_session_id = sessionId;
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
      if (key !== 'referral_session_id' && !parsed.searchParams.has(key)) {
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
