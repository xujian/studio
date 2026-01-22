# Deployment Guide

## Vercel Deployment (Recommended)

### Prerequisites
- Vercel account
- Supabase project configured
- Gemini API key

### Steps

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   Add all variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (use your Vercel URL)

4. **Update Supabase Redirect URLs**
   - Go to Supabase Dashboard
   - Authentication → URL Configuration
   - Add: `https://your-app.vercel.app/auth/callback`

5. **Deploy**
   - Click Deploy
   - Wait for build to complete
   - Visit your URL

### Post-Deployment

1. Test authentication flow
2. Generate a test image
3. Check storage uploads
4. Verify Gallery works

## Custom Domain

1. Go to Vercel project settings
2. Add custom domain
3. Update DNS records
4. Update Supabase redirect URLs

## Troubleshooting

### Authentication Issues
- Verify redirect URLs in Supabase match deployment URL
- Check environment variables are set correctly

### Image Generation Fails
- Verify Gemini API key is valid
- Check API quotas and limits
- Review server logs in Vercel

### Database Errors
- Verify RLS policies are enabled
- Check service role key is correct
- Review Supabase logs
