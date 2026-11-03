import { redirect } from 'next/navigation';
import { getStoreBaseUrl } from '@/lib/utils/url';
import { SalesLandingPage } from '@/components/landing/sales-landing-page';

export default async function SalesRootPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = props.searchParams ? await props.searchParams : {};
  const ref = resolvedParams.ref
    ? Array.isArray(resolvedParams.ref)
      ? resolvedParams.ref[0]
      : resolvedParams.ref
    : null;
  const campaign = resolvedParams.campaign
    ? Array.isArray(resolvedParams.campaign)
      ? resolvedParams.campaign[0]
      : resolvedParams.campaign
    : null;

  // If a store customer referral is clicked, forward to customer storefront
  if (ref && !resolvedParams.landing) {
    const storeUrl = getStoreBaseUrl();
    const query = new URLSearchParams();
    query.set('ref', ref);
    if (campaign) query.set('campaign', campaign);
    redirect(`${storeUrl}/?${query.toString()}`);
  }

  // Render official Sales Partner Landing Page for http://localhost:3002/
  return <SalesLandingPage />;
}
