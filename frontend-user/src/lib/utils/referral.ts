/**
 * Utility for preserving and retrieving active referral & UTM parameters across navigation
 */

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

    if (ref && ref.trim()) params.ref = ref.trim().toUpperCase();
    if (campaign && campaign.trim()) {
      params.campaign = campaign.trim();
      params.utm_campaign = campaign.trim();
    }
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
