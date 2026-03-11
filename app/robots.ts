import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/marketing-admin/',
        '/auth/',
        '/my-reports/',
        '/results/',
      ],
    },
    sitemap: 'https://scriptscope.online/sitemap.xml',
  };
}
