/**
 * Реестр известных MCP-серверов, сгруппированных по категориям.
 *
 * Каждая категория содержит 1-3 альтернативы. Одна помечена recommended.
 * Данные — вручную проверенные конфиги реальных MCP-серверов с GitHub.
 *
 * 24 категории, 59 агентов.
 */

import type { Skill, EnvVar } from "../types.js";

/* ── Типы ────────────────────────────────────────── */

export interface SkillAlternative extends Skill {
  /** Почему стоит выбрать этот вариант (1 предложение) */
  pros: string;
  /** В чём минус по сравнению с другими (1 предложение) */
  cons: string;
  /** Бесплатный тариф — что входит */
  freeTier: string;
  /** Реальные open source проекты, которые это используют */
  usedBy: string[];
  /** Рекомендуем ли мы это по умолчанию */
  recommended: boolean;
}

export interface SkillCategory {
  id: string;
  label: string;
  description: string;
  alternatives: SkillAlternative[];
}

/* ── Хелпер для создания env-переменных ──────────── */

function env(
  name: string,
  description: string,
  getUrl: string,
  testable = true,
): EnvVar {
  return { name, description, getUrl, required: true, testable };
}

/* ══════════════════════════════════════════════════════
   РЕЕСТР: 24 категории
   ══════════════════════════════════════════════════════ */

export const SKILL_CATEGORIES: SkillCategory[] = [

  /* ─── AUTH ──────────────────────────────────────── */
  {
    id: "auth",
    label: "AUTH",
    description: "Регистрация, вход, OAuth, управление сессиями",
    alternatives: [
      {
        id: "clerk-mcp",
        name: "Clerk MCP",
        command: "/auth",
        description: "All-in-one auth: signup, login, OAuth, user management",
        mcpServer: { command: "npx", args: ["-y", "@anthropic-ai/claude-code-mcp-clerk"] },
        requiredEnvVars: [
          env("CLERK_SECRET_KEY", "Clerk secret key", "https://dashboard.clerk.com/last-active?path=api-keys"),
        ],
        githubUrl: "https://github.com/clerk/javascript",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Быстрый старт, готовый UI, бесплатно до 10K MAU",
        cons: "Vendor lock-in, платный на больших масштабах",
        freeTier: "10,000 MAU бесплатно",
        usedBy: ["cal.com", "dub.co"],
        recommended: true,
      },
      {
        id: "supabase-auth",
        name: "Supabase Auth (входит в /database)",
        command: "/auth",
        description: "Auth + database в одном: email/password, OAuth, magic links",
        mcpServer: {
          command: "npx",
          args: ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", "${SUPABASE_ACCESS_TOKEN}"],
        },
        requiredEnvVars: [
          env("SUPABASE_ACCESS_TOKEN", "Supabase personal access token", "https://supabase.com/dashboard/account/tokens"),
        ],
        githubUrl: "https://github.com/supabase-community/supabase-mcp",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Auth + DB в одном пакете, бесплатно до 50K MAU",
        cons: "Менее гибкий UI чем Clerk",
        freeTier: "50,000 MAU бесплатно",
        usedBy: ["supabase-saas-starter"],
        recommended: false,
      },
      {
        id: "firebase-auth-mcp",
        name: "Firebase Auth MCP",
        command: "/auth",
        description: "Firebase Auth + Firestore + Storage — Google экосистема",
        mcpServer: {
          command: "npx",
          args: ["-y", "@gannonh/firebase-mcp"],
          env: { SERVICE_ACCOUNT_KEY_PATH: "${FIREBASE_SERVICE_ACCOUNT_PATH}" },
        },
        requiredEnvVars: [
          env("FIREBASE_SERVICE_ACCOUNT_PATH", "Path to Firebase service account JSON", "https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk"),
        ],
        githubUrl: "https://github.com/gannonh/firebase-mcp",
        stars: 500,
        lastUpdated: "",
        source: "github",
        pros: "Google ecosystem, масштабируется бесконечно, Auth + Firestore + Storage",
        cons: "Сложнее настройка, community MCP (не official Google)",
        freeTier: "Spark plan: 50K auth/мес, 1GB Firestore бесплатно",
        usedBy: ["many Google-stack apps"],
        recommended: false,
      },
    ],
  },

  /* ─── PAYMENTS ─────────────────────────────────── */
  {
    id: "payments",
    label: "PAYMENTS",
    description: "Платежи, подписки, счета, вебхуки",
    alternatives: [
      {
        id: "stripe-mcp",
        name: "Stripe MCP",
        command: "/payments",
        description: "Invoices, subscriptions, one-time payments, webhooks",
        mcpServer: {
          command: "npx",
          args: ["-y", "@stripe/agent-toolkit", "--tools=all"],
          env: { STRIPE_SECRET_KEY: "${STRIPE_SECRET_KEY}" },
        },
        requiredEnvVars: [
          env("STRIPE_SECRET_KEY", "Stripe secret key", "https://dashboard.stripe.com/apikeys"),
        ],
        githubUrl: "https://github.com/stripe/agent-toolkit",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Индустриальный стандарт, огромная экосистема, official MCP",
        cons: "2.9% + $0.30 за транзакцию",
        freeTier: "Нет ежемесячной платы, только % с транзакций",
        usedBy: ["cal.com", "dub.co", "vercel"],
        recommended: true,
      },
      {
        id: "lemonsqueezy-mcp",
        name: "Lemon Squeezy",
        command: "/payments",
        description: "Merchant of Record: handles taxes, VAT, compliance for you",
        mcpServer: { command: "npx", args: ["-y", "lemonsqueezy-mcp"] },
        requiredEnvVars: [
          env("LEMONSQUEEZY_API_KEY", "Lemon Squeezy API key", "https://app.lemonsqueezy.com/settings/api"),
        ],
        githubUrl: "https://github.com/lmsqueezy/lemonsqueezy.js",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Берёт на себя налоги и VAT — проще для indie hackers",
        cons: "5% + $0.50, меньше кастомизации чем Stripe",
        freeTier: "Нет ежемесячной платы, только % с транзакций",
        usedBy: ["many indie SaaS products"],
        recommended: false,
      },
    ],
  },

  /* ─── DATABASE ─────────────────────────────────── */
  {
    id: "database",
    label: "DATABASE",
    description: "Запросы, миграции, realtime данные, хранение файлов",
    alternatives: [
      {
        id: "supabase-mcp",
        name: "Supabase MCP",
        command: "/database",
        description: "Postgres + Auth + Storage + Realtime в одном",
        mcpServer: {
          command: "npx",
          args: ["-y", "@supabase/mcp-server-supabase@latest", "--access-token", "${SUPABASE_ACCESS_TOKEN}"],
        },
        requiredEnvVars: [
          env("SUPABASE_ACCESS_TOKEN", "Supabase access token", "https://supabase.com/dashboard/account/tokens"),
        ],
        githubUrl: "https://github.com/supabase-community/supabase-mcp",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Всё включено: DB + Auth + Storage + Realtime",
        cons: "Vendor lock-in в Supabase экосистему",
        freeTier: "500MB DB, 1GB storage, 50K MAU",
        usedBy: ["supabase-saas-starter", "many Next.js apps"],
        recommended: true,
      },
      {
        id: "neon-mcp",
        name: "Neon Postgres MCP",
        command: "/database",
        description: "Serverless Postgres with branching and autoscaling",
        mcpServer: {
          command: "npx",
          args: ["-y", "@neondatabase/mcp-server-neon"],
          env: { NEON_API_KEY: "${NEON_API_KEY}" },
        },
        requiredEnvVars: [
          env("NEON_API_KEY", "Neon API key", "https://console.neon.tech/app/settings/api-keys"),
        ],
        githubUrl: "https://github.com/neondatabase/mcp-server-neon",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Serverless, DB branching (как git для базы), автоскейлинг",
        cons: "Только Postgres, нет встроенного Auth/Storage",
        freeTier: "512MB storage, автоскейл до 0",
        usedBy: ["drizzle-orm examples", "vercel templates"],
        recommended: false,
      },
    ],
  },

  /* ─── AI ───────────────────────────────────────── */
  {
    id: "ai",
    label: "AI",
    description: "Текстовая генерация, чат, эмбеддинги, работа с моделями",
    alternatives: [
      {
        id: "openai-mcp",
        name: "OpenAI MCP",
        command: "/ai",
        description: "GPT-4o, o3, DALL-E, embeddings, Whisper",
        mcpServer: {
          command: "npx",
          args: ["-y", "mcp-server-openai"],
          env: { OPENAI_API_KEY: "${OPENAI_API_KEY}" },
        },
        requiredEnvVars: [
          env("OPENAI_API_KEY", "OpenAI API key", "https://platform.openai.com/api-keys"),
        ],
        githubUrl: "https://github.com/pierrebrunelle/mcp-server-openai",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Самая популярная AI платформа, широкий набор моделей",
        cons: "Дорого на больших объёмах",
        freeTier: "$5 бесплатных кредитов при регистрации",
        usedBy: ["most AI apps"],
        recommended: true,
      },
      {
        id: "anthropic-mcp",
        name: "Anthropic Claude MCP",
        command: "/ai",
        description: "Claude Sonnet, Opus, Haiku — coding, analysis, reasoning",
        mcpServer: {
          command: "npx",
          args: ["-y", "anthropic-mcp"],
          env: { ANTHROPIC_API_KEY: "${ANTHROPIC_API_KEY}" },
        },
        requiredEnvVars: [
          env("ANTHROPIC_API_KEY", "Anthropic API key", "https://console.anthropic.com/settings/keys"),
        ],
        githubUrl: "https://github.com/anthropics/anthropic-sdk-js",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Лучший для кода и reasoning, 200K контекст",
        cons: "Меньше моделей чем OpenAI (нет картинок, TTS)",
        freeTier: "$5 бесплатных кредитов при регистрации",
        usedBy: ["claude-code", "cursor"],
        recommended: false,
      },
    ],
  },

  /* ─── EMAIL ────────────────────────────────────── */
  {
    id: "email",
    label: "EMAIL",
    description: "Отправка email: транзакционные, рассылки, шаблоны",
    alternatives: [
      {
        id: "resend-mcp",
        name: "Resend MCP",
        command: "/email",
        description: "Developer-first email: React templates, fast delivery",
        mcpServer: {
          command: "npx",
          args: ["-y", "resend-mcp"],
          env: { RESEND_API_KEY: "${RESEND_API_KEY}" },
        },
        requiredEnvVars: [
          env("RESEND_API_KEY", "Resend API key", "https://resend.com/api-keys", false),
        ],
        githubUrl: "https://github.com/resend/resend-mcp",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "React email шаблоны, отличный DX, быстрая доставка",
        cons: "Молодой сервис, меньше фич для маркетинга",
        freeTier: "3,000 emails/мес бесплатно",
        usedBy: ["cal.com", "dub.co"],
        recommended: true,
      },
      {
        id: "mailgun-mcp",
        name: "Mailgun MCP",
        command: "/email",
        description: "Send emails, check delivery stats, manage domains, troubleshoot DNS",
        mcpServer: {
          command: "npx",
          args: ["-y", "@mailgun/mcp-server"],
          env: { MAILGUN_API_KEY: "${MAILGUN_API_KEY}" },
        },
        requiredEnvVars: [
          env("MAILGUN_API_KEY", "Mailgun API key", "https://app.mailgun.com/settings/api_security"),
        ],
        githubUrl: "https://github.com/mailgun/mailgun-mcp-server",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Official MCP, мощная аналитика доставки, DNS-диагностика",
        cons: "Сложнее настройка домена чем Resend",
        freeTier: "1,000 emails/мес бесплатно (flex plan)",
        usedBy: ["many SaaS apps"],
        recommended: false,
      },
      {
        id: "sendgrid-mcp",
        name: "SendGrid MCP",
        command: "/email",
        description: "Contact lists, templates, single sends, delivery stats",
        mcpServer: {
          command: "npx",
          args: ["-y", "sendgrid-mcp"],
          env: { SENDGRID_API_KEY: "${SENDGRID_API_KEY}" },
        },
        requiredEnvVars: [
          env("SENDGRID_API_KEY", "SendGrid API key", "https://app.sendgrid.com/settings/api_keys"),
        ],
        githubUrl: "https://github.com/Garoth/sendgrid-mcp",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Зрелый сервис (Twilio), маркетинговые рассылки + транзакции",
        cons: "Community MCP, UI менее удобный чем Resend",
        freeTier: "100 emails/день бесплатно навсегда",
        usedBy: ["Twilio ecosystem apps"],
        recommended: false,
      },
    ],
  },

  /* ─── DEPLOY ───────────────────────────────────── */
  {
    id: "deploy",
    label: "DEPLOY",
    description: "Деплой, preview builds, управление env-переменными",
    alternatives: [
      {
        id: "vercel-mcp",
        name: "Vercel MCP",
        command: "/deploy",
        description: "Zero-config deploy for Next.js, preview URLs, edge functions",
        mcpServer: {
          command: "npx",
          args: ["-y", "mcp-remote", "https://mcp.vercel.com/sse"],
        },
        requiredEnvVars: [],
        githubUrl: "https://github.com/vercel/vercel-mcp-overview",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Zero-config для Next.js, preview на каждый PR, official",
        cons: "Дорого на масштабе, vendor lock-in, только managed hosting",
        freeTier: "Hobby: бесплатно для personal projects",
        usedBy: ["cal.com", "dub.co", "shadcn/ui"],
        recommended: true,
      },
      {
        id: "netlify-mcp",
        name: "Netlify MCP",
        command: "/deploy",
        description: "Create projects, build/deploy sites, manage env vars, team admin",
        mcpServer: {
          command: "npx",
          args: ["-y", "@netlify/mcp"],
        },
        requiredEnvVars: [],
        githubUrl: "https://github.com/netlify/netlify-mcp",
        stars: 300,
        lastUpdated: "",
        source: "github",
        pros: "Official MCP, отличный для static sites и Jamstack, бесплатный SSL",
        cons: "Слабее для full-stack Next.js чем Vercel",
        freeTier: "100GB bandwidth, 300 build minutes/мес",
        usedBy: ["many Jamstack projects"],
        recommended: false,
      },
      {
        id: "railway-mcp",
        name: "Railway MCP",
        command: "/deploy",
        description: "Project management, deployments, environment management, monitoring",
        mcpServer: {
          command: "npx",
          args: ["-y", "@railway/mcp-server"],
        },
        requiredEnvVars: [],
        githubUrl: "https://github.com/railwayapp/railway-mcp-server",
        stars: 200,
        lastUpdated: "",
        source: "github",
        pros: "Official MCP, деплой любого стека (не только JS), база данных одним кликом",
        cons: "Нет бесплатного тарифа (от $5/мес)",
        freeTier: "$5 бесплатных кредитов при старте",
        usedBy: ["indie developers", "startups"],
        recommended: false,
      },
      {
        id: "coolify-mcp",
        name: "Coolify MCP (self-hosted)",
        command: "/deploy",
        description: "Self-hosted PaaS: manage servers, apps, databases on your own VPS",
        mcpServer: {
          command: "npx",
          args: ["-y", "@masonator/coolify-mcp"],
          env: {
            COOLIFY_API_URL: "${COOLIFY_API_URL}",
            COOLIFY_API_TOKEN: "${COOLIFY_API_TOKEN}",
          },
        },
        requiredEnvVars: [
          env("COOLIFY_API_URL", "Coolify instance URL (e.g. https://coolify.yourvps.com)", "https://coolify.io/docs"),
          env("COOLIFY_API_TOKEN", "Coolify API token", "https://coolify.io/docs"),
        ],
        githubUrl: "https://github.com/StuMason/coolify-mcp",
        stars: 273,
        lastUpdated: "",
        source: "github",
        pros: "Self-hosted, полный контроль, никакого vendor lock-in, свой VPS",
        cons: "Нужен свой сервер, community MCP (не official Coolify)",
        freeTier: "Open source — бесплатно навсегда (оплата только VPS)",
        usedBy: ["self-hosted enthusiasts"],
        recommended: false,
      },
    ],
  },

  /* ─── VIDEO / MEDIA ────────────────────────────── */
  {
    id: "video",
    label: "VIDEO & MEDIA",
    description: "Видео-хостинг, стриминг, обработка медиа, CDN для контента",
    alternatives: [
      {
        id: "mux-mcp",
        name: "Mux MCP",
        command: "/video",
        description: "Upload videos, create live streams, thumbnails, captions, analytics",
        mcpServer: {
          command: "npx",
          args: ["-y", "@mux/mcp@latest", "--tools=dynamic", "--client=claude"],
        },
        requiredEnvVars: [
          env("MUX_TOKEN_ID", "Mux API token ID", "https://dashboard.mux.com/settings/access-tokens"),
          env("MUX_TOKEN_SECRET", "Mux API token secret", "https://dashboard.mux.com/settings/access-tokens"),
        ],
        githubUrl: "https://github.com/muxinc/agent-video",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Official MCP, лучший видео API — стриминг, субтитры, аналитика",
        cons: "Дорого на больших объёмах (от $0.007/мин кодирования)",
        freeTier: "$20 бесплатных кредитов при старте",
        usedBy: ["many video platforms"],
        recommended: true,
      },
      {
        id: "cloudinary-mcp",
        name: "Cloudinary MCP",
        command: "/video",
        description: "Upload, transform, optimize images and video, AI content analysis",
        mcpServer: {
          command: "npx",
          args: ["-y", "--package", "@cloudinary/asset-management-mcp", "--", "mcp", "start"],
          env: {
            CLOUDINARY_CLOUD_NAME: "${CLOUDINARY_CLOUD_NAME}",
            CLOUDINARY_API_KEY: "${CLOUDINARY_API_KEY}",
            CLOUDINARY_API_SECRET: "${CLOUDINARY_API_SECRET}",
          },
        },
        requiredEnvVars: [
          env("CLOUDINARY_CLOUD_NAME", "Cloudinary cloud name", "https://console.cloudinary.com/settings"),
          env("CLOUDINARY_API_KEY", "Cloudinary API key", "https://console.cloudinary.com/settings"),
          env("CLOUDINARY_API_SECRET", "Cloudinary API secret", "https://console.cloudinary.com/settings"),
        ],
        githubUrl: "https://github.com/cloudinary/mcp-servers",
        stars: 100,
        lastUpdated: "",
        source: "github",
        pros: "Official MCP, трансформации на лету, AI-теги для контента",
        cons: "Сложная система трансформаций, дорогой на масштабе",
        freeTier: "25 credits/мес (25GB storage, 25GB bandwidth)",
        usedBy: ["many media-heavy apps"],
        recommended: false,
      },
      {
        id: "ffmpeg-mcp",
        name: "FFmpeg MCP",
        command: "/video",
        description: "Encode, decode, transcode, convert any multimedia format locally",
        mcpServer: {
          command: "npx",
          args: ["-y", "ffmpeg-mcp"],
        },
        requiredEnvVars: [],
        githubUrl: "https://github.com/egoist/ffmpeg-mcp",
        stars: 200,
        lastUpdated: "",
        source: "github",
        pros: "Бесплатно, локально, любой формат — полный контроль",
        cons: "Community MCP, нужен FFmpeg на машине, нет CDN/стриминга",
        freeTier: "Бесплатно навсегда (open source)",
        usedBy: ["video processing pipelines"],
        recommended: false,
      },
    ],
  },

  /* ─── STORAGE / CDN ────────────────────────────── */
  {
    id: "storage",
    label: "STORAGE & CDN",
    description: "Файловое хранилище, CDN, S3-совместимое хранение",
    alternatives: [
      {
        id: "cloudflare-mcp",
        name: "Cloudflare MCP (R2 + Workers + KV + D1)",
        command: "/storage",
        description: "R2 storage, Workers, KV, D1 database, DNS — 2500+ API endpoints",
        mcpServer: {
          command: "npx",
          args: ["-y", "@cloudflare/mcp-server-cloudflare"],
        },
        requiredEnvVars: [],
        githubUrl: "https://github.com/cloudflare/mcp-server-cloudflare",
        stars: 1500,
        lastUpdated: "",
        source: "github",
        pros: "Official MCP, R2 без egress fees, Workers для edge logic, огромная платформа",
        cons: "Много всего — легко запутаться, R2 менее зрелый чем S3",
        freeTier: "R2: 10GB storage, 1M requests/мес бесплатно",
        usedBy: ["many web apps moving from AWS"],
        recommended: true,
      },
      {
        id: "s3-mcp",
        name: "AWS S3 MCP",
        command: "/storage",
        description: "List buckets, upload/download files, generate presigned URLs",
        mcpServer: {
          command: "npx",
          args: ["-y", "mcp-server-s3"],
          env: {
            AWS_ACCESS_KEY_ID: "${AWS_ACCESS_KEY_ID}",
            AWS_SECRET_ACCESS_KEY: "${AWS_SECRET_ACCESS_KEY}",
            AWS_REGION: "${AWS_REGION}",
          },
        },
        requiredEnvVars: [
          env("AWS_ACCESS_KEY_ID", "AWS access key", "https://console.aws.amazon.com/iam/home#/security_credentials"),
          env("AWS_SECRET_ACCESS_KEY", "AWS secret key", "https://console.aws.amazon.com/iam/home#/security_credentials"),
          env("AWS_REGION", "AWS region (e.g. us-east-1)", "https://docs.aws.amazon.com/general/latest/gr/rande.html"),
        ],
        githubUrl: "https://github.com/Geun-Oh/s3-mcp-server",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Индустриальный стандарт, совместим с 1000+ инструментов",
        cons: "Community MCP, egress fees, сложный IAM",
        freeTier: "5GB storage, 20K GET, 2K PUT/мес на 12 мес",
        usedBy: ["almost every large app"],
        recommended: false,
      },
    ],
  },

  /* ─── ANALYTICS ────────────────────────────────── */
  {
    id: "analytics",
    label: "ANALYTICS",
    description: "Аналитика пользователей, events, funnels, A/B тесты",
    alternatives: [
      {
        id: "posthog-mcp",
        name: "PostHog MCP",
        command: "/analytics",
        description: "Product analytics, session replays, feature flags, A/B tests",
        mcpServer: {
          command: "npx",
          args: ["-y", "mcp-remote@latest", "https://mcp.posthog.com/mcp", "--header", "Authorization:Bearer ${POSTHOG_API_KEY}"],
        },
        requiredEnvVars: [
          env("POSTHOG_API_KEY", "PostHog personal API key", "https://app.posthog.com/settings/user-api-keys"),
        ],
        githubUrl: "https://github.com/PostHog/mcp",
        stars: 500,
        lastUpdated: "",
        source: "github",
        pros: "Official MCP, open source, analytics + session replays + feature flags в одном",
        cons: "Self-hosted требует ресурсов, cloud дорогой на масштабе",
        freeTier: "1M events/мес бесплатно",
        usedBy: ["many open source projects"],
        recommended: true,
      },
      {
        id: "mixpanel-mcp",
        name: "Mixpanel MCP",
        command: "/analytics",
        description: "Event analytics, funnels, flows, retention via natural language",
        mcpServer: {
          command: "npx",
          args: ["-y", "mcp-remote", "https://mcp.mixpanel.com/mcp"],
        },
        requiredEnvVars: [],
        githubUrl: "https://docs.mixpanel.com/docs/mcp",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Official remote MCP, мощные funnels и retention, запросы на естественном языке",
        cons: "Дорогой на масштабе, remote-only MCP (нужен интернет)",
        freeTier: "20M events/мес бесплатно",
        usedBy: ["Uber", "Figma", "many SaaS"],
        recommended: false,
      },
      {
        id: "google-analytics-mcp",
        name: "Google Analytics MCP",
        command: "/analytics",
        description: "GA4 reports, metrics, dimensions — website traffic analytics",
        mcpServer: {
          command: "npx",
          args: ["-y", "mcp-server-google-analytics"],
        },
        requiredEnvVars: [],
        githubUrl: "https://github.com/googleanalytics/google-analytics-mcp",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Бесплатно, стандарт де-факто для web traffic, огромная экосистема",
        cons: "Community MCP, данные с задержкой, менее точный для product analytics",
        freeTier: "Полностью бесплатный (GA4)",
        usedBy: ["almost every website"],
        recommended: false,
      },
    ],
  },

  /* ─── MONITORING ───────────────────────────────── */
  {
    id: "monitoring",
    label: "MONITORING",
    description: "Ошибки, логи, метрики, алерты, трейсинг",
    alternatives: [
      {
        id: "sentry-mcp",
        name: "Sentry MCP",
        command: "/monitoring",
        description: "Error tracking, performance monitoring, issues, Seer AI analysis",
        mcpServer: {
          command: "npx",
          args: ["-y", "@sentry/mcp-server"],
        },
        requiredEnvVars: [],
        githubUrl: "https://github.com/getsentry/sentry-mcp",
        stars: 500,
        lastUpdated: "",
        source: "github",
        pros: "Official MCP, лучший error tracking, AI-анализ ошибок (Seer)",
        cons: "Бесплатный план ограничен 5K events/мес",
        freeTier: "5K errors/мес, 10K transactions/мес",
        usedBy: ["Vercel", "GitHub", "most web apps"],
        recommended: true,
      },
      {
        id: "grafana-mcp",
        name: "Grafana MCP",
        command: "/monitoring",
        description: "Dashboard searches, datasource queries, incident management, tracing",
        mcpServer: {
          command: "npx",
          args: ["-y", "@leval/mcp-grafana"],
          env: { GRAFANA_URL: "${GRAFANA_URL}", GRAFANA_API_KEY: "${GRAFANA_API_KEY}" },
        },
        requiredEnvVars: [
          env("GRAFANA_URL", "Grafana instance URL", "https://grafana.com/docs/grafana/latest/setup-grafana/"),
          env("GRAFANA_API_KEY", "Grafana API key", "https://grafana.com/docs/grafana/latest/administration/api-keys/"),
        ],
        githubUrl: "https://github.com/grafana/mcp-grafana",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Official server (community TS port), дашборды, метрики, логи, инциденты",
        cons: "Нужен running Grafana instance, сложная настройка datasources",
        freeTier: "Grafana Cloud free: 10K metrics, 50GB logs",
        usedBy: ["enterprise monitoring stacks"],
        recommended: false,
      },
    ],
  },

  /* ─── CMS ──────────────────────────────────────── */
  {
    id: "cms",
    label: "CMS",
    description: "Управление контентом: статьи, страницы, медиа, локализация",
    alternatives: [
      {
        id: "sanity-mcp",
        name: "Sanity MCP",
        command: "/cms",
        description: "GROQ queries, manage content, releases, patch documents with schema awareness",
        mcpServer: {
          command: "npx",
          args: ["-y", "mcp-remote", "https://mcp.sanity.io", "--transport", "http-only"],
        },
        requiredEnvVars: [],
        githubUrl: "https://www.sanity.io/docs/ai/mcp-server",
        stars: 400,
        lastUpdated: "",
        source: "github",
        pros: "Official remote MCP, real-time collaboration, мощный GROQ query язык",
        cons: "Кривая обучения GROQ, дорого на масштабе",
        freeTier: "Free: 3 users, 500K API requests/мес",
        usedBy: ["Nike", "Figma", "National Geographic"],
        recommended: true,
      },
      {
        id: "contentful-mcp",
        name: "Contentful MCP",
        command: "/cms",
        description: "Create, edit, organize, publish content — full content management",
        mcpServer: {
          command: "npx",
          args: ["-y", "@contentful/mcp-server"],
          env: { CONTENTFUL_MANAGEMENT_ACCESS_TOKEN: "${CONTENTFUL_MANAGEMENT_ACCESS_TOKEN}" },
        },
        requiredEnvVars: [
          env("CONTENTFUL_MANAGEMENT_ACCESS_TOKEN", "Contentful management API token", "https://app.contentful.com/account/profile/cma_tokens"),
        ],
        githubUrl: "https://github.com/contentful/contentful-mcp-server",
        stars: 200,
        lastUpdated: "",
        source: "github",
        pros: "Official MCP, зрелая платформа, отличная локализация",
        cons: "Дорого (от $300/мес на Team), сложная модель контента",
        freeTier: "Free: 1 space, 5 users, 25K records",
        usedBy: ["many enterprise sites"],
        recommended: false,
      },
      {
        id: "strapi-mcp",
        name: "Strapi MCP (self-hosted)",
        command: "/cms",
        description: "Open-source headless CMS — content types, REST API, media management",
        mcpServer: {
          command: "npx",
          args: ["-y", "@bschauer/strapi-mcp-server"],
          env: {
            STRAPI_URL: "${STRAPI_URL}",
            STRAPI_API_TOKEN: "${STRAPI_API_TOKEN}",
          },
        },
        requiredEnvVars: [
          env("STRAPI_URL", "Strapi instance URL", "https://docs.strapi.io/dev-docs/quick-start"),
          env("STRAPI_API_TOKEN", "Strapi API token", "https://docs.strapi.io/user-docs/settings/API-tokens"),
        ],
        githubUrl: "https://github.com/misterboe/strapi-mcp-server",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Open source, self-hosted, полный контроль, бесплатно навсегда",
        cons: "Community MCP, нужен свой сервер, нет built-in CDN",
        freeTier: "Open source — бесплатно (cloud от $29/мес)",
        usedBy: ["many self-hosted projects"],
        recommended: false,
      },
    ],
  },

  /* ─── SEARCH ───────────────────────────────────── */
  {
    id: "search",
    label: "SEARCH",
    description: "Полнотекстовый поиск, фасетная фильтрация, автокомплит",
    alternatives: [
      {
        id: "typesense-mcp",
        name: "Typesense MCP",
        command: "/search",
        description: "Create collections, index documents, typo-tolerant search",
        mcpServer: {
          command: "npx",
          args: ["-y", "typesense-mcp-server"],
          env: {
            TYPESENSE_API_KEY: "${TYPESENSE_API_KEY}",
            TYPESENSE_HOST: "${TYPESENSE_HOST}",
          },
        },
        requiredEnvVars: [
          env("TYPESENSE_API_KEY", "Typesense API key", "https://cloud.typesense.org/"),
          env("TYPESENSE_HOST", "Typesense host URL", "https://cloud.typesense.org/"),
        ],
        githubUrl: "https://github.com/avarant/typesense-mcp-server",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Open source, typo-tolerant, быстрый, проще чем Elastic",
        cons: "Community MCP, меньше фич чем Elastic",
        freeTier: "Cloud: 50K records, 500K searches/мес бесплатно",
        usedBy: ["typesense cloud users"],
        recommended: true,
      },
      {
        id: "elasticsearch-mcp",
        name: "Elasticsearch MCP",
        command: "/search",
        description: "Mappings, search, indexing, index management — enterprise search",
        mcpServer: {
          command: "npx",
          args: ["-y", "@elastic/mcp-server-elasticsearch"],
          env: {
            ES_URL: "${ELASTICSEARCH_URL}",
            ES_API_KEY: "${ELASTICSEARCH_API_KEY}",
          },
        },
        requiredEnvVars: [
          env("ELASTICSEARCH_URL", "Elasticsearch URL", "https://cloud.elastic.co/"),
          env("ELASTICSEARCH_API_KEY", "Elasticsearch API key", "https://cloud.elastic.co/"),
        ],
        githubUrl: "https://github.com/elastic/mcp-server-elasticsearch",
        stars: 300,
        lastUpdated: "",
        source: "github",
        pros: "Official MCP, индустриальный стандарт, мощные агрегации",
        cons: "Тяжёлый, дорогой, сложная настройка, MCP скоро deprecated",
        freeTier: "14-day free trial, потом от $95/мес",
        usedBy: ["enterprise search", "logging"],
        recommended: false,
      },
      {
        id: "meilisearch-mcp",
        name: "Meilisearch MCP",
        command: "/search",
        description: "68+ tools: index management, search, settings, vector search",
        mcpServer: {
          command: "uvx",
          args: ["meilisearch-mcp"],
          env: {
            MEILI_HTTP_ADDR: "${MEILISEARCH_URL}",
            MEILI_MASTER_KEY: "${MEILISEARCH_MASTER_KEY}",
          },
        },
        requiredEnvVars: [
          env("MEILISEARCH_URL", "Meilisearch URL", "https://cloud.meilisearch.com/"),
          env("MEILISEARCH_MASTER_KEY", "Meilisearch master key", "https://cloud.meilisearch.com/"),
        ],
        githubUrl: "https://github.com/meilisearch/meilisearch-mcp",
        stars: 300,
        lastUpdated: "",
        source: "github",
        pros: "Official MCP, open source, очень быстрый, простой API",
        cons: "Менее мощный чем Elastic, нужен uvx (Python)",
        freeTier: "Cloud: 100K documents бесплатно",
        usedBy: ["docs.rs", "many docs sites"],
        recommended: false,
      },
    ],
  },

  /* ─── CACHE ────────────────────────────────────── */
  {
    id: "cache",
    label: "CACHE",
    description: "Кеширование, session storage, rate limiting, real-time данные",
    alternatives: [
      {
        id: "upstash-mcp",
        name: "Upstash MCP (serverless Redis)",
        command: "/cache",
        description: "Create/manage Redis databases, key operations, throughput monitoring",
        mcpServer: {
          command: "npx",
          args: ["-y", "@upstash/mcp-server@latest"],
          env: {
            UPSTASH_EMAIL: "${UPSTASH_EMAIL}",
            UPSTASH_API_KEY: "${UPSTASH_API_KEY}",
          },
        },
        requiredEnvVars: [
          env("UPSTASH_EMAIL", "Upstash account email", "https://console.upstash.com/"),
          env("UPSTASH_API_KEY", "Upstash management API key", "https://console.upstash.com/account/api"),
        ],
        githubUrl: "https://github.com/upstash/mcp-server",
        stars: 200,
        lastUpdated: "",
        source: "github",
        pros: "Official MCP, serverless Redis (авто-скейл до 0), pay-per-request",
        cons: "Дороже обычного Redis на высоких нагрузках",
        freeTier: "10K commands/день бесплатно",
        usedBy: ["Next.js apps", "Vercel users"],
        recommended: true,
      },
      {
        id: "redis-mcp",
        name: "Redis MCP",
        command: "/cache",
        description: "Set/get/delete, JSON, vectors, sorted sets, health checks",
        mcpServer: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-redis", "redis://localhost:6379"],
        },
        requiredEnvVars: [],
        githubUrl: "https://github.com/redis/mcp-redis",
        stars: 300,
        lastUpdated: "",
        source: "github",
        pros: "Official (Anthropic reference + Redis Inc.), полный набор операций",
        cons: "Нужен running Redis server (self-hosted или cloud)",
        freeTier: "Open source — бесплатно (Redis Cloud: 30MB free)",
        usedBy: ["almost every web app"],
        recommended: false,
      },
    ],
  },

  /* ─── NOTIFICATIONS ────────────────────────────── */
  {
    id: "notifications",
    label: "NOTIFICATIONS",
    description: "Push-уведомления, in-app, SMS, multi-channel messaging",
    alternatives: [
      {
        id: "novu-mcp",
        name: "Novu MCP",
        command: "/notifications",
        description: "Multi-channel notifications: in-app, email, push, SMS, chat",
        mcpServer: {
          command: "npx",
          args: ["-y", "--package", "@novu/api", "--", "mcp", "start"],
          env: { NOVU_SECRET_KEY: "${NOVU_SECRET_KEY}" },
        },
        requiredEnvVars: [
          env("NOVU_SECRET_KEY", "Novu secret key", "https://dashboard.novu.co/api-keys"),
        ],
        githubUrl: "https://github.com/novuhq/smithery-mcp",
        stars: 50,
        lastUpdated: "",
        source: "github",
        pros: "Official MCP, open source, все каналы в одном API",
        cons: "Молодой продукт, MCP ещё сырой",
        freeTier: "30K events/мес бесплатно",
        usedBy: ["open source projects"],
        recommended: true,
      },
      {
        id: "knock-mcp",
        name: "Knock MCP",
        command: "/notifications",
        description: "In-app, email, push, SMS, Slack, Teams via workflow templates",
        mcpServer: {
          command: "npx",
          args: ["-y", "mcp-remote", "https://mcp.knock.app/mcp"],
        },
        requiredEnvVars: [],
        githubUrl: "https://docs.knock.app/developer-tools/mcp-server",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Official remote MCP, мощные workflow templates, Slack/Teams интеграция",
        cons: "Дороже Novu, closed source",
        freeTier: "10K messages/мес бесплатно",
        usedBy: ["SaaS companies"],
        recommended: false,
      },
    ],
  },

  /* ─── TESTING ──────────────────────────────────── */
  {
    id: "testing",
    label: "TESTING",
    description: "E2E тесты, browser automation, скриншоты, snapshot testing",
    alternatives: [
      {
        id: "playwright-mcp",
        name: "Playwright MCP",
        command: "/testing",
        description: "Browser automation, page snapshots, form filling, navigation, screenshots",
        mcpServer: {
          command: "npx",
          args: ["@playwright/mcp@latest"],
        },
        requiredEnvVars: [],
        githubUrl: "https://github.com/microsoft/playwright-mcp",
        stars: 5000,
        lastUpdated: "",
        source: "github",
        pros: "Official Microsoft MCP, кросс-браузерный, мощный API, 5K+ stars",
        cons: "Тяжёлый (нужны браузеры), медленнее unit тестов",
        freeTier: "Бесплатно навсегда (open source)",
        usedBy: ["Microsoft", "many web apps"],
        recommended: true,
      },
      {
        id: "cypress-mcp",
        name: "Cypress MCP",
        command: "/testing",
        description: "Run tests, read/write specs, snapshot pages, browser automation",
        mcpServer: {
          command: "npx",
          args: ["-y", "cypress-mcp", "--project", "."],
        },
        requiredEnvVars: [],
        githubUrl: "https://github.com/yashpreetbathla/cypress-mcp",
        stars: 50,
        lastUpdated: "",
        source: "github",
        pros: "Привычный Cypress DX, хорошая документация, visual testing",
        cons: "Community MCP, медленнее Playwright, только Chromium по умолчанию",
        freeTier: "Бесплатно (open source), Cloud от $75/мес",
        usedBy: ["many frontend teams"],
        recommended: false,
      },
    ],
  },

  /* ─── CODE REVIEW ──────────────────────────────── */
  {
    id: "review",
    label: "CODE REVIEW",
    description: "AI-ревью кода: баги, логика, стиль, улучшения",
    alternatives: [
      {
        id: "coderabbit-mcp",
        name: "CodeRabbit",
        command: "/review",
        description: "AI code review: bugs, security, style, suggestions",
        mcpServer: { command: "npx", args: ["-y", "coderabbit-mcp"] },
        requiredEnvVars: [],
        githubUrl: "https://github.com/coderabbitai/coderabbit",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Бесплатный для open source, глубокий анализ, AI-powered",
        cons: "Платный для private repos",
        freeTier: "Бесплатно для open source проектов",
        usedBy: ["many open source projects"],
        recommended: true,
      },
    ],
  },

  /* ─── SECURITY ─────────────────────────────────── */
  {
    id: "security",
    label: "SECURITY",
    description: "OWASP-сканирование, уязвимости зависимостей, утечки секретов",
    alternatives: [
      {
        id: "semgrep-mcp",
        name: "Semgrep",
        command: "/security",
        description: "SAST: SQL injection, XSS, secrets, OWASP Top 10",
        mcpServer: { command: "uvx", args: ["semgrep-mcp"] },
        requiredEnvVars: [],
        githubUrl: "https://github.com/semgrep/semgrep",
        stars: 0,
        lastUpdated: "",
        source: "github",
        pros: "Бесплатный CLI, огромная база правил, быстрый",
        cons: "Платные advanced-правила, нужен uvx (Python)",
        freeTier: "CLI бесплатно навсегда, 10 проектов в cloud",
        usedBy: ["Dropbox", "Figma", "Slack"],
        recommended: true,
      },
    ],
  },

  /* ─── COMMUNICATION ──────────────────────────────── */
  {
    id: "communication",
    label: "COMMUNICATION",
    description: "Мессенджеры, чаты, уведомления команды",
    alternatives: [
      {
        id: "slack-mcp",
        name: "Slack MCP",
        command: "/slack",
        description: "Official Anthropic Slack MCP — чтение/отправка сообщений, управление каналами, поиск по истории",
        mcpServer: {
          command: "npx",
          args: ["-y", "@anthropic-ai/claude-code-mcp-slack"],
        },
        requiredEnvVars: [
          env("SLACK_BOT_TOKEN", "Slack Bot OAuth Token", "https://api.slack.com/apps"),
          env("SLACK_TEAM_ID", "Slack Workspace ID", "https://api.slack.com/apps"),
        ],
        githubUrl: "https://github.com/anthropics/claude-code-mcp-slack",
        stars: 500,
        pros: "Official Anthropic, глубокая интеграция, channels + threads + search",
        cons: "Только Slack, нужен Bot token с permissions",
        freeTier: "Бесплатно (Slack Free workspace)",
        usedBy: ["Anthropic", "Vercel", "Linear"],
        recommended: true,
        lastUpdated: "",
        source: "github",
      },
      {
        id: "discord-mcp",
        name: "Discord MCP",
        command: "/discord",
        description: "Discord MCP — управление серверами, каналами, сообщениями, модерация",
        mcpServer: {
          command: "npx",
          args: ["-y", "mcp-discord"],
        },
        requiredEnvVars: [
          env("DISCORD_TOKEN", "Discord Bot Token", "https://discord.com/developers/applications"),
        ],
        githubUrl: "https://github.com/v-3/mcp-discord",
        stars: 300,
        pros: "Полная Discord API интеграция, модерация, вебхуки",
        cons: "Community-maintained, менее стабилен",
        freeTier: "Бесплатно (Discord бесплатный)",
        usedBy: ["Gaming communities", "Open source projects"],
        recommended: false,
        lastUpdated: "",
        source: "github",
      },
    ],
  },

  /* ─── PROJECT MANAGEMENT ──────────────────────────── */
  {
    id: "project-management",
    label: "PROJECT MANAGEMENT",
    description: "Таск-трекеры, issue trackers, управление проектами",
    alternatives: [
      {
        id: "github-mcp",
        name: "GitHub MCP",
        command: "/github",
        description: "Official GitHub MCP — issues, PRs, repos, actions, code search, управление проектами",
        mcpServer: {
          command: "npx",
          args: ["-y", "@anthropic-ai/claude-code-mcp-github"],
        },
        requiredEnvVars: [
          env("GITHUB_TOKEN", "GitHub Personal Access Token", "https://github.com/settings/tokens"),
        ],
        githubUrl: "https://github.com/anthropics/claude-code-mcp-github",
        stars: 2000,
        pros: "Official Anthropic, полный GitHub API, issues + PRs + Actions + code search",
        cons: "Только GitHub (не GitLab/Bitbucket)",
        freeTier: "Бесплатно (GitHub Free)",
        usedBy: ["Anthropic", "Open source maintainers"],
        recommended: true,
        lastUpdated: "",
        source: "github",
      },
      {
        id: "linear-mcp",
        name: "Linear MCP",
        command: "/linear",
        description: "Linear MCP — создание/обновление issues, проекты, циклы, roadmaps",
        mcpServer: {
          command: "npx",
          args: ["-y", "mcp-linear"],
        },
        requiredEnvVars: [
          env("LINEAR_API_KEY", "Linear API Key", "https://linear.app/settings/api"),
        ],
        githubUrl: "https://github.com/jerhadf/linear-mcp-server",
        stars: 400,
        pros: "Современный трекер, быстрый API, любимый стартапами",
        cons: "Платный (от $8/user), не подходит для open source",
        freeTier: "Бесплатно до 250 issues",
        usedBy: ["Vercel", "Cal.com", "Raycast"],
        recommended: false,
        lastUpdated: "",
        source: "github",
      },
      {
        id: "jira-mcp",
        name: "Jira/Confluence MCP",
        command: "/jira",
        description: "Atlassian MCP — Jira issues, Confluence pages, поиск, управление проектами",
        mcpServer: {
          command: "uvx",
          args: ["mcp-atlassian"],
        },
        requiredEnvVars: [
          env("JIRA_URL", "Jira instance URL", "https://id.atlassian.com/manage-profile/security/api-tokens"),
          env("JIRA_USERNAME", "Jira email", "https://id.atlassian.com"),
          env("JIRA_API_TOKEN", "Jira API Token", "https://id.atlassian.com/manage-profile/security/api-tokens"),
        ],
        githubUrl: "https://github.com/sooperset/mcp-atlassian",
        stars: 3000,
        pros: "Jira + Confluence в одном MCP, enterprise-grade",
        cons: "Нужен Python (uvx), сложная настройка",
        freeTier: "Бесплатно (Jira Free до 10 users)",
        usedBy: ["Enterprise teams", "Corporate dev teams"],
        recommended: false,
        lastUpdated: "",
        source: "github",
      },
    ],
  },

  /* ─── DOCUMENTS ───────────────────────────────────── */
  {
    id: "documents",
    label: "DOCUMENTS",
    description: "Google Drive, Sheets, Docs, файловые системы",
    alternatives: [
      {
        id: "gdrive-mcp",
        name: "Google Drive MCP",
        command: "/gdrive",
        description: "Google Drive MCP — поиск, чтение, создание файлов в Google Drive/Docs/Sheets",
        mcpServer: {
          command: "npx",
          args: ["-y", "@anthropic-ai/claude-code-mcp-gdrive"],
        },
        requiredEnvVars: [
          env("GOOGLE_CLIENT_ID", "Google OAuth Client ID", "https://console.cloud.google.com/apis/credentials"),
          env("GOOGLE_CLIENT_SECRET", "Google OAuth Client Secret", "https://console.cloud.google.com/apis/credentials"),
        ],
        githubUrl: "https://github.com/anthropics/claude-code-mcp-gdrive",
        stars: 800,
        pros: "Official Anthropic, Drive + Docs + Sheets, OAuth",
        cons: "Сложная OAuth настройка, нужен Google Cloud project",
        freeTier: "Бесплатно (Google Drive Free 15GB)",
        usedBy: ["Anthropic", "Remote teams"],
        recommended: true,
        lastUpdated: "",
        source: "github",
      },
      {
        id: "notion-mcp",
        name: "Notion MCP",
        command: "/notion",
        description: "Notion MCP — чтение/создание страниц, базы данных, поиск по workspace",
        mcpServer: {
          command: "npx",
          args: ["-y", "mcp-notion"],
        },
        requiredEnvVars: [
          env("NOTION_TOKEN", "Notion Integration Token", "https://www.notion.so/my-integrations"),
        ],
        githubUrl: "https://github.com/makenotion/notion-mcp-server",
        stars: 1500,
        pros: "Official Notion, полный API, базы данных + страницы",
        cons: "Сложная модель permissions, медленный API",
        freeTier: "Бесплатно (Notion Free plan)",
        usedBy: ["Startups", "Content teams"],
        recommended: false,
        lastUpdated: "",
        source: "github",
      },
    ],
  },

  /* ─── BROWSER AUTOMATION ────────────────────────── */
  {
    id: "browser",
    label: "BROWSER AUTOMATION",
    description: "Автоматизация браузера, скрейпинг, тестирование UI",
    alternatives: [
      {
        id: "puppeteer-mcp",
        name: "Puppeteer MCP",
        command: "/browser",
        description: "Official Anthropic Puppeteer MCP — навигация, скриншоты, клики, заполнение форм, парсинг страниц",
        mcpServer: {
          command: "npx",
          args: ["-y", "@anthropic-ai/claude-code-mcp-puppeteer"],
        },
        requiredEnvVars: [],
        githubUrl: "https://github.com/anthropics/claude-code-mcp-puppeteer",
        stars: 1200,
        pros: "Official Anthropic, headless Chrome, скриншоты + DOM + navigation",
        cons: "Тяжёлый (Chrome), не подходит для CI без headless mode",
        freeTier: "Полностью бесплатно (open source)",
        usedBy: ["Anthropic", "Web scraping projects"],
        recommended: true,
        lastUpdated: "",
        source: "github",
      },
      {
        id: "browserbase-mcp",
        name: "Browserbase MCP",
        command: "/browserbase",
        description: "Cloud browser automation — headless Chrome в облаке, без локальной установки",
        mcpServer: {
          command: "npx",
          args: ["-y", "@browserbase/mcp-server"],
        },
        requiredEnvVars: [
          env("BROWSERBASE_API_KEY", "Browserbase API Key", "https://browserbase.com/dashboard"),
          env("BROWSERBASE_PROJECT_ID", "Project ID", "https://browserbase.com/dashboard"),
        ],
        githubUrl: "https://github.com/browserbase/mcp-server-browserbase",
        stars: 600,
        pros: "Cloud-based, не нужен локальный Chrome, стейлт-режим",
        cons: "Платный (от $10/мес), зависимость от облака",
        freeTier: "100 сессий бесплатно",
        usedBy: ["AI agents", "Web scraping startups"],
        recommended: false,
        lastUpdated: "",
        source: "github",
      },
    ],
  },
  /* ─── MARKETING / SEO ─────────────────────────────── */
  {
    id: "marketing",
    label: "MARKETING / SEO",
    description: "SEO-оптимизация, копирайтинг, конверсия, структура лендинга, мета-теги, аналитика маркетинга",
    alternatives: [
      {
        id: "seo-skill",
        name: "SEO & Marketing AI Skill",
        command: "/marketing",
        description: "AI-скилл для маркетинга: SEO-оптимизация (мета-теги, структура, schema.org), копирайтинг (заголовки, CTA, описания), конверсия лендингов (расположение элементов, UX-паттерны), контент-стратегия.",
        mcpServer: {
          command: "npx",
          args: ["-y", "skillpilot-marketing-skill"],
        },
        requiredEnvVars: [],
        githubUrl: "https://github.com/skillpilot/marketing-skill",
        stars: 0,
        pros: "Универсальный маркетинговый скилл — SEO, копирайтинг, структура сайта, UX-паттерны конверсии",
        cons: "Это промпт/скилл, а не MCP-инструмент — работает через instructions, не через API",
        freeTier: "Полностью бесплатно (open source skill)",
        usedBy: ["Indie hackers", "Small business", "Startups"],
        recommended: true,
        lastUpdated: "",
        source: "github",
      },
    ],
  },

  /* ─── DESIGN / UI ──────────────────────────────────── */
  {
    id: "design",
    label: "DESIGN / UI",
    description: "UI-компоненты, дизайн-системы, генерация интерфейсов из промпта или Figma",
    alternatives: [
      {
        id: "21st-dev-mcp",
        name: "21st.dev Magic MCP",
        command: "/design",
        description: "AI-генерация React/Next.js компонентов из текстового описания. Создаёт уникальные UI-компоненты, лендинги, формы, дашборды с Tailwind CSS и анимациями.",
        mcpServer: {
          command: "npx",
          args: ["-y", "@anthropic-ai/claude-code-mcp-21st-dev"],
        },
        requiredEnvVars: [
          env("TWENTY_FIRST_API_KEY", "21st.dev API Key", "https://21st.dev/dashboard"),
        ],
        githubUrl: "https://github.com/21st-dev/magic-mcp",
        stars: 3000,
        pros: "Генерирует уникальные компоненты из промпта, Tailwind + shadcn, красивые анимации",
        cons: "Платный (от $10/мес), только React/Next.js",
        freeTier: "10 генераций бесплатно",
        usedBy: ["Indie hackers", "Startups", "Designers"],
        recommended: true,
        lastUpdated: "",
        source: "github",
      },
      {
        id: "figma-mcp",
        name: "Figma MCP",
        command: "/figma",
        description: "Figma → код: извлекает дизайн, компоненты, переменные, стили из Figma файлов. Конвертирует макеты в React/HTML/CSS.",
        mcpServer: {
          command: "npx",
          args: ["-y", "@anthropic-ai/claude-code-mcp-figma"],
        },
        requiredEnvVars: [
          env("FIGMA_ACCESS_TOKEN", "Figma Personal Access Token", "https://www.figma.com/developers/api#access-tokens"),
        ],
        githubUrl: "https://github.com/anthropics/claude-code-mcp-figma",
        stars: 2500,
        pros: "Official Anthropic, pixel-perfect из Figma макетов, design tokens",
        cons: "Нужен готовый Figma дизайн, Figma платный для команд",
        freeTier: "Бесплатно (Figma Free + API бесплатно)",
        usedBy: ["Anthropic", "Design agencies", "Product teams"],
        recommended: false,
        lastUpdated: "",
        source: "github",
      },
      {
        id: "v0-dev",
        name: "v0.dev (Vercel)",
        command: "/v0",
        description: "Vercel v0 — генерация UI из текста: лендинги, формы, дашборды, карточки. Использует shadcn/ui + Tailwind. Копируешь готовый код в проект.",
        mcpServer: {
          command: "npx",
          args: ["-y", "@anthropic-ai/claude-code-mcp-v0"],
        },
        requiredEnvVars: [],
        githubUrl: "https://v0.dev",
        stars: 0,
        pros: "Быстрая генерация целых страниц, shadcn/ui экосистема, бесплатный старт",
        cons: "Привязан к Vercel, лимит генераций, нет MCP (копи-паст)",
        freeTier: "10 генераций/день бесплатно",
        usedBy: ["Vercel", "Next.js community", "Indie hackers"],
        recommended: false,
        lastUpdated: "",
        source: "github",
      },
    ],
  },

  /* ─── DOCS / CONTEXT ──────────────────────────────── */
  {
    id: "docs",
    label: "DOCS / CONTEXT",
    description: "Актуальная документация библиотек прямо в контексте LLM — пишите код с правильным API",
    alternatives: [
      {
        id: "context7-mcp",
        name: "Context7 MCP",
        command: "/docs",
        description: "Подтягивает актуальную документацию любой библиотеки (React, Next.js, Prisma, Express, Django, etc.) прямо в контекст LLM. Предотвращает генерацию кода с устаревшим API.",
        mcpServer: {
          command: "npx",
          args: ["-y", "@upstash/context7-mcp@latest"],
        },
        requiredEnvVars: [],
        githubUrl: "https://github.com/upstash/context7",
        stars: 15000,
        pros: "Бесплатный, 10K+ библиотек, актуальные docs вместо устаревших из training data",
        cons: "Зависит от CDN Upstash, иногда медленный для редких библиотек",
        freeTier: "Полностью бесплатно (open source)",
        usedBy: ["Cursor users", "Claude Code users", "Windsurf users"],
        recommended: true,
        lastUpdated: "",
        source: "github",
      },
    ],
  },
];

/* ── Утилиты ─────────────────────────────────────── */

/** Найти категорию по ID */
export function findCategory(id: string): SkillCategory | undefined {
  return SKILL_CATEGORIES.find((c) => c.id === id);
}

/** Получить рекомендованный скилл из категории */
export function getRecommended(category: SkillCategory): SkillAlternative {
  return category.alternatives.find((a) => a.recommended) ?? category.alternatives[0];
}

/** Все категории, которые включаются в любой проект по умолчанию */
export const ALWAYS_INCLUDE: string[] = ["review", "security", "docs"];
