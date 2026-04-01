/**
 * Curated Skills Registry — ready-to-use prompts and instructions by category.
 *
 * Each skill is a concrete instruction for an LLM that:
 * - Saves tokens (no need to "figure out" best practices)
 * - Improves quality (proven patterns)
 * - Works in any IDE with any LLM
 *
 * Structure: category → array of skills with instructions.
 */

export interface CuratedSkill {
  id: string;
  name: string;
  /** Short description — what this skill provides */
  description: string;
  /** Which project category this belongs to */
  category: string;
  /** The actual prompt/instruction — ready to embed in IDE */
  instruction: string;
  /** Tags for search */
  tags: string[];
}

/**
 * All curated skills grouped by category.
 */
export const CURATED_SKILLS: CuratedSkill[] = [

  // ═══ AUTH ═══
  {
    id: "auth-setup",
    name: "Authentication Setup",
    description: "Complete auth architecture: providers, sessions, protected routes, roles",
    category: "auth",
    tags: ["auth", "sessions", "oauth", "roles", "middleware"],
    instruction: `## Authentication Implementation

### Architecture
- Use an established auth provider (e.g. Clerk, Supabase Auth, NextAuth, Firebase Auth, Auth0) — never roll your own
- Wrap app in auth provider at the root layout level
- Create auth middleware to protect routes globally

### Protected Routes
- Check auth state in server-side code before rendering protected pages
- Verify user identity on every API route — never trust client-side auth alone
- Return 401 for unauthenticated and 403 for unauthorized requests

### Sessions & Tokens
- Prefer server-verified sessions over client-read tokens
- Never store sensitive auth data in localStorage — use httpOnly cookies
- Implement token refresh logic for long-lived sessions
- Add session timeout for sensitive applications

### Key Rules
- NEVER store or handle passwords manually — delegate to auth provider
- Always check user identity before any database mutation
- Set up webhook/event listener for user creation to sync users to your database
- Use built-in auth UI components when available — don't build custom login forms unless needed
- Implement rate limiting on auth endpoints to prevent brute force attacks
- Support OAuth providers (Google, GitHub) for frictionless signup`,
  },

  // ═══ DATABASE ═══
  {
    id: "db-schema-design",
    name: "Database Schema Best Practices",
    description: "Schema design rules: naming, relations, indexes, migrations",
    category: "database",
    tags: ["database", "schema", "sql", "migrations", "indexes"],
    instruction: `## Database Schema Design

### Naming Conventions
- Tables: plural, snake_case (\`users\`, \`order_items\`)
- Columns: snake_case (\`created_at\`, \`user_id\`)
- Primary keys: always \`id\` (UUID for distributed systems, auto-increment for simple apps)
- Foreign keys: \`{referenced_table_singular}_id\` (\`user_id\`, \`order_id\`)

### Required Columns (every table)
- \`id\` — primary key
- \`created_at\` — timestamp with default NOW()
- \`updated_at\` — timestamp, updated via trigger or ORM hook

### Relations
- Always define foreign key constraints
- Choose ON DELETE policy: CASCADE for dependent data, SET NULL for optional refs, RESTRICT for critical refs
- Create indexes on all foreign key columns

### Migrations
- One migration per logical change
- NEVER modify existing migrations — always create new ones
- Test rollback before deploying
- Include seed data for development and testing

### Performance
- Add indexes on columns used in WHERE, JOIN, ORDER BY
- Use composite indexes for multi-column queries
- Don't over-index — each index slows write operations
- Monitor slow queries and add indexes based on actual usage

### Security
- Enable row-level security (RLS) if your database supports it
- Never expose the database directly to the client
- Use connection pooling for serverless environments`,
  },

  // ═══ PAYMENTS ═══
  {
    id: "payments-integration",
    name: "Payments Integration",
    description: "Payment flow: checkout, subscriptions, webhooks, error handling",
    category: "payments",
    tags: ["payments", "checkout", "subscriptions", "webhooks"],
    instruction: `## Payments Integration

### Checkout Flow
- ALWAYS use the payment provider's hosted checkout or embeddable UI — never collect card numbers directly
- Create checkout sessions server-side, redirect user to the provider's payment page
- Define success and cancel URLs for post-payment redirects

### Webhooks (critical!)
- Listen to key events: payment completed, subscription updated, subscription cancelled, invoice paid, payment failed
- ALWAYS verify webhook signatures — never trust unverified payloads
- Process webhooks idempotently — they can be delivered multiple times
- Respond with 200 immediately, process heavy logic asynchronously

### Subscriptions
- Store customer ID and subscription ID in your database
- Check subscription status before granting access to paid features
- Handle grace periods: a failed payment doesn't mean immediate cancellation
- Support plan upgrades/downgrades via the provider's API

### Key Rules
- NEVER expose secret API keys in client-side code
- NEVER trust client-side payment confirmation — always verify via webhook
- Test with sandbox/test mode before going live
- Use test card numbers provided by your payment provider
- Log all payment events for debugging and auditing
- Implement refund logic from the start`,
  },

  // ═══ AI ═══
  {
    id: "ai-chat-implementation",
    name: "AI Chat Implementation",
    description: "Streaming AI chat: SDK setup, context management, token optimization",
    category: "ai",
    tags: ["ai", "chat", "streaming", "llm", "context"],
    instruction: `## AI Chat Implementation

### Architecture
- Use a dedicated AI SDK (e.g. Vercel AI SDK, LangChain, LlamaIndex) for streaming and model abstraction
- Send requests through a server-side API route — never call LLM APIs from the client
- Stream responses for better UX — users see text as it generates

### Context Management
- Keep conversation history in state, send relevant history with each request
- Implement token counting — truncate or summarize oldest messages when approaching the model's context limit
- Place system prompts at the start, keep them concise (they cost tokens on every request)
- For large documents: use RAG (retrieval-augmented generation) instead of stuffing full text into context

### Token Optimization
- Use smaller/cheaper models for simple tasks, larger models for complex reasoning
- Set \`max_tokens\` to prevent runaway costs
- Cache common responses server-side
- Consider batching requests where applicable

### Key Rules
- NEVER expose API keys in client code — always proxy through your server
- Add rate limiting to AI endpoints
- Handle errors gracefully — show user-friendly retry messages, not stack traces
- Implement request cancellation so users can stop generation
- Log prompt/response pairs for debugging and quality improvement
- Set spending alerts with your LLM provider`,
  },

  // ═══ DESIGN ═══
  {
    id: "design-ui-ux",
    name: "UI/UX Implementation",
    description: "Component patterns, responsive design, dark mode, accessibility",
    category: "design",
    tags: ["ui", "ux", "responsive", "a11y", "components"],
    instruction: `## UI/UX Implementation

### Layout Patterns
- Use CSS Grid for page-level layouts (sidebar + content, dashboard grids)
- Use Flexbox for component-level layouts (nav items, card content)
- Mobile-first: write base styles for mobile, add breakpoints for larger screens
- Consistent container: max-width with horizontal padding

### Component Architecture
- Use a component library or design system (e.g. shadcn/ui, Radix, MUI, Ant Design, Chakra) — don't build primitives from scratch
- Add components individually as needed — don't import entire libraries
- Forms: use a form library with schema validation (e.g. react-hook-form + zod)
- Loading states: prefer skeleton placeholders over spinners

### Responsive Design
- Common breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Stack elements vertically on mobile, horizontally on desktop
- Touch targets: minimum 44x44px for interactive elements on mobile
- Test on real devices, not just browser resize

### Dark Mode
- Use a theming library for system/manual toggle
- Use semantic color tokens (\`background\`, \`foreground\`) instead of hardcoded colors
- Test both themes — don't leave dark mode as an afterthought

### Accessibility (a11y)
- Every image needs alt text
- Every form input needs a label
- Use semantic HTML: \`<main>\`, \`<nav>\`, \`<section>\`, not only \`<div>\`
- Test with keyboard navigation — Tab, Enter, Escape must work
- Ensure sufficient color contrast (WCAG 2.1 AA)`,
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
- Title: 50-60 characters, include primary keyword
- Description: 150-160 characters, compelling and action-oriented
- Open Graph: title, description, image (1200x630px) for social sharing
- Twitter card: \`summary_large_image\` for visual previews

### Landing Page Structure (conversion-optimized)
1. **Hero**: Headline (benefit, not feature) + subheadline + CTA button + visual
2. **Social Proof**: logos, testimonials, metrics ("10K+ users")
3. **Features**: 3-4 key benefits with icons — focus on outcomes, not features
4. **How it Works**: 3 simple steps with visuals
5. **Pricing**: clear tiers, highlight recommended plan
6. **FAQ**: address top objections
7. **Final CTA**: repeat main call-to-action

### Technical SEO
- Use semantic HTML: one h1 per page, proper h2/h3 hierarchy
- Generate sitemap.xml and robots.txt
- Add schema.org JSON-LD for rich search snippets
- Optimize images: use modern formats (WebP/AVIF), proper dimensions, lazy loading
- Core Web Vitals targets: LCP < 2.5s, INP < 200ms, CLS < 0.1

### Key Rules
- One H1 per page containing the primary keyword
- Internal linking between related pages
- Every page should load in under 3 seconds
- Mobile-first — search engines index mobile version first`,
  },

  // ═══ DEPLOY ═══
  {
    id: "deploy-production",
    name: "Production Deployment",
    description: "Deployment pipeline: env vars, previews, monitoring, checklist",
    category: "deploy",
    tags: ["deploy", "production", "ci-cd", "env", "monitoring"],
    instruction: `## Production Deployment

### Setup
- Connect git repository to hosting platform for auto-deploy on push
- Configure environment variables in hosting dashboard — never in code
- Use separate env files for local development (.env.local)

### Environment Variables
- Set ALL required keys in hosting platform settings
- Use different values for preview/staging vs production (e.g. sandbox vs live API keys)
- Prefix client-exposed vars appropriately (e.g. \`NEXT_PUBLIC_\`, \`VITE_\`)

### Pre-deploy Checklist
- [ ] All env vars configured in hosting
- [ ] Database accessible from hosting platform's network
- [ ] Build succeeds locally
- [ ] No hardcoded localhost URLs
- [ ] Custom error pages (404, 500) in place
- [ ] Webhook URLs updated to production domain
- [ ] SSL/HTTPS enabled

### CI/CD Pipeline
- Run linter and type checks before build
- Run tests before deploy — fail fast
- Use preview deployments for pull requests
- Enable automatic rollback on failed health checks

### Performance
- Use edge/CDN for static assets
- Enable caching for static and semi-static pages
- Use image optimization provided by hosting platform
- Enable monitoring/analytics for Core Web Vitals

### Key Rules
- NEVER commit .env files — always use .gitignore
- Use preview deployments to test before merging to main
- Monitor error rates and response times after every deploy
- Have a rollback plan for every deployment`,
  },

  // ═══ EMAIL ═══
  {
    id: "email-transactional",
    name: "Transactional Email",
    description: "Email service setup, templates, key events to email",
    category: "email",
    tags: ["email", "templates", "transactional", "notifications"],
    instruction: `## Transactional Email

### Setup
- Use a dedicated email service (e.g. Resend, SendGrid, Postmark, AWS SES)
- Create reusable email templates (HTML or component-based)
- Send emails from server-side API routes only

### Key Events to Email
- Welcome email on signup
- Email verification
- Password reset
- Payment confirmation / invoice
- Important status changes (order shipped, subscription expiring)

### Template Best Practices
- Keep emails simple — one clear call-to-action per email
- Use inline CSS for email client compatibility
- Include plain text fallback
- Test rendering across email clients (Gmail, Outlook, Apple Mail)

### Key Rules
- Use a verified custom domain for the "from" address
- Add unsubscribe link for marketing emails (legally required in many jurisdictions)
- Test in sandbox/preview mode before sending real emails
- Implement email rate limiting to avoid spam flags
- Never send sensitive data (passwords, tokens) in email body`,
  },

  // ═══ ANALYTICS ═══
  {
    id: "analytics-setup",
    name: "Product Analytics",
    description: "Event tracking, funnels, user identification, feature flags",
    category: "analytics",
    tags: ["analytics", "events", "funnels", "tracking"],
    instruction: `## Product Analytics

### Setup
- Choose an analytics provider (e.g. PostHog, Mixpanel, Amplitude, Google Analytics)
- Initialize once at app root
- Wrap app in analytics provider for automatic page tracking

### Key Events to Track
- \`user_signed_up\` — with source, plan
- \`feature_used\` — which feature, frequency
- \`payment_completed\` — plan, amount
- \`page_viewed\` — automatic with most providers
- \`error_occurred\` — type, page, user context

### User Identification
- Identify users after login with userId and traits (email, plan, created date)
- Reset identity on logout
- Group users by organization/company if applicable

### Feature Flags
- Use for gradual rollouts and A/B testing
- Check flag value before rendering new features
- Support server-side flags for API behavior changes

### Key Rules
- Never track PII (passwords, full credit card numbers)
- Track actions, not just page views — "user clicked upgrade" is more valuable than "user visited /pricing"
- Set up funnels for key conversion flows: signup → onboarding → core action → payment
- Review analytics weekly — data without action is waste`,
  },

  // ═══ SECURITY ═══
  {
    id: "security-checklist",
    name: "Security Best Practices",
    description: "OWASP top vulnerabilities: XSS, SQLi, CSRF, secrets management",
    category: "security",
    tags: ["security", "owasp", "xss", "sql-injection", "csrf"],
    instruction: `## Security Checklist

### Input Validation
- Validate ALL user input server-side with a schema library (e.g. Zod, Joi, Yup)
- Never trust client-side validation alone
- Sanitize HTML output to prevent XSS — use framework's built-in escaping
- Never inject raw user content into HTML

### SQL Injection Prevention
- ALWAYS use parameterized queries or an ORM
- NEVER concatenate user input into SQL strings
- Use row-level security as an additional defense layer

### Authentication & Authorization
- Use established auth libraries — don't roll your own crypto
- Implement rate limiting on login and registration endpoints
- Enforce HTTPS everywhere
- Store sessions server-side or use signed, httpOnly cookies

### Secrets Management
- NEVER commit .env files or API keys to git
- Add .env to .gitignore BEFORE the first commit
- Use different keys for development and production
- Rotate keys immediately if accidentally exposed
- Run secret scanning tools on your git history

### API Security
- Validate request body schema on every endpoint
- Check authorization (not just authentication) — "is this user allowed to do THIS action?"
- Add rate limiting to all public-facing APIs
- Return minimal error details in production — no stack traces

### Headers
- Set security headers: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security
- Use Content-Security-Policy to mitigate XSS
- Configure headers at framework or reverse proxy level`,
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
- Database queries use parameterized inputs

### Performance
- No N+1 queries (fetching in a loop)
- Database queries have appropriate indexes
- Large lists use pagination
- Assets optimized (images, bundles)

### Code Quality
- Functions do one thing and are named clearly
- No duplicated code that should be abstracted
- Types are specific (no \`any\` or \`object\`)
- Error messages are helpful for debugging

### Testing
- Happy path covered
- Error cases tested
- Edge cases (empty input, boundary values) tested`,
  },

  // ═══ CMS ═══
  {
    id: "cms-headless",
    name: "Headless CMS Integration",
    description: "Content modeling, API fetching, caching, preview mode",
    category: "cms",
    tags: ["cms", "headless", "content", "isr"],
    instruction: `## Headless CMS Integration

### Content Modeling
- Define content types with clear structure: Blog Post, Page, Author, Category
- Use references between types (Author → Blog Post)
- Add slug field for URL-friendly paths
- Include SEO fields (title, description, OG image) on every page type

### Data Fetching
- Cache CMS responses — don't fetch on every request
- Use incremental static regeneration (ISR) or stale-while-revalidate for content pages
- Generate static pages at build time where possible
- Support draft/preview mode for content editors

### Key Rules
- Set up webhook from CMS to trigger revalidation on content change
- Keep content structure flat — deeply nested content is hard to query and maintain
- Sanitize rich text output before rendering
- Separate content management from code deployment`,
  },

  // ═══ SEARCH ═══
  {
    id: "search-implementation",
    name: "Search Implementation",
    description: "Full-text search, autocomplete, filters, ranking",
    category: "search",
    tags: ["search", "fulltext", "autocomplete", "filters"],
    instruction: `## Search Implementation

### For simple apps: Database full-text search
- Use your database's built-in full-text search (PostgreSQL tsvector, MySQL FULLTEXT, etc.)
- Add appropriate indexes for search performance
- Good enough for < 100K documents

### For production apps: Dedicated search engine
- Use a search service (e.g. Typesense, Algolia, Meilisearch, Elasticsearch)
- Sync data from your database on every create/update/delete
- Configure searchable attributes and ranking rules

### UX Patterns
- Debounce search input (300ms) — don't search on every keystroke
- Show results as user types (instant search)
- Highlight matching text in results
- Add filters (category, price range, date)
- Show "No results" with alternative suggestions

### Key Rules
- Index only searchable fields — don't index everything
- Enable fuzzy matching for typo tolerance
- Log search queries to understand what users look for
- Add "Did you mean?" for zero-result queries`,
  },

  // ═══ MONITORING ═══
  {
    id: "monitoring-setup",
    name: "Error Monitoring & Logging",
    description: "Error tracking, structured logging, alerting, performance monitoring",
    category: "monitoring",
    tags: ["monitoring", "logging", "errors", "alerting", "apm"],
    instruction: `## Monitoring Setup

### Error Tracking
- Use an error tracking service (e.g. Sentry, Bugsnag, Datadog, LogRocket)
- Capture unhandled errors automatically via SDK
- Add user context to errors for easier debugging
- Create breadcrumbs for user action trails before error

### What to Monitor
- Unhandled errors (automatic with error tracking SDK)
- API response times (P50, P95, P99)
- Database query duration
- External API failures (payment provider, auth service, etc.)
- Business metrics: signup rate, payment failures, feature usage

### Alerting Rules
- Critical: any 5xx error spike, payment webhook failure, auth service down
- Warning: response time > 2s, error rate > 1%, resource usage > 80%
- Info: new deployment, scheduled maintenance

### Key Rules
- Never log sensitive data (passwords, tokens, PII)
- Use structured logging (JSON format) — not console.log in production
- Review error dashboard weekly — fix top 3 recurring errors
- Set up on-call rotation if you have a team`,
  },

  // ═══ TESTING ═══
  {
    id: "testing-strategy",
    name: "Testing Strategy",
    description: "What to test, testing pyramid, E2E, unit, integration",
    category: "testing",
    tags: ["testing", "e2e", "unit", "integration"],
    instruction: `## Testing Strategy

### What to Test (priority order)
1. **Critical user flows** (E2E): signup → login → core action → payment
2. **Business logic** (unit): pricing calculations, permissions, data transforms
3. **API endpoints** (integration): correct responses, auth checks, validation
4. **Edge cases** (unit): empty inputs, boundary values, concurrent operations

### Stack Options
- Unit/Integration: Vitest, Jest, pytest, Go test, etc. (use what fits your stack)
- E2E: Playwright, Cypress (real browser testing)
- API: framework test client or HTTP testing library

### E2E Pattern
- Test the full user journey, not individual UI elements
- Use realistic test data
- Assert on visible outcomes (URL changed, text appeared), not internal state
- Keep E2E tests focused — don't duplicate unit test coverage

### Key Rules
- Test behavior, not implementation details
- Don't mock everything — integration tests catch real bugs
- Run tests in CI before every merge
- Keep tests fast — slow tests don't get run
- Aim for confidence, not coverage percentage`,
  },

  // ═══ CACHE ═══
  {
    id: "cache-strategy",
    name: "Caching Strategy",
    description: "What to cache, patterns, invalidation strategies",
    category: "cache",
    tags: ["cache", "redis", "performance", "invalidation"],
    instruction: `## Caching Strategy

### What to Cache
- Database queries that don't change often (user profile, product catalog)
- External API responses (geocoding, exchange rates, third-party data)
- Computed results (analytics aggregations, search results)
- Session data and auth tokens

### Cache Patterns
- **Cache-aside**: check cache first → if miss, fetch from source → store in cache
- **Write-through**: write to cache and database simultaneously
- **TTL-based**: set expiration, let cache expire naturally (simplest)
- **Event-based**: invalidate cache when underlying data changes

### Implementation
- Use an in-memory store for caching (e.g. Redis, Memcached, Upstash, DragonflyDB)
- Always set TTL — never cache forever
- Use consistent key naming: \`resource:id:field\` (e.g. \`user:123:profile\`)

### Key Rules
- Cache reads, not writes
- Stale cache is often worse than no cache — always have a TTL
- Don't cache user-specific data in shared cache without proper key isolation
- Monitor cache hit rate — low hit rate means your caching strategy needs adjustment
- Start without cache, add when you have measured performance bottlenecks`,
  },

  // ═══ VIDEO ═══
  {
    id: "video-upload",
    name: "Video Upload & Streaming",
    description: "Upload pipeline, transcoding, thumbnails, adaptive streaming",
    category: "video",
    tags: ["video", "upload", "streaming", "transcoding"],
    instruction: `## Video Implementation

### Upload Pipeline
- Use presigned URLs for direct upload from client to storage — don't proxy through your server
- Show upload progress indicator to user
- Validate file type and size before upload starts
- Process (transcode) after upload completes

### Playback
- Use a video platform with adaptive streaming (e.g. Mux, Cloudflare Stream, AWS MediaConvert)
- Generate thumbnails automatically
- Support quality selection for different network speeds (HLS/DASH)

### Key Rules
- Never store raw video files in your database or git repository
- Use a dedicated video platform — don't build transcoding pipelines yourself
- Set upload size limits appropriate to your use case
- Compress on client side before upload when possible
- Consider storage costs — video files are large`,
  },

  // ═══ STORAGE ═══
  {
    id: "storage-files",
    name: "File Storage & Upload",
    description: "File upload flow, presigned URLs, image optimization, CDN",
    category: "storage",
    tags: ["storage", "upload", "cdn", "images"],
    instruction: `## File Storage

### Upload Pattern (presigned URLs)
1. Client requests upload URL from your API
2. API generates presigned URL via storage provider (S3, R2, GCS, Supabase Storage, etc.)
3. Client uploads directly to storage — no proxy through your server
4. Client notifies API with file path for database reference

### Image Optimization
- Store originals, serve optimized versions
- Generate thumbnails on upload for listings and previews
- Support modern formats (WebP, AVIF) with fallbacks
- Use a CDN or image optimization service

### Key Rules
- NEVER expose storage credentials to client code
- Validate file types server-side — not just client-side
- Set max file size limits
- Serve files through CDN for fast global delivery
- Scan uploaded files for malware in production
- Use unique file names (UUID) to prevent collisions and enumeration`,
  },

  // ═══ NOTIFICATIONS ═══
  {
    id: "notifications-setup",
    name: "Notification System",
    description: "In-app, push, email notification architecture and preferences",
    category: "notifications",
    tags: ["notifications", "push", "realtime", "preferences"],
    instruction: `## Notification System

### Architecture
- Central notification service that dispatches to channels: in-app, email, push, SMS
- Store notification preferences per user (which channels, which event types)
- Queue notifications for reliability — don't send inline with the request

### In-App Notifications
- Use WebSocket or server-sent events for real-time delivery
- Store in database: \`notifications\` table with \`user_id, type, title, body, read, created_at\`
- Show unread count badge in UI
- Mark as read on click/view

### Key Rules
- Let users control their notification preferences
- Don't over-notify — batch similar notifications where possible
- Critical notifications (security alerts, payment issues) should always be sent regardless of preferences
- Test notification delivery in staging before production
- Handle notification delivery failures gracefully — retry with exponential backoff`,
  },
];

/**
 * Get skills by category.
 */
export function getSkillsByCategory(categoryId: string): CuratedSkill[] {
  return CURATED_SKILLS.filter((s) => s.category === categoryId);
}

/**
 * Get skills for multiple categories.
 */
export function getSkillsForCategories(categoryIds: string[]): CuratedSkill[] {
  return CURATED_SKILLS.filter((s) => categoryIds.includes(s.category));
}

/**
 * Search skills by tags or keywords.
 */
export function searchSkills(query: string): CuratedSkill[] {
  const q = query.toLowerCase();
  return CURATED_SKILLS.filter((s) =>
    s.tags.some((t) => t.includes(q)) ||
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q),
  );
}
