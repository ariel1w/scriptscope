# ScriptScope

Professional AI-powered script coverage service that runs itself.

## Features

- 🎬 Advanced AI-powered script analysis
- 💳 Integrated payments with Paddle
- 🔒 Secure file handling (auto-delete after 24hrs)
- 🤖 Automated marketing (Twitter, LinkedIn, Blog)
- 📧 Email notifications with Resend
- 🔄 Self-healing (auto-retry, auto-refund)
- 📊 Daily digest reports

## Tech Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: Advanced AI models
- **Payments**: Paddle
- **Email**: Resend
- **Hosting**: Vercel
- **Social**: Twitter API v2, LinkedIn API

## Setup Instructions

### 1. Clone and Install

```bash
cd my-app
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Get your project URL and keys from Settings > API

### 3. Set Up API Keys

Create a `.env.local` file (use `.env.local` as template) and fill in:

#### Supabase
- Get from Supabase Dashboard > Settings > API
- `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (keep secret!)

#### AI Provider
- Sign up for an AI API account
- Generate an API key
- `ANTHROPIC_API_KEY`: Your AI API key

#### Paddle
- Sign up at https://paddle.com
- Create products for Single ($39), 3-Pack ($99), 10-Pack ($249)
- Get API keys from Developer Tools
- `PADDLE_API_KEY`: Your Paddle API key
- `PADDLE_WEBHOOK_SECRET`: Webhook secret for verification
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`: Client-side token
- Set price IDs in `.env.local`:
  - `NEXT_PUBLIC_PADDLE_PRICE_SINGLE`
  - `NEXT_PUBLIC_PADDLE_PRICE_THREE`
  - `NEXT_PUBLIC_PADDLE_PRICE_TEN`

#### Resend
- Sign up at https://resend.com
- Verify your domain
- Get API key from Dashboard
- `RESEND_API_KEY`: Your Resend API key
- Update `fromEmail` in `lib/resend.ts` to use your verified domain

#### Twitter (Optional for marketing automation)
- Create a Twitter Developer account
- Create an app with Read & Write permissions
- Generate API keys and access tokens
- `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`

#### LinkedIn (Optional for marketing automation)
- Create a LinkedIn Company Page
- Create a LinkedIn App
- Get access token
- `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_COMPANY_ID`

#### Other
- `NEXT_PUBLIC_APP_URL`: Your domain (e.g., https://scriptscope.com)
- `OWNER_EMAIL`: Your email for daily digests
- `CRON_SECRET`: Random string for securing cron endpoints (generate with `openssl rand -hex 32`)

### 4. Test Locally

```bash
npm run dev
```

Open http://localhost:3000

### 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**In Vercel Dashboard:**
1. Go to Settings > Environment Variables
2. Add all variables from `.env.local`
3. Go to Settings > Cron Jobs
4. Verify cron jobs are configured (should auto-import from `vercel.json`)
5. Add `CRON_SECRET` to Authorization header for cron endpoints

### 6. Configure Webhooks

**Paddle Webhook:**
- In Paddle Dashboard > Developer Tools > Notifications
- Add webhook URL: `https://your-domain.com/api/webhook/paddle`
- Subscribe to `transaction.completed` events
- Copy webhook secret to `PADDLE_WEBHOOK_SECRET` env var

### 7. Test Everything

1. **Upload Flow**: Try uploading a test script (use free trial)
2. **Payment**: Test purchasing credits (use Paddle sandbox mode)
3. **Cron Jobs**: Manually trigger cron endpoints to test:
   - `curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/health`

## Project Structure

```
my-app/
├── app/                      # Next.js app directory
│   ├── page.tsx             # Landing page
│   ├── analyze/             # Upload & results
│   ├── pricing/             # Pricing page
│   ├── blog/                # Blog pages
│   ├── faq/                 # FAQ page
│   ├── privacy/             # Privacy policy
│   ├── terms/               # Terms of service
│   └── api/                 # API routes
│       ├── upload/          # File upload
│       ├── analyze/         # Run analysis
│       ├── credits/         # Credit management
│       ├── pdf/             # PDF generation
│       ├── checkout/        # Paddle checkout
│       ├── webhook/         # Paddle webhooks
│       └── cron/            # Automated jobs
├── components/              # React components
├── lib/                     # Utilities & clients
│   ├── supabase.ts         # Database client
│   ├── claude.ts           # AI client
│   ├── paddle.ts           # Payment client
│   ├── resend.ts           # Email client
│   ├── twitter.ts          # Twitter client
│   ├── linkedin.ts         # LinkedIn client
│   ├── pdf.ts              # PDF generation
│   ├── extract.ts          # Text extraction
│   └── prompts/            # AI prompts
├── vercel.json             # Cron configuration
└── supabase-schema.sql     # Database schema
```

## Cron Jobs

All cron jobs are defined in `vercel.json`:

- **Health Check** (every 10 min): Monitor stuck analyses, retry/refund
- **Cleanup** (daily 3am): Delete scripts older than 24 hours
- **Daily Digest** (daily 8am): Email owner with yesterday's stats
- **Marketing Generate** (daily 6am): Generate content for the day
- **Twitter Post** (3x daily): Post queued tweets
- **LinkedIn Post** (daily 11am): Post queued LinkedIn content
- **Blog Post** (twice weekly): Publish queued blog posts

## Manual Operations

### View Stats
Query Supabase `daily_stats` table

### Manually Refund
```sql
UPDATE credits
SET credits_remaining = credits_remaining + 1
WHERE email = 'user@example.com';
```

### Clear Marketing Queue
```sql
DELETE FROM content_queue WHERE status = 'queued';
```

## Troubleshooting

### Script analysis fails
- Check AI API key is valid
- Check AI API quota/limits
- View logs in Vercel Dashboard

### Payments not working
- Verify Paddle webhook is receiving events
- Check webhook secret matches
- Use Paddle sandbox mode for testing

### Emails not sending
- Verify domain in Resend
- Check `fromEmail` uses verified domain
- View email logs in Resend dashboard

### Cron jobs not running
- Verify `CRON_SECRET` is set in env vars
- Check cron job authorization header in Vercel
- View cron logs in Vercel Dashboard > Deployments

## Security Notes

- Never commit `.env.local` to git
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- Use Paddle's webhook signature verification
- Secure cron endpoints with `CRON_SECRET`
- Scripts are automatically deleted after 24 hours

## Support

- Email: support@scriptscope.com
- Privacy: privacy@scriptscope.com
- Legal: legal@scriptscope.com

## License

Proprietary. All rights reserved.
