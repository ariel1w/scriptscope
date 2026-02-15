# ScriptScope Deployment Guide

## ✅ What's Been Built

ScriptScope is now fully built and ready for deployment! Here's what's included:

### Core Features
- ✅ Landing page with clear value proposition
- ✅ Upload & analysis flow with progress tracking
- ✅ Advanced AI-powered script analysis
- ✅ PDF report generation
- ✅ Credit system with free trial
- ✅ Paddle payment integration
- ✅ Email notifications (Resend)
- ✅ Blog system
- ✅ Complete legal pages (Terms, Privacy, FAQ)
- ✅ Automated cron jobs for health monitoring, cleanup, and marketing
- ✅ Twitter & LinkedIn automation

## 🚀 Deployment Steps

### 1. Set Up Required Services

You'll need to create accounts and configure these services:

#### **Supabase** (Database - Required)
1. Go to https://supabase.com and create a project
2. Run the SQL from `supabase-schema.sql` in the SQL Editor
3. Go to Settings > API and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

#### **AI Provider** (AI Analysis - Required)
1. Sign up for an AI API account
2. Create an API key
3. Copy to `ANTHROPIC_API_KEY`

#### **Paddle** (Payments - Required for paid plans)
1. Sign up at https://paddle.com
2. Create 3 products:
   - Single Analysis: $39 (1 credit)
   - 3-Pack: $99 (3 credits)
   - 10-Pack: $249 (10 credits)
3. Get your API keys from Developer Tools
4. Copy:
   - API Key → `PADDLE_API_KEY`
   - Webhook Secret → `PADDLE_WEBHOOK_SECRET`
   - Client Token → `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
   - Price IDs → `NEXT_PUBLIC_PADDLE_PRICE_SINGLE`, `NEXT_PUBLIC_PADDLE_PRICE_THREE`, `NEXT_PUBLIC_PADDLE_PRICE_TEN`

#### **Resend** (Email - Required)
1. Sign up at https://resend.com
2. Add and verify your domain
3. Create an API key
4. Copy to `RESEND_API_KEY`
5. Update `fromEmail` in `lib/resend.ts` to use your verified domain

#### **Twitter** (Optional - for marketing automation)
1. Create a Twitter Developer account
2. Create an app with Read & Write permissions
3. Generate API keys and tokens
4. Copy to: `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`

#### **LinkedIn** (Optional - for marketing automation)
1. Create a LinkedIn Company Page
2. Create a LinkedIn App
3. Get an access token
4. Copy to: `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_COMPANY_ID`

### 2. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from the my-app directory
cd my-app
vercel --prod
```

### 3. Configure Environment Variables in Vercel

In the Vercel Dashboard:
1. Go to your project
2. Navigate to Settings > Environment Variables
3. Add ALL the variables listed below (replace with your actual values):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Provider
ANTHROPIC_API_KEY=your-ai-api-key

# Paddle
PADDLE_API_KEY=your-paddle-api-key
PADDLE_WEBHOOK_SECRET=your-paddle-webhook-secret
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your-paddle-client-token
NEXT_PUBLIC_PADDLE_PRICE_SINGLE=pri_xxx
NEXT_PUBLIC_PADDLE_PRICE_THREE=pri_yyy
NEXT_PUBLIC_PADDLE_PRICE_TEN=pri_zzz

# Resend
RESEND_API_KEY=your-resend-key

# Twitter (Optional)
TWITTER_API_KEY=your-twitter-key
TWITTER_API_SECRET=your-twitter-secret
TWITTER_ACCESS_TOKEN=your-access-token
TWITTER_ACCESS_SECRET=your-access-secret

# LinkedIn (Optional)
LINKEDIN_ACCESS_TOKEN=your-linkedin-token
LINKEDIN_COMPANY_ID=your-company-id

# App Settings
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
OWNER_EMAIL=your@email.com
CRON_SECRET=generate-a-random-string-here
```

Generate `CRON_SECRET` with: `openssl rand -hex 32`

### 4. Configure Webhooks

#### Paddle Webhook
1. In Paddle Dashboard > Developer Tools > Notifications
2. Add webhook URL: `https://your-domain.vercel.app/api/webhook/paddle`
3. Subscribe to `transaction.completed` events
4. Copy the webhook secret and update `PADDLE_WEBHOOK_SECRET` in Vercel

### 5. Verify Cron Jobs

1. In Vercel Dashboard > Settings > Cron Jobs
2. Verify all 7 cron jobs are configured (auto-imported from `vercel.json`)
3. The crons should be:
   - Health check (every 10 min)
   - Cleanup (daily 3am)
   - Daily digest (daily 8am)
   - Marketing generate (daily 6am)
   - Twitter post (3x daily)
   - LinkedIn post (daily 11am)
   - Blog post (twice weekly)

### 6. Test Everything

1. **Homepage**: Visit your deployed URL
2. **Free Trial**: Try uploading a test script
3. **Payments**: Test purchase flow (use Paddle sandbox mode)
4. **Emails**: Check that emails are being sent
5. **Cron Jobs**: Manually trigger a cron to test:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
        https://your-domain.vercel.app/api/cron/health
   ```

## 📋 Post-Deployment Checklist

- [ ] Supabase database schema created
- [ ] All environment variables set in Vercel
- [ ] Paddle products created ($39, $99, $249)
- [ ] Paddle webhook configured
- [ ] Resend domain verified
- [ ] Email templates working (test by uploading a script)
- [ ] Free trial working
- [ ] Payment flow working (test with Paddle sandbox)
- [ ] Cron jobs verified in Vercel dashboard
- [ ] Twitter/LinkedIn configured (if using automation)
- [ ] Custom domain added (optional)
- [ ] Analytics set up (optional)

## 🎯 What Happens Automatically

Once deployed, ScriptScope runs itself:

1. **User uploads script** → Analyzed in 3-5 min → Email sent with PDF
2. **Stuck analysis** → Auto-retried up to 3 times → Auto-refunded if failed
3. **Scripts > 24hrs old** → Automatically deleted
4. **Every day** → Marketing content generated
5. **3x daily** → Tweets posted automatically
6. **Daily** → LinkedIn posts, owner gets digest email
7. **Twice weekly** → Blog posts published

## 🔧 Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify Next.js version compatibility
- Review build logs in Vercel Dashboard

### Analysis Fails
- Check AI API key is valid
- Verify AI API quota hasn't been exceeded
- Check Vercel function logs

### Payments Not Working
- Verify Paddle webhook is receiving events
- Check webhook secret matches between Paddle and Vercel
- Test with Paddle sandbox mode first

### Emails Not Sending
- Verify domain is verified in Resend
- Check that `fromEmail` in `lib/resend.ts` uses verified domain
- Review email logs in Resend dashboard

### Cron Jobs Not Running
- Verify `CRON_SECRET` is set in Vercel environment variables
- Check that cron jobs are enabled in Vercel
- View cron logs in Vercel Dashboard > Deployments

## 🎉 You're Done!

ScriptScope is now live and running automatically. Monitor the Vercel dashboard for:
- Function invocations
- Error logs
- Cron job execution

Check your Supabase `daily_stats` table to track:
- Revenue
- Scripts analyzed
- New signups
- Refunds

You'll receive a daily digest email every morning at 8am with stats and any issues.

## 📞 Support

For issues or questions:
- Check the README.md for detailed documentation
- Review Vercel logs for errors
- Contact service providers (Supabase, Paddle, Resend) for their specific issues

---

**Built with passion** ✨
