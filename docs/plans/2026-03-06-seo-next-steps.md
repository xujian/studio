# SEO Next Steps

## Do Now

### 1. Create OG Image
- File: `/public/og-image.jpg`
- Size: 1200×630px
- Content: logo + tagline
- Blocking: social previews on Twitter/Discord/WhatsApp are blank until this exists

### 2. Submit Sitemap to Google Search Console
- Go to https://search.google.com/search-console
- Add property: `kanojostudio.com`
- Submit sitemap: `https://kanojostudio.com/sitemap.xml`

## Medium Term

### 3. Core Web Vitals
- Run https://pagespeed.web.dev on production URL
- Fix any LCP, CLS, INP issues flagged
- Google uses page speed as a ranking signal

### 4. Content
- Landing page copy is too short to rank well
- Expand with more real text: use cases, FAQ, how-it-works details
- Google rewards substantive, unique content

### 5. Backlinks
- Submit to: Product Hunt, Futurepedia, AI tool directories
- Each external link increases domain authority
- Highest-impact long-term SEO action

## Pending Code Tasks

- **Verify JSON-LD SearchAction** — `app/page.tsx` includes a `potentialAction` pointing search at `/community?q={query}`. Remove if the community page doesn't actually filter by that param.
