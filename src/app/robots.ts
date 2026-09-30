import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://asterrastore.biz.id';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/api/*', '/checkout', '/checkout/*'],
      },
      {
        // Generative AI / Agentic search bots (ChatGPT, Perplexity, Claude, Applebot)
        userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Applebot'],
        allow: ['/', '/products', '/products/*'],
        disallow: ['/admin', '/api/*', '/checkout'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
