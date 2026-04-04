/**
 * Skill Matcher — анализирует описание проекта и определяет,
 * какие категории скиллов нужны.
 *
 * Работает на простом keyword mapping (MVP).
 * В MCP-режиме не используется — LLM сама решает по каталогу.
 */

import { ALWAYS_INCLUDE } from "./registry.js";

/**
 * Маппинг: ключевое слово → категории скиллов, которые нужны.
 *
 * Поддерживает:
 * - Прямые технологии: "stripe" → payments
 * - Абстрактные фичи: "login" → auth
 * - Составные типы проектов: "saas" → auth + payments + database
 */
const KEYWORD_TO_CATEGORIES: Record<string, string[]> = {
  // Auth
  auth: ["auth"],
  login: ["auth"],
  signup: ["auth"],
  register: ["auth"],
  user: ["auth", "database"],
  users: ["auth", "database"],
  oauth: ["auth"],
  sso: ["auth"],
  firebase: ["auth"],

  // Payments
  payment: ["payments"],
  payments: ["payments"],
  pay: ["payments"],
  stripe: ["payments"],
  subscription: ["payments"],
  billing: ["payments"],
  invoice: ["payments", "email"],
  checkout: ["payments"],
  pricing: ["payments"],
  monetize: ["payments"],
  booking: ["payments", "auth", "database"],
  appointment: ["payments", "auth", "database"],
  order: ["payments", "database"],
  orders: ["payments", "database"],
  buy: ["payments"],
  purchase: ["payments"],
  online: ["payments", "deploy"],
  portal: ["auth", "database"],
  cabinet: ["auth", "database"],
  account: ["auth", "database"],
  profile: ["auth", "database"],

  // Database
  database: ["database"],
  db: ["database"],
  postgres: ["database"],
  supabase: ["database"],
  sql: ["database"],
  data: ["database"],
  store: ["database"],
  crud: ["database"],
  neon: ["database"],

  // AI
  ai: ["ai"],
  chatbot: ["ai"],
  gpt: ["ai"],
  llm: ["ai"],
  openai: ["ai"],
  anthropic: ["ai"],
  claude: ["ai"],
  embedding: ["ai"],
  generate: ["ai"],
  assistant: ["ai"],

  // Email
  email: ["email"],
  emails: ["email"],
  mail: ["email"],
  newsletter: ["email"],
  resend: ["email"],

  // Video / Media
  video: ["video"],
  videos: ["video"],
  stream: ["video"],
  streaming: ["video"],
  media: ["video", "storage"],
  upload: ["video", "storage"],
  thumbnail: ["video"],
  transcode: ["video"],
  ffmpeg: ["video"],
  mux: ["video"],
  cloudinary: ["video"],

  // Storage / CDN
  storage: ["storage"],
  s3: ["storage"],
  cdn: ["storage"],
  file: ["storage"],
  files: ["storage"],
  bucket: ["storage"],
  cloudflare: ["storage"],
  r2: ["storage"],
  image: ["storage"],
  images: ["storage"],

  // Analytics
  analytics: ["analytics"],
  tracking: ["analytics"],
  metrics: ["analytics"],
  funnel: ["analytics", "marketing"],
  posthog: ["analytics"],
  mixpanel: ["analytics"],

  // Monitoring
  monitoring: ["monitoring"],
  errors: ["monitoring"],
  logging: ["monitoring"],
  sentry: ["monitoring"],
  grafana: ["monitoring"],
  datadog: ["monitoring"],
  observability: ["monitoring"],
  apm: ["monitoring"],

  // CMS
  cms: ["cms"],
  content: ["cms"],
  blog: ["auth", "database", "cms"],
  articles: ["cms"],
  sanity: ["cms"],
  contentful: ["cms"],
  strapi: ["cms"],
  headless: ["cms"],

  // Search
  search: ["search"],
  fulltext: ["search"],
  autocomplete: ["search"],
  elasticsearch: ["search"],
  typesense: ["search"],
  meilisearch: ["search"],
  algolia: ["search"],

  // Cache
  cache: ["cache"],
  caching: ["cache"],
  redis: ["cache"],
  upstash: ["cache"],
  session: ["cache", "auth"],

  // Notifications
  notification: ["notifications"],
  notifications: ["notifications"],
  push: ["notifications"],
  alert: ["notifications"],
  sms: ["notifications"],
  novu: ["notifications"],

  // Testing
  test: ["testing"],
  testing: ["testing"],
  e2e: ["testing"],
  playwright: ["testing", "browser"],
  cypress: ["testing"],
  automation: ["testing", "browser"],

  // Deploy
  deploy: ["deploy"],
  hosting: ["deploy"],
  vercel: ["deploy"],
  netlify: ["deploy"],
  railway: ["deploy"],
  coolify: ["deploy"],
  production: ["deploy"],
  vps: ["deploy"],
  selfhosted: ["deploy"],

  // Game keywords
  game: ["auth", "database", "cache"],
  multiplayer: ["auth", "database", "cache"],
  leaderboard: ["auth", "database"],
  leaderboards: ["auth", "database"],
  realtime: ["database", "cache"],
  websocket: ["database", "cache"],
  simulation: ["ai"],
  physics: ["ai"],
  player: ["auth", "database"],
  score: ["database"],

  // ═══ Business Planning — broad triggers ═══
  // The agent itself figures out industry specifics via research.
  // We only need enough keywords to activate the business roles.

  // EN: core business words
  business: ["business-plan", "financial-analysis", "market-research", "strategy", "marketing", "auth", "database", "design", "deploy"],
  sell: ["business-plan", "payments", "marketing"],
  selling: ["business-plan", "payments", "marketing"],
  sales: ["business-plan", "payments", "marketing"],
  profit: ["business-plan", "financial-analysis"],
  revenue: ["business-plan", "financial-analysis"],
  investment: ["business-plan", "financial-analysis"],
  roi: ["business-plan", "financial-analysis"],
  margin: ["business-plan", "financial-analysis"],
  export: ["business-plan", "strategy", "market-research"],
  import: ["business-plan", "strategy"],
  logistics: ["business-plan", "strategy"],
  shipping: ["business-plan", "strategy"],
  customs: ["business-plan", "strategy"],
  franchise: ["business-plan", "strategy"],
  scaling: ["business-plan", "strategy"],
  strategy: ["strategy"],
  competitive: ["strategy", "market-research"],
  competitor: ["strategy", "market-research"],
  competitors: ["strategy", "market-research"],
  rental: ["business-plan", "payments", "auth", "database", "design", "deploy"],
  rent: ["business-plan", "payments", "auth", "database"],
  hotel: ["business-plan", "payments", "auth", "database", "design", "deploy"],

  // RU: core business words — broad triggers
  "бизнес": ["business-plan", "financial-analysis", "market-research", "strategy", "marketing", "auth", "database", "design", "deploy"],
  "продажа": ["business-plan", "payments", "marketing"],
  "продавать": ["business-plan", "payments", "marketing"],
  "продажи": ["business-plan", "payments", "marketing"],
  "продаж": ["business-plan", "payments", "marketing"],
  "прибыль": ["business-plan", "financial-analysis"],
  "доход": ["business-plan", "financial-analysis"],
  "выручка": ["business-plan", "financial-analysis"],
  "вложения": ["business-plan", "financial-analysis"],
  "инвестиции": ["business-plan", "financial-analysis"],
  "окупаемость": ["business-plan", "financial-analysis"],
  "рентабельность": ["business-plan", "financial-analysis"],
  "амортизация": ["business-plan", "financial-analysis"],
  "маржа": ["business-plan", "financial-analysis"],
  "выхлоп": ["business-plan", "financial-analysis"],
  "масштабирование": ["business-plan", "strategy"],
  "масштабировать": ["business-plan", "strategy"],
  "план": ["business-plan"],
  "экспорт": ["business-plan", "strategy", "market-research"],
  "импорт": ["business-plan", "strategy"],
  "логистика": ["business-plan", "strategy"],
  "доставка": ["business-plan", "strategy"],
  "таможня": ["business-plan", "strategy"],
  "перевозка": ["business-plan", "strategy"],
  "лицензия": ["business-plan", "strategy"],
  "рынок": ["market-research", "strategy"],
  "конкуренты": ["strategy", "market-research"],
  "стратегия": ["strategy"],
  "клиенты": ["business-plan", "market-research"],
  "аренда": ["business-plan", "payments", "auth", "database", "design", "deploy"],
  "прокат": ["business-plan", "payments", "auth", "database", "design", "deploy"],

  // Marketing / SEO
  marketing: ["marketing"],
  seo: ["marketing"],
  landing: ["marketing", "design", "deploy"],
  landingpage: ["marketing", "design", "deploy"],
  conversion: ["marketing"],
  copywriting: ["marketing"],
  meta: ["marketing"],
  leads: ["marketing", "email"],
  clinic: ["business-plan", "marketing", "auth", "database", "design", "deploy", "payments"],
  restaurant: ["business-plan", "marketing", "auth", "database", "design", "deploy", "payments"],
  salon: ["business-plan", "marketing", "auth", "database", "design", "deploy", "payments"],
  agency: ["marketing", "auth", "database", "design", "deploy"],

  // Design / UI
  design: ["design"],
  ui: ["design"],
  figma: ["design"],
  beautiful: ["design"],
  component: ["design"],
  components: ["design"],
  tailwind: ["design"],
  shadcn: ["design"],
  animation: ["design"],
  responsive: ["design"],
  theme: ["design"],
  template: ["design"],
  v0: ["design"],

  // Docs / Context (always included, but also keyword-matchable)
  context7: ["docs"],
  documentation: ["docs"],
  library: ["docs"],
  framework: ["docs"],

  // Communication
  slack: ["communication"],
  discord: ["communication"],
  telegram: ["communication"],
  chat: ["ai", "communication"],
  messaging: ["communication", "notifications"],

  // Project Management
  jira: ["project-management"],
  linear: ["project-management"],
  github: ["project-management"],
  gitlab: ["project-management"],
  trello: ["project-management"],
  project: ["project-management", "database"],
  kanban: ["project-management"],
  sprint: ["project-management"],
  agile: ["project-management"],
  issues: ["project-management"],

  // Documents
  notion: ["documents"],
  gdrive: ["documents"],
  docs: ["documents"],
  sheets: ["documents"],
  spreadsheet: ["documents"],
  document: ["documents"],
  wiki: ["documents", "cms"],

  // Browser Automation
  browser: ["browser"],
  scraper: ["browser"],
  scraping: ["browser"],
  puppeteer: ["browser"],
  selenium: ["browser"],
  crawl: ["browser"],
  crawler: ["browser"],

  // Составные типы проектов
  saas: ["auth", "payments", "database", "analytics", "monitoring", "design"],
  ecommerce: ["business-plan", "auth", "payments", "database", "email", "search", "analytics", "design"],
  shop: ["business-plan", "auth", "payments", "database", "search", "design"],
  marketplace: ["business-plan", "auth", "payments", "database", "email", "search", "notifications", "design"],
  dashboard: ["auth", "database", "analytics", "design"],
  crm: ["auth", "database", "email", "search", "communication"],
  website: ["auth", "database", "design", "deploy", "marketing"],
  site: ["design", "deploy", "marketing"],
  portfolio: ["design", "deploy", "marketing"],
  api: ["database", "deploy", "monitoring"],
  platform: ["auth", "payments", "database", "email", "analytics", "monitoring", "project-management"],
  app: ["auth", "database"],
  b2b: ["business-plan", "auth", "payments", "database", "email", "analytics"],
  b2c: ["business-plan", "auth", "payments", "database", "email", "notifications"],
  startup: ["business-plan", "financial-analysis", "strategy", "auth", "payments", "database", "email", "analytics", "deploy"],
};

/**
 * Анализирует описание проекта и возвращает уникальный список
 * категорий скиллов, которые нужны для этого проекта.
 *
 * Всегда включает: review, security.
 */
export function matchCategories(projectDescription: string): string[] {
  const words = tokenize(projectDescription);
  const matched = new Set<string>(ALWAYS_INCLUDE);

  // Match single words
  for (const word of words) {
    const categories = KEYWORD_TO_CATEGORIES[word];
    if (categories) {
      for (const cat of categories) {
        matched.add(cat);
      }
    }
  }

  // Match bigrams (two consecutive words) for multi-word keywords
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    const categories = KEYWORD_TO_CATEGORIES[bigram];
    if (categories) {
      for (const cat of categories) {
        matched.add(cat);
      }
    }
  }

  // Если ничего кроме дефолтных не нашли — добавляем минимальный набор
  if (matched.size === ALWAYS_INCLUDE.length) {
    matched.add("auth");
    matched.add("database");
    matched.add("docs");
  }

  return Array.from(matched);
}

/**
 * Разбивает строку на нормализованные слова.
 * Поддерживает: английский, русский, разделители, camelCase.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase → отдельные слова
    .split(/[\s,.\-_/|;:!?()[\]{}'"]+/) // разделители
    .filter((w) => w.length >= 2);
}
