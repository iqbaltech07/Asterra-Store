import Link from 'next/link';

export default function BackendStatusPage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Asterra Store - Core Backend API Service</h1>
      <p>Status: Active and Running</p>
      <ul>
        <li><Link href="/api/health">/api/health</Link></li>
        <li><Link href="/api/v1/products">/api/v1/products</Link></li>
      </ul>
    </main>
  );
}
