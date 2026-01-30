# ChairTime Sitemap Strategy

## Core Pages
| URL | Priority | Update Frequency |
|-----|----------|------------------|
| / | 1.0 | Weekly |
| /features | 0.9 | Monthly |
| /pricing | 0.9 | Monthly |
| /faq | 0.8 | Monthly |
| /for-stylists | 0.9 | Monthly |
| /contact | 0.6 | Yearly |
| /login | 0.3 | Yearly |
| /signup | 0.8 | Monthly |

## Future Content Pages
| URL | Target Keyword | Priority |
|-----|----------------|----------|
| /guides/reduce-no-shows | how to reduce salon no shows | 0.7 |
| /guides/going-independent | freelance hairdresser guide | 0.7 |
| /compare/fresha | fresha alternative ireland | 0.8 |
| /compare/booksy | booksy alternative | 0.7 |
| /for/barbers | barber booking app | 0.8 |
| /for/beauty-therapists | beauty therapist booking | 0.8 |
| /for/mobile-hairdressers | mobile hairdresser app | 0.8 |

## XML Sitemap Template
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://chairtime.vercel.app/</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

## Robots.txt Recommendations
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /book/ (individual booking pages - optional)
Sitemap: https://chairtime.vercel.app/sitemap.xml
```

## Internal Linking Strategy
- Homepage → Features → Pricing (conversion funnel)
- /for-stylists as alternate entry point for solo practitioners
- FAQ links to relevant feature sections
- Comparison pages link to signup with context
- All pages → Homepage via logo
