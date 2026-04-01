/**
 * Curated Skills Registry — готовые промпты и инструкции по категориям.
 *
 * Каждый skill — это конкретная инструкция для LLM, которая:
 * - Экономит токены (не нужно "придумывать" best practices)
 * - Повышает качество (проверенные паттерны)
 * - Работает в любой IDE и с любой LLM
 *
 * Структура: категория → массив skills с инструкциями.
 */

export interface CuratedSkill {
  id: string;
  name: string;
  /** Краткое описание — что этот skill даёт */
  description: string;
  /** Для какой категории проекта */
  category: string;
  /** Сам промпт/инструкция — готов к вставке в IDE */
  instruction: string;
  /** Теги для поиска */
  tags: string[];
}

/**
 * Все curated skills, сгруппированные по категориям.
 */
export const CURATED_SKILLS: CuratedSkill[] = [

  // ═══ AUTH ═══
  {
    id: "auth-nextjs-clerk",
    name: "Auth with Clerk (Next.js)",
    description: "Complete auth setup: middleware, protected routes, user roles",
    category: "auth",
    tags: ["clerk", "nextjs", "auth", "middleware", "roles"],
    instruction: `## Auth Implementation (Clerk + Next.js)

### Setup
- Use \`@clerk/nextjs\` package
- Wrap app in \`<ClerkProvider>\` in layout.tsx
- Create middleware.ts in project root with \`clerkMiddleware()\`

### Protected Routes
- Use \`auth()\` in Server Components to get userId
- Use \`useAuth()\` in Client Components
- Protect API routes: \`const { userId } = await auth(); if (!userId) return new Response('Unauthorized', { status: 401 });\`

### Key Rules
- NEVER store passwords — Clerk handles all auth
- Always check \`userId\` before database operations
- Use \`currentUser()\` for profile data, \`auth()\` for just the ID
- Set up webhook for \`user.created\` event to sync users to your database
- Use Clerk's built-in \`<SignIn />\` and \`<SignUp />\` components — don't build custom forms`,
  },
  {
    id: "auth-supabase",
    name: "Auth with Supabase",
    description: "Supabase Auth + RLS for full-stack auth without extra services",
    category: "auth",
    tags: ["supabase", "auth", "rls", "postgresql"],
    instruction: `## Auth Implementation (Supabase Auth)

### Setup
- Use \`@supabase/ssr\` for Next.js (NOT \`@supabase/auth-helpers-nextjs\` — deprecated)
- Create Supabase client with \`createServerClient()\` in server components
- Create browser client with \`createBrowserClient()\` in client components

### Row Level Security (critical!)
- ALWAYS enable RLS on every table: \`ALTER TABLE posts ENABLE ROW LEVEL SECURITY;\`
- Policy pattern: \`CREATE POLICY "Users see own data" ON posts FOR SELECT USING (auth.uid() = user_id);\`
- Without RLS, any authenticated user can read ALL data

### Key Rules
- Use \`supabase.auth.getUser()\` for server-side auth check (verified by Supabase)
- NEVER trust \`supabase.auth.getSession()\` alone — it reads from cookies which can be tampered
- Set up auth callback route at \`/auth/callback\` for OAuth flows
- Use database triggers to auto-create user profile on signup`,
  },

  // ═══ DATABASE ═══
  {
    id: "db-schema-design",
    name: "Database Schema Best Practices",
    description: "Schema design rules: naming, relations, indexes, migrations",
    category: "database",
    tags: ["database", "schema", "postgresql", "migrations", "prisma"],
    instruction: `## Database Schema Design

### Naming
- Tables: plural, snake_case (\`users\`, \`order_items\`)
- Columns: snake_case (\`created_at\`, \`user_id\`)
- Primary keys: always \`id\` (UUID preferred for distributed systems, serial for simple apps)
- Foreign keys: \`{referenced_table_singular}_id\` (\`user_id\`, \`order_id\`)

### Required Columns (every table)
- \`id\` — primary key
- \`created_at\` — timestamp with default NOW()
- \`updated_at\` — timestamp, update via trigger or ORM

### Relations
- Always add foreign key constraints
- Add ON DELETE policy: CASCADE for dependent data, SET NULL for optional refs, RESTRICT for critical refs
- Create indexes on foreign keys and frequently filtered columns

### Migrations
- One migration per logical change
- NEVER modify existing migrations — create new ones
- Always test migration rollback before deploying
- Include seed data for development

### Performance
- Add indexes on columns used in WHERE, JOIN, ORDER BY
- Use composite indexes for multi-column queries: \`CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);\`
- Don't over-index — each index slows writes`,
  },
  {
    id: "db-supabase-patterns",
    name: "Supabase Database Patterns",
    description: "Supabase-specific: RLS, realtime, edge functions, storage",
    category: "database",
    tags: ["supabase", "rls", "realtime", "edge-functions"],
    instruction: `## Supabase Database Patterns

### RLS Policies (Row Level Security)
- Enable on EVERY table — no exceptions
- Pattern for user data: \`USING (auth.uid() = user_id)\`
- Pattern for public data: \`USING (true)\` for SELECT, restrict INSERT/UPDATE/DELETE
- Pattern for admin: \`USING (auth.jwt() ->> 'role' = 'admin')\`
- Test policies with: \`SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claim.sub = 'user-uuid';\`

### Realtime
- Enable only on tables that need it (Settings → Database → Replication)
- Use channels for specific filters: \`supabase.channel('room:123').on('postgres_changes', { table: 'messages', filter: 'room_id=eq.123' })\`

### Edge Functions
- Use for webhooks, background processing, external API calls
- Always validate input with Zod
- Return proper HTTP status codes

### Common Mistakes
- NOT enabling RLS = anyone can read your entire database
- Using service_role key in client code = full database access exposed
- Not adding indexes on foreign keys = slow queries at scale`,
  },

  // ═══ PAYMENTS ═══
  {
    id: "payments-stripe",
    name: "Stripe Payments Integration",
    description: "Stripe Checkout, subscriptions, webhooks, error handling",
    category: "payments",
    tags: ["stripe", "payments", "subscriptions", "webhooks"],
    instruction: `## Stripe Payments Integration

### Checkout (one-time + subscriptions)
- ALWAYS use Stripe Checkout or Payment Elements — never collect card numbers directly
- Create checkout session server-side: \`stripe.checkout.sessions.create({ mode: 'subscription', ... })\`
- Redirect to \`session.url\` — Stripe handles the payment UI
- Set success_url and cancel_url with \`{CHECKOUT_SESSION_ID}\` placeholder

### Webhooks (critical!)
- Listen to: \`checkout.session.completed\`, \`invoice.paid\`, \`customer.subscription.updated\`, \`customer.subscription.deleted\`
- ALWAYS verify webhook signature: \`stripe.webhooks.constructEvent(body, sig, webhookSecret)\`
- Process webhooks idempotently — they can be sent multiple times
- Respond 200 immediately, process asynchronously if heavy

### Subscriptions
- Create products and prices in Stripe Dashboard (not code)
- Store \`stripe_customer_id\` and \`stripe_subscription_id\` in your database
- Check subscription status before granting access: \`subscription.status === 'active'\`
- Handle grace periods: \`past_due\` status means payment failed but subscription not cancelled yet

### Key Rules
- NEVER expose secret key in client code — only use publishable key client-side
- ALWAYS use webhook to confirm payment — don't trust client-side redirect
- Test with Stripe CLI: \`stripe listen --forward-to localhost:3000/api/webhooks/stripe\`
- Use test mode cards: 4242424242424242 (success), 4000000000000002 (decline)`,
  },

  // ═══ AI ═══
  {
    id: "ai-chat-implementation",
    name: "AI Chat Implementation",
    description: "Streaming AI chat: Vercel AI SDK, context management, token limits",
    category: "ai",
    tags: ["ai", "chat", "streaming", "vercel-ai", "openai"],
    instruction: `## AI Chat Implementation

### Use Vercel AI SDK (recommended)
- \`npm install ai @ai-sdk/openai\`
- Server: \`import { streamText } from 'ai'; const result = streamText({ model: openai('gpt-4o'), messages });\`
- Client: \`import { useChat } from 'ai/react'; const { messages, input, handleSubmit } = useChat();\`
- Streaming works automatically — no manual SSE handling needed

### Context Management
- Keep conversation history in state, send full history each request
- Implement token counting: truncate oldest messages when approaching limit
- System prompt: put in first message, keep concise (saves tokens every request)
- For long documents: use RAG (embeddings + vector search) instead of stuffing context

### Token Optimization
- Use \`gpt-4o-mini\` for simple tasks, \`gpt-4o\` for complex reasoning
- Stream responses for better UX (user sees text immediately)
- Cache common responses server-side
- Set \`max_tokens\` to prevent runaway costs

### Key Rules
- NEVER expose API keys in client code — use API route as proxy
- Always add rate limiting to your AI endpoint
- Handle errors gracefully: show "Try again" not error stack traces
- Add abort controller for user cancellation: \`const { stop } = useChat()\``,
  },

  // ═══ DESIGN ═══
  {
    id: "design-nextjs-tailwind",
    name: "UI/UX with Tailwind + shadcn/ui",
    description: "Component patterns, responsive design, dark mode, accessibility",
    category: "design",
    tags: ["tailwind", "shadcn", "ui", "responsive", "a11y"],
    instruction: `## UI Implementation (Tailwind + shadcn/ui)

### Setup
- Use shadcn/ui: \`npx shadcn@latest init\` — gives you customizable, accessible components
- Don't install a full UI library — add components individually: \`npx shadcn@latest add button card dialog\`

### Layout Patterns
- Use CSS Grid for page layouts: \`grid grid-cols-[250px_1fr]\` (sidebar + content)
- Use Flexbox for component layouts: \`flex items-center gap-4\`
- Mobile-first: write base styles for mobile, add \`md:\` and \`lg:\` for larger screens
- Container: \`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\`

### Component Patterns
- Cards: \`rounded-lg border bg-card p-6 shadow-sm\`
- Forms: use shadcn Form + react-hook-form + zod for validation
- Tables: use shadcn DataTable for sortable/filterable data
- Loading: use Skeleton components, not spinners

### Responsive
- Breakpoints: sm(640) md(768) lg(1024) xl(1280) 2xl(1536)
- Hide on mobile: \`hidden md:block\`
- Stack on mobile, row on desktop: \`flex flex-col md:flex-row\`
- Touch targets: minimum 44x44px for interactive elements

### Dark Mode
- Use \`next-themes\` package
- Use semantic colors: \`bg-background text-foreground\` (not \`bg-white\`)
- shadcn/ui supports dark mode out of the box

### Accessibility
- Every image needs alt text
- Every form input needs a label
- Use semantic HTML: \`<main>\`, \`<nav>\`, \`<section>\`, not all \`<div>\`
- Test with keyboard navigation — Tab, Enter, Escape should work`,
  },

  // ═══ MARKETING ═══
  {
    id: "marketing-seo-landing",
    name: "SEO & Landing Page Optimization",
    description: "Meta tags, Open Graph, schema.org, conversion-optimized layout",
    category: "marketing",
    tags: ["seo", "meta", "opengraph", "landing", "conversion"],
    instruction: `## SEO & Landing Page

### Meta Tags (every page)
\`\`\`tsx
export const metadata: Metadata = {
  title: "Page Title — Brand",           // 50-60 chars
  description: "Compelling description",  // 150-160 chars
  openGraph: { title, description, images: [{ url: '/og.png', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image' },
};
\`\`\`

### Landing Page Structure (conversion-optimized)
1. **Hero**: Headline (benefit, not feature) + subheadline + CTA button + hero image
2. **Social Proof**: logos, testimonials, numbers ("10K+ users")
3. **Features**: 3-4 key benefits with icons, not feature list
4. **How it Works**: 3 simple steps with visuals
5. **Pricing**: clear tiers, highlight recommended plan
6. **FAQ**: address top objections
7. **Final CTA**: repeat main call-to-action

### Technical SEO
- Use semantic HTML: h1 (one per page), h2, h3 hierarchy
- Add sitemap.xml: Next.js generates automatically with \`app/sitemap.ts\`
- Add robots.txt: \`app/robots.ts\`
- Add schema.org JSON-LD for rich snippets
- Optimize images: use next/image with proper width/height
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Key Rules
- One H1 per page — the main keyword
- Internal linking between related pages
- Every page should load in < 3 seconds
- Mobile-first — Google indexes mobile version`,
  },

  // ═══ DEPLOY ═══
  {
    id: "deploy-vercel",
    name: "Deploy to Vercel",
    description: "Vercel deployment: env vars, preview, edge, monitoring",
    category: "deploy",
    tags: ["vercel", "deploy", "production", "edge", "preview"],
    instruction: `## Vercel Deployment

### Setup
- Connect GitHub repo to Vercel — auto-deploys on push
- Set environment variables in Vercel Dashboard (not in code!)
- Use \`.env.local\` for development, Vercel env vars for production

### Environment Variables
- Add ALL keys from .env.example to Vercel: Settings → Environment Variables
- Use different values for Preview vs Production (e.g., Stripe test vs live keys)
- Access in code: \`process.env.STRIPE_SECRET_KEY\` (server only) or \`NEXT_PUBLIC_*\` (client)

### Pre-deploy Checklist
- [ ] All env vars set in Vercel
- [ ] Database accessible from Vercel's IP (check Supabase connection pooling)
- [ ] Build succeeds locally: \`npm run build\`
- [ ] No hardcoded localhost URLs
- [ ] Error pages (404, 500) are custom
- [ ] Webhook URLs updated to production domain

### Performance
- Use Edge Runtime for API routes that don't need Node.js: \`export const runtime = 'edge';\`
- Enable ISR for semi-static pages: \`export const revalidate = 3600;\`
- Use \`next/image\` — Vercel optimizes images automatically
- Enable Vercel Analytics for Core Web Vitals monitoring

### Key Rules
- NEVER commit .env files — use .gitignore
- Set up preview deployments for PRs — test before merging
- Use Vercel's built-in analytics, not a separate tool (unless you need more)
- Monitor function execution time — Vercel has limits on serverless functions`,
  },

  // ═══ EMAIL ═══
  {
    id: "email-resend",
    name: "Transactional Email with Resend",
    description: "Resend setup, React Email templates, key events",
    category: "email",
    tags: ["email", "resend", "react-email", "templates"],
    instruction: `## Email with Resend + React Email

### Setup
- \`npm install resend @react-email/components\`
- Create reusable templates with React Email components
- Send via API route: \`const resend = new Resend(process.env.RESEND_API_KEY); await resend.emails.send({ from, to, subject, react: <Template /> });\`

### Key Events to Send Emails
- Welcome email (on signup)
- Email verification
- Password reset
- Payment confirmation / invoice
- Important notifications (order status, etc.)

### Template Pattern
\`\`\`tsx
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';
export function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html><Body><Container>
      <Text>Welcome, {name}!</Text>
      <Button href="https://app.example.com">Get Started</Button>
    </Container></Body></Html>
  );
}
\`\`\`

### Key Rules
- Use a verified domain for "from" address (not personal email)
- Add unsubscribe link for marketing emails (required by law)
- Test emails with Resend's test mode before production
- Keep emails short — one clear call-to-action per email`,
  },

  // ═══ ANALYTICS ═══
  {
    id: "analytics-posthog",
    name: "Product Analytics with PostHog",
    description: "Event tracking, funnels, feature flags, user identification",
    category: "analytics",
    tags: ["analytics", "posthog", "events", "funnels", "feature-flags"],
    instruction: `## Product Analytics (PostHog)

### Setup
- \`npm install posthog-js\`
- Initialize once: \`posthog.init('phc_...', { api_host: 'https://app.posthog.com' })\`
- Wrap app in PostHogProvider for React

### Key Events to Track
- \`user_signed_up\` — with source, plan
- \`feature_used\` — which feature, how often
- \`payment_completed\` — plan, amount
- \`page_viewed\` — automatic with PostHog
- \`error_occurred\` — type, page, user context

### User Identification
- Call \`posthog.identify(userId, { email, plan, createdAt })\` after login
- Call \`posthog.reset()\` on logout
- Group users by company: \`posthog.group('company', companyId)\`

### Feature Flags
- Use for gradual rollouts: \`if (posthog.isFeatureEnabled('new-dashboard')) { ... }\`
- A/B test pricing, UI changes, features
- Server-side flags for API changes

### Key Rules
- Don't track PII (passwords, full credit card numbers)
- Track actions, not pages — "user clicked upgrade" is more useful than "user visited /pricing"
- Set up funnels for key flows: signup → onboarding → first action → payment`,
  },

  // ═══ SECURITY ═══
  {
    id: "security-owasp",
    name: "Security Best Practices (OWASP)",
    description: "Top vulnerabilities to prevent: XSS, SQLi, CSRF, secrets",
    category: "security",
    tags: ["security", "owasp", "xss", "sql-injection", "csrf"],
    instruction: `## Security Checklist

### Input Validation
- Validate ALL user input server-side with Zod or similar
- Never trust client-side validation alone
- Sanitize HTML output to prevent XSS: use framework's built-in escaping (React does this by default)
- Never use \`dangerouslySetInnerHTML\` with user content

### SQL Injection Prevention
- ALWAYS use parameterized queries or ORM (Prisma, Drizzle)
- NEVER concatenate user input into SQL strings
- Use Supabase RLS as additional protection layer

### Authentication
- Use established auth libraries (Clerk, NextAuth, Supabase Auth) — don't roll your own
- Implement rate limiting on login attempts
- Use HTTPS everywhere (Vercel/Netlify do this automatically)
- Store sessions server-side or use signed JWT

### Secrets Management
- NEVER commit .env files or API keys to git
- Add .env to .gitignore BEFORE first commit
- Use different keys for development and production
- Rotate keys if accidentally exposed
- Run \`gitleaks\` to check git history for leaked secrets

### API Security
- Validate request body schema on every endpoint
- Check authorization (not just authentication) — "is this user allowed to do THIS?"
- Add rate limiting to public APIs
- Return minimal error information in production (no stack traces)

### Headers
- Set security headers: \`X-Content-Type-Options: nosniff\`, \`X-Frame-Options: DENY\`
- Use Content-Security-Policy for XSS protection
- Next.js: configure in \`next.config.js\` headers section`,
  },

  // ═══ REVIEW ═══
  {
    id: "review-code-quality",
    name: "Code Review Checklist",
    description: "What to check in every PR: logic, security, performance, style",
    category: "review",
    tags: ["review", "code-quality", "pr", "checklist"],
    instruction: `## Code Review Checklist

### Logic
- Does the code do what it's supposed to?
- Are edge cases handled (empty arrays, null values, concurrent access)?
- Are error paths covered — what happens when things fail?

### Security
- No hardcoded secrets or API keys
- User input validated and sanitized
- Auth checks on every protected endpoint
- SQL queries parameterized

### Performance
- No N+1 queries (fetching in a loop)
- Database queries have appropriate indexes
- Large lists use pagination
- Images optimized (next/image, proper sizes)

### Code Quality
- Functions do one thing and are named clearly
- No duplicated code that should be abstracted
- Types are specific (not \`any\` or \`object\`)
- Error messages are helpful for debugging

### Testing
- Happy path covered
- Error cases tested
- Edge cases (empty input, max limits) tested`,
  },

  // ═══ CMS ═══
  {
    id: "cms-headless",
    name: "Headless CMS Integration",
    description: "Content modeling, API fetching, ISR, preview mode",
    category: "cms",
    tags: ["cms", "sanity", "contentful", "headless", "isr"],
    instruction: `## Headless CMS Integration

### Content Modeling
- Define content types with clear structure: Blog Post, Page, Author, Category
- Use references between types (Author → Blog Post)
- Add slug field for URL-friendly paths
- Include SEO fields (title, description, OG image) on every page type

### Data Fetching (Next.js)
- Use ISR for content pages: \`export const revalidate = 3600;\` (revalidate every hour)
- Fetch at build time for static pages: \`generateStaticParams()\`
- Use draft/preview mode for content editors

### Key Rules
- Cache CMS responses — don't fetch on every request
- Set up webhook from CMS to trigger revalidation on content change
- Keep content structure flat — deeply nested content is hard to query
- Use rich text carefully — sanitize output`,
  },

  // ═══ SEARCH ═══
  {
    id: "search-implementation",
    name: "Search Implementation",
    description: "Full-text search, autocomplete, filters, relevance",
    category: "search",
    tags: ["search", "fulltext", "autocomplete", "typesense", "algolia"],
    instruction: `## Search Implementation

### For simple apps: PostgreSQL full-text search
- Use \`tsvector\` and \`tsquery\` for basic search
- Add GIN index: \`CREATE INDEX idx_search ON products USING GIN(to_tsvector('english', name || ' ' || description));\`
- Supabase: use \`.textSearch()\` method

### For production apps: Typesense or Algolia
- Sync data from your database on every change
- Use instant search UI components for autocomplete
- Configure searchable attributes and ranking rules

### UX Patterns
- Debounce search input (300ms) — don't search on every keystroke
- Show results as user types (instant search)
- Highlight matching text in results
- Add filters (category, price range, date)
- Show "No results" with suggestions

### Key Rules
- Index only searchable fields — don't index everything
- Handle typos with fuzzy matching
- Log search queries to understand what users look for
- Add "Did you mean?" for zero-result queries`,
  },

  // ═══ MONITORING ═══
  {
    id: "monitoring-setup",
    name: "Error Monitoring & Logging",
    description: "Sentry setup, structured logging, alerting, performance monitoring",
    category: "monitoring",
    tags: ["monitoring", "sentry", "logging", "errors", "apm"],
    instruction: `## Monitoring Setup

### Error Tracking (Sentry)
- \`npx @sentry/wizard@latest -i nextjs\`
- Captures unhandled errors automatically
- Add context: \`Sentry.setUser({ id, email })\`
- Create custom breadcrumbs for debugging: \`Sentry.addBreadcrumb({ message: 'User clicked checkout' })\`

### What to Monitor
- Unhandled errors (automatic with Sentry)
- API response times (P50, P95, P99)
- Database query duration
- External API failures (Stripe, auth provider)
- Business metrics: signup rate, payment failures, feature usage

### Alerting
- Critical: any 5xx error, payment webhook failure, auth service down
- Warning: response time > 2s, error rate > 1%, disk usage > 80%
- Info: new deployment, scheduled maintenance

### Key Rules
- Don't log sensitive data (passwords, tokens, PII)
- Use structured logging (JSON format) — not console.log in production
- Set up on-call rotation if you have a team
- Review error dashboard weekly — fix top 3 recurring errors`,
  },

  // ═══ TESTING ═══
  {
    id: "testing-strategy",
    name: "Testing Strategy",
    description: "What to test, testing pyramid, E2E with Playwright",
    category: "testing",
    tags: ["testing", "playwright", "vitest", "e2e", "unit"],
    instruction: `## Testing Strategy

### What to Test (priority order)
1. **Critical user flows** (E2E): signup → login → core action → payment
2. **Business logic** (unit): pricing calculations, permissions, data transforms
3. **API endpoints** (integration): correct responses, auth checks, validation
4. **Edge cases** (unit): empty inputs, max limits, concurrent operations

### Stack
- Unit/Integration: Vitest (fast, ESM-native)
- E2E: Playwright (real browser, multi-browser)
- API: Vitest + supertest

### Playwright E2E Pattern
\`\`\`ts
test('user can sign up and access dashboard', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'Password123!');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Welcome')).toBeVisible();
});
\`\`\`

### Key Rules
- Test behavior, not implementation (test what user sees, not internal state)
- Don't mock everything — integration tests catch real bugs
- Run tests in CI before every merge
- Keep tests fast — slow tests don't get run`,
  },

  // ═══ CACHE ═══
  {
    id: "cache-strategy",
    name: "Caching Strategy",
    description: "What to cache, Redis/Upstash patterns, cache invalidation",
    category: "cache",
    tags: ["cache", "redis", "upstash", "performance"],
    instruction: `## Caching Strategy

### What to Cache
- Database queries that don't change often (user profile, product catalog)
- External API responses (geocoding, exchange rates)
- Computed results (analytics aggregations, search results)
- Session data

### Upstash Redis (serverless, recommended for Vercel)
- \`npm install @upstash/redis\`
- Set/Get: \`await redis.set('user:123', data, { ex: 3600 })\` // 1 hour TTL
- Always set TTL — never cache forever

### Cache Invalidation
- Time-based: set TTL, let cache expire naturally (simplest)
- Event-based: delete cache key when data changes
- Pattern: \`cache-aside\` — check cache first, if miss → fetch → store in cache

### Key Rules
- Cache reads, not writes
- Always have a TTL — stale cache is worse than no cache
- Use consistent key naming: \`resource:id:field\` (e.g., \`user:123:profile\`)
- Don't cache user-specific data in shared cache without proper keys`,
  },

  // ═══ VIDEO ═══
  {
    id: "video-upload",
    name: "Video Upload & Processing",
    description: "Upload pipeline, transcoding, thumbnails, streaming",
    category: "video",
    tags: ["video", "upload", "mux", "streaming", "transcoding"],
    instruction: `## Video Implementation

### Upload Pipeline
- Use presigned URLs for direct upload (don't proxy through your server)
- For Mux: \`const upload = await mux.video.uploads.create({ cors_origin: '*', new_asset_settings: { playback_policy: ['public'] } });\`
- Show upload progress to user

### Playback
- Use Mux Player or HLS.js for adaptive streaming
- Generate thumbnails automatically (Mux does this)
- Support quality selection for different bandwidths

### Key Rules
- Never store video files in your database or git
- Use a dedicated video platform (Mux, Cloudinary) — don't build transcoding yourself
- Set upload size limits
- Compress before upload on client if possible`,
  },

  // ═══ STORAGE ═══
  {
    id: "storage-files",
    name: "File Storage (S3/R2/Supabase)",
    description: "File upload, presigned URLs, image optimization",
    category: "storage",
    tags: ["storage", "s3", "r2", "supabase-storage", "upload"],
    instruction: `## File Storage

### Upload Pattern (presigned URLs)
1. Client requests upload URL from your API
2. API generates presigned URL (S3/R2/Supabase Storage)
3. Client uploads directly to storage (no proxy through server)
4. Client sends file path back to API for saving reference

### Image Optimization
- Use next/image for automatic optimization
- Store originals, serve optimized versions
- Generate thumbnails on upload for listings/previews
- Support WebP/AVIF formats

### Key Rules
- NEVER expose storage credentials to client
- Validate file types server-side (not just client-side)
- Set max file size limits
- Use CDN for serving files (Cloudflare R2 includes free CDN)
- Scan uploaded files for malware in production`,
  },

  // ═══ NOTIFICATIONS ═══
  {
    id: "notifications-setup",
    name: "Notification System",
    description: "In-app, push, email notifications architecture",
    category: "notifications",
    tags: ["notifications", "push", "novu", "realtime"],
    instruction: `## Notification System

### Architecture
- Central notification service that dispatches to channels: in-app, email, push, SMS
- Store notification preferences per user (what channels, what events)
- Queue notifications for reliability (don't send synchronously)

### In-App Notifications
- Use Supabase Realtime or WebSocket for instant delivery
- Store in database: \`notifications\` table with \`user_id, type, title, body, read, created_at\`
- Show unread count badge in UI
- Mark as read on click

### Key Rules
- Let users control notification preferences
- Don't over-notify — batch similar notifications
- Critical notifications (security, payments) should always be sent
- Test notification delivery in staging before production`,
  },
];

/**
 * Получить skills по категории
 */
export function getSkillsByCategory(categoryId: string): CuratedSkill[] {
  return CURATED_SKILLS.filter((s) => s.category === categoryId);
}

/**
 * Получить skills по массиву категорий
 */
export function getSkillsForCategories(categoryIds: string[]): CuratedSkill[] {
  return CURATED_SKILLS.filter((s) => categoryIds.includes(s.category));
}

/**
 * Поиск skills по тегам или ключевым словам
 */
export function searchSkills(query: string): CuratedSkill[] {
  const q = query.toLowerCase();
  return CURATED_SKILLS.filter((s) =>
    s.tags.some((t) => t.includes(q)) ||
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q),
  );
}
