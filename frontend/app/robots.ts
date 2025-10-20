import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/profile/', '/support/chat/'],
    },
    sitemap: 'https://zuuma.ru/sitemap.xml',
  }
}